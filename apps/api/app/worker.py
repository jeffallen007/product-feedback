"""Durable analysis worker for the Railway background service."""

import logging
import os
import signal
import socket
from threading import Event, Thread

from app.api.dependencies import get_analysis_run_service
from app.clients.supabase import SupabaseRestClient
from app.config import get_settings

logger = logging.getLogger(__name__)
LEASE_SECONDS = 120
POLL_SECONDS = 2


def run_worker() -> None:
    logging.basicConfig(level=logging.INFO)
    stopped = Event()
    signal.signal(signal.SIGTERM, lambda *_: stopped.set())
    signal.signal(signal.SIGINT, lambda *_: stopped.set())
    worker_id = f"{socket.gethostname()}:{os.getpid()}"
    supabase = SupabaseRestClient.from_settings(get_settings())
    logger.info("Analysis worker started. worker_id=%s", worker_id)

    while not stopped.is_set():
        try:
            claimed = supabase.rpc(
                "claim_next_analysis_run",
                {"p_worker_id": worker_id, "p_lease_seconds": LEASE_SECONDS},
            )
            if not isinstance(claimed, list) or not claimed:
                stopped.wait(POLL_SECONDS)
                continue
            run = claimed[0]
            if not isinstance(run, dict):
                raise RuntimeError("Worker claim returned an invalid analysis run.")

            heartbeat_stop = Event()
            heartbeat = Thread(
                target=_renew_lease,
                args=(supabase, run, worker_id, heartbeat_stop),
                daemon=True,
            )
            heartbeat.start()
            try:
                get_analysis_run_service().process_queued_run(run, worker_id=worker_id)
            except Exception:
                logger.exception("Analysis job failed. analysis_run_id=%s", run["id"])
                get_analysis_run_service().fail_queued_run(run, worker_id=worker_id)
            finally:
                heartbeat_stop.set()
                heartbeat.join(timeout=5)
        except Exception:
            logger.exception("Analysis worker loop error.")
            stopped.wait(POLL_SECONDS)

    logger.info("Analysis worker stopped. worker_id=%s", worker_id)


def _renew_lease(
    supabase: SupabaseRestClient,
    run: dict[str, object],
    worker_id: str,
    stopped: Event,
) -> None:
    while not stopped.wait(LEASE_SECONDS / 3):
        try:
            renewed = supabase.rpc(
                "renew_analysis_run_lease",
                {
                    "p_run_id": str(run["id"]),
                    "p_worker_id": worker_id,
                    "p_attempt_count": int(run["attempt_count"]),
                    "p_lease_seconds": LEASE_SECONDS,
                },
            )
            if renewed is not True:
                logger.warning("Analysis run lease was lost. analysis_run_id=%s", run["id"])
                return
        except Exception:
            logger.exception("Analysis run lease renewal failed. analysis_run_id=%s", run["id"])


if __name__ == "__main__":
    run_worker()
