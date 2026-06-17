# AI Product Feedback Synthesizer Implementation Plan

## Purpose

This document turns the initial repo assessment into an execution-ready implementation plan for the first production build of the AI Product Feedback Synthesizer.

This plan assumes:

- the current repository is a root-level v0 frontend prototype
- no application code should be restructured yet
- implementation should proceed in phases that preserve the current polished UX while replacing mock behavior with real services

## Current Starting Point

The current repo is a frontend-first prototype with:

- a polished Next.js app at the repository root
- static mock flows for demo/custom setup
- static dashboard and chatbot data
- no real backend
- no persistence
- no ingestion pipelines
- no MCP layer
- no ML classifier
- no deployment-ready split between frontend and backend

This is a good starting point for a UI-first vertical slice, but it is not yet a production architecture.

## Recommended Repo Structure

Target structure:

```text
apps/
  web/                  # Next.js frontend for Vercel
  api/                  # FastAPI backend for Railway

packages/
  contracts/            # Shared TypeScript/JSON contracts
  config/               # Shared lint, tsconfig, tooling

supabase/
  migrations/           # SQL migrations
  seeds/                # Demo dataset seed logic

ml/
  training/             # Classifier training scripts
  artifacts/            # Saved model artifacts
  eval/                 # Lightweight evaluation outputs

data/
  demo/                 # Demo feedback datasets

docs/
  ...                   # PRD, architecture docs, planning docs
```

### Responsibility split

`apps/web`

- public user interface
- entry flow
- source selection and review
- processing state
- dashboard rendering
- chat interface

`apps/api`

- REST API for frontend
- synthesis orchestration
- source ingestion
- MCP server mounting
- ML inference
- LLM calls
- X integration
- Supabase persistence

`packages/contracts`

- shared data contracts
- payload validation schemas
- shared enums and type definitions

`supabase`

- schema migrations
- seed scripts
- local project config if introduced later

`ml`

- training code separate from inference code
- artifact versioning

`data/demo`

- curated product demo datasets

## Migration Steps From Current Root-Level v0 Prototype

These steps describe how to move from the current prototype to the target structure without breaking momentum.

### Step 1: Formalize contracts in place

Before moving files:

- define shared TypeScript interfaces for dashboard, chat, and workflow entities
- update mock data to conform to those contracts
- ensure current UI remains stable

Reason:

The current UI should be stabilized around real contract shapes before any structural move.

### Step 2: Introduce backend and data directories without moving frontend yet

Add, but do not yet fully migrate:

- `apps/api`
- `packages/contracts`
- `supabase`
- `ml`
- `data/demo`

Reason:

This allows backend and data work to begin without immediately forcing a Next.js move.

### Step 3: Build the demo vertical slice from the existing frontend

Using the existing root app:

- create FastAPI backend
- create Supabase schema
- seed demo datasets
- wire the current demo path to backend APIs

Reason:

The first goal is to prove the real product loop, not to optimize the repo layout first.

### Step 4: Move the frontend into `apps/web`

Only after the demo path is stable:

- move the current root Next.js app into `apps/web`
- preserve behavior exactly during move
- update package/workspace config

Reason:

Moving the UI too early adds churn with little product value.

### Step 5: Centralize shared contracts

After `apps/web` exists:

- move interfaces and fixtures into `packages/contracts`
- update frontend and backend imports

### Step 6: Add ingestion and chat features

Build additional sources after the demo slice:

- CSV upload
- pasted feedback
- chat
- X search

### Step 7: Harden deployment and tests

After core product behavior is working:

- preview deployments
- smoke tests
- parser tests
- contract validation
- run monitoring

## Recommended Milestone Sequence

### Milestone 1: Contract-first stabilization

Goal:

Preserve the current frontend prototype but formalize its data model.

Build:

- first-pass contracts
- typed mock fixtures
- frontend data model cleanup

Deliverable:

- stable mock-driven UI using approved contract shapes

### Milestone 2: Demo dataset vertical slice

Goal:

Prove the full product loop with one real source.

Build:

- Supabase schema
- FastAPI backend scaffold
- demo dataset ingestion
- synthesis orchestration
- dashboard fetch endpoint

Deliverable:

- a user selects a demo dataset, synthesizes, and sees a real generated dashboard

### Milestone 3: ML-backed analysis layer

Goal:

Show the product is more than an LLM wrapper.

Build:

- baseline classifier
- persisted classifications
- richer structured analysis outputs

Deliverable:

- real category classification and analysis outputs in the synthesis flow

### Milestone 4: Custom source ingestion

Goal:

Allow visitors to bring their own feedback.

Build:

- CSV upload flow
- pasted feedback flow
- normalization and validation

Deliverable:

- custom feedback set analysis from user-provided inputs

### Milestone 5: Grounded chatbot

Goal:

Support follow-up Q&A on the current analysis run.

Build:

- chat API
- scoped retrieval
- evidence-aware responses

Deliverable:

- analysis-aware chatbot answers tied to stored run outputs

### Milestone 6: X integration

Goal:

Add one live external source.

Build:

- backend X query integration
- rate-limit handling
- source attribution in dashboard and chat

Deliverable:

- recent public social feedback analysis

### Milestone 7: Launch hardening

Goal:

Make the product portfolio-ready for public review.

Build:

- deployment hardening
- test coverage on critical flows
- monitoring and error handling
- docs refresh

Deliverable:

- production-quality public demo

## Build Order

### Build first

1. Shared contracts and typed mock fixtures
2. Backend scaffold
3. Supabase schema and demo dataset seeds
4. Demo dataset ingestion
5. Synthesis orchestration
6. Dashboard payload generation
7. Mounted MCP server with core tools
8. Baseline ML classifier
9. Frontend demo path wired to live data

### Build second

1. CSV upload ingestion
2. Pasted feedback ingestion
3. Analysis-aware chat

### Build third

1. X source ingestion
2. Improved failure states and run monitoring
3. Frontend move into `apps/web`

## Deferred Items

These items should be explicitly deferred from the initial build unless implementation proves trivial.

- user authentication
- team workspaces
- billing
- shareable dashboard URLs
- report export
- direct integrations beyond X
- enterprise privacy controls
- separate worker infrastructure
- standalone MCP deployment
- pgvector
- embeddings-based semantic retrieval
- fine-tuned LLM
- advanced model training UI
- advanced analytics/admin tools

## Risks and Unknowns

### Classifier data quality

The best public or synthetic dataset mix for the first classifier is unresolved. Weak training data could reduce credibility.

### X API constraints

X rate limits, availability, or cost may force a narrower initial scope than the PRD suggests.

### Public unauthenticated uploads

This creates abuse, storage, and privacy risk. Validation, caps, and warnings are required even in v1.

### Job execution model

If synthesis runs are slower or more concurrent than expected, the single-service background execution model may need to be revisited.

### MCP overhead

MCP is valuable for the technical story, but it should remain pragmatic. Overbuilding the MCP layer early would slow delivery.

### Chat quality without embeddings

The non-vector retrieval approach may be sufficient for v1, but that must be validated with realistic demo and uploaded datasets.

### Demo dataset quality

The seeded demo experience is central to the portfolio story. Weak demo data will make the product feel shallow even if the architecture is sound.

## Recommended First Real Vertical Slice

The first real implementation target should be:

> Productivity Tool demo dataset -> synthesis trigger -> backend ingestion -> normalization -> ML classification -> theme generation -> dashboard synthesis -> persisted analysis run -> live dashboard render

This should be built before:

- uploads
- X integration
- real chatbot
- repo restructuring

That is the highest-leverage path because it proves the full system loop with the least operational complexity.
