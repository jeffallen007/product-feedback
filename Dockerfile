FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY apps/mcp/requirements.txt ./apps/mcp/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir -r apps/mcp/requirements.txt

COPY apps/mcp ./apps/mcp

CMD ["python", "-m", "apps.mcp.server"]