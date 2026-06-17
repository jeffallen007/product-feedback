# UI Notes: AI Product Feedback Synthesizer

## Purpose

These notes document the intended v1 UX direction so implementation work preserves the product model and avoids collapsing distinct concepts.

The app is a public portfolio demo for hiring managers. It should feel like a polished B2B SaaS product, not a generic chatbot or wireframe.

## Core UX Principle

Separate these concepts clearly:

1. **Analysis Target** — the product being analyzed.
2. **Feedback Sources** — the data sources included in the feedback set.

Example:

- Analysis Target: Productivity Tool
- Feedback Sources:
  - Productivity Tool Demo Dataset
  - X Search: “Monday.com notifications”
  - Pasted Reviews

The UI should never imply that Fitness App, CRM Tool, and Productivity Tool are three simultaneous sources in the same analysis. They are demo product choices. The user selects one demo product.

## Entry Paths

### Try Demo Dataset

Fast path for hiring managers who want to see the app work immediately.

Flow:

1. User clicks **Try Demo Dataset**.
2. User chooses exactly one demo product:
   - Fitness App
   - CRM Tool
   - Productivity Tool
3. User lands on Review Feedback Set with one source:
   - Selected Demo Dataset
4. User can optionally add another feedback source.

### Build Custom Feedback Set

Custom path for users who want to bring their own data.

Flow:

1. User clicks **Build Custom Feedback Set**.
2. User enters product context:
   - Product Name
   - Product Description
3. User chooses one or more feedback sources:
   - Upload CSV
   - Paste Feedback
   - Search X
4. User configures selected sources.
5. User reviews feedback set.
6. User synthesizes.

## Required Product Context for Custom Path

Before selecting or configuring sources, collect:

- **Product Name**
- **Product Description**

Helper copy:

> Give the AI enough context to interpret feedback correctly.

Example placeholder:

- Product Name: Acme Project Management
- Product Description: A B2B productivity tool for managing projects, tasks, notifications, and cross-functional workflows.

## Feedback Sources

v1 supports:

- Demo Dataset
- CSV Upload
- Pasted Feedback
- X Search

For the default custom path, show:

- Upload CSV
- Paste Feedback
- Search X

Do not show Demo Dataset as a default custom source. Demo Dataset belongs primarily to the fast demo path. However, from the Review step, users may optionally add another source to enrich the analysis.

## Demo Product Choices

Demo Dataset path should show exactly three product cards:

1. Fitness App
   - Description: Workout tracking, subscriptions, and device sync feedback.
   - Example count: 356 items

2. CRM Tool
   - Description: Pipeline, reporting, and integration feedback from sales teams.
   - Example count: 514 items

3. Productivity Tool
   - Description: Tasks, notifications, and collaboration feedback from teams.
   - Example count: 482 items

Only one demo product may be selected.

## Review Feedback Set Page

The Review page should always show two separate sections.

### Analysis Target

Show:

- Product name
- Product description

Examples:

- Productivity Tool
- Tasks, notifications, and collaboration feedback from teams.

### Sources in This Feedback Set

Show only configured sources, with one card per source.

Each source card should include:

- Source type badge
- Source label
- Item count
- Status
- Remove option

Example cards:

- Productivity Tool Demo Dataset — Demo Dataset — 482 items — Ready
- X Search: “Monday.com notifications” — X Search — 86 posts — Ready
- Pasted Reviews — Pasted Feedback — 24 items — Ready

## Analysis Controls

The analysis controls belong on the Review page, not the landing page.

Show:

- Total feedback items
- Sources included
- Analysis goal dropdown
- Primary CTA: **Synthesize Feedback Set**
- Secondary CTA: **Back to Sources**
- Optional link/button: **Add another feedback source**

Default analysis goal:

- Full Product Feedback Synthesis

Other analysis goals:

- Identify Top Pain Points
- Find Feature Requests
- Prioritize Roadmap Opportunities
- Summarize Sentiment
- Identify Churn / Retention Risks

## Capability Preview

The landing page may include a compact informational section titled:

> What the synthesis can produce

Capability chips:

- Top pain points
- Feature requests
- Sentiment overview
- Roadmap priorities
- Churn / retention risks
- Representative quotes
- Follow-up chatbot analysis

These should be informational only, not active controls.

## Processing State

After clicking **Synthesize Feedback Set**, show a polished multi-step workflow:

1. Creating feedback set
2. Ingesting sources
3. Normalizing feedback
4. Merging and deduplicating items
5. Running ML classification
6. Detecting sentiment and themes
7. Retrieving representative quotes
8. Generating dashboard

Include subtle architecture storytelling:

> Input Sources → MCP Tools → ML Classification → LLM Synthesis → Dashboard → Chat Follow-up

## Privacy Notice

Include privacy notices in two places:

1. Near CSV upload and pasted feedback configuration panels:

> Do not upload sensitive or confidential information. Uploaded data may be processed by AI services.

2. Near the final Synthesize Feedback Set CTA:

> By synthesizing this feedback set, you acknowledge that uploaded or pasted data may be processed by AI services.

Keep this professional and visible but not alarmist.

## Visual Style

- Modern B2B SaaS
- Polished dashboard-quality interface
- White/light neutral background
- Strong spacing and visual hierarchy
- High-quality shadcn/ui-style cards
- Subtle gradients only if tasteful
- Crisp typography
- Credible for AI product hiring managers
- Desktop-first but responsive

## Screens to Preserve / Build

v1 should include at least these UI states:

1. Landing page
2. Demo product selection
3. Custom product context entry
4. Source selection
5. Configure selected sources
6. Review feedback set
7. Processing state
8. Post-synthesis dashboard
9. Dashboard with chatbot follow-up panel

## Implementation Note

The UI prototype should remain mock-data-first until the dashboard and chatbot states are approved. Avoid wiring backend logic into the first UI implementation pass unless explicitly requested.
