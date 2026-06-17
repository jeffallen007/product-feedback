# PRD: AI Product Feedback Synthesizer — v1

## 1. Product Overview

**Product Name:** AI Product Feedback Synthesizer
**Version:** v1
**Primary Audience:** Hiring managers, product leaders, AI product teams, and technical evaluators reviewing a public portfolio project.
**Primary User:** A visitor evaluating the app through a self-guided demo, user upload, pasted feedback, or a live X-sourced feedback search.

AI Product Feedback Synthesizer is a public-facing agentic AI application that turns messy product feedback into structured product insights. Users can select a demo dataset, upload feedback, paste raw comments, or pull recent public feedback from X. The system then synthesizes the feedback into a polished dashboard and supports follow-up questions through a chatbot.

The product should showcase more than a basic chatbot. It should demonstrate an end-to-end AI product system combining data ingestion, lightweight ML classification, LLM synthesis, true MCP-based tool orchestration, Supabase persistence, Railway-hosted backend services, and a polished Vercel-hosted user experience.

---

## 2. Product Goal

The goal of v1 is to create a clear, impressive, and easy-to-use public demo that shows how agentic AI can help product teams convert unstructured customer feedback into actionable roadmap intelligence.

The intended 60-second product story is:

> Choose demo data, upload feedback, paste feedback, or search X → run synthesis → view a polished dashboard → ask follow-up questions.

---

## 3. Background and Project Intent

This project is intended as a portfolio-quality AI product demonstration for hiring conversations. It should be credible to both product and technical hiring managers by showing product judgment, modern AI architecture, and hands-on implementation ability.

The project should avoid looking like a simple LLM wrapper. The system should make visible that the product uses multiple coordinated layers: ingestion, storage, classification, clustering, retrieval, synthesis, dashboard generation, and chatbot interaction.

---

## 4. Target Users

### Primary User

A hiring manager or product/AI leader evaluating the builder’s ability to design and ship AI-enabled product systems.

### Secondary User

A product manager, founder, or operator who wants to quickly understand themes in customer feedback.

---

## 5. v1 User Experience

### Core Flow

1. User lands on the app.
2. User chooses one input path:

   * Select a preloaded demo dataset.
   * Upload a CSV.
   * Paste raw feedback text.
   * Search X for recent public feedback.
3. User selects an analysis goal.
4. User clicks **Synthesize Feedback**.
5. System processes feedback through the agentic workflow.
6. User views a polished dashboard with structured insights.
7. User asks follow-up questions through the chatbot.

### Design Principle

The experience should be demo-first. A visitor should not need an account, personal credentials, API keys, or external data-source access to experience the product.

The app should feel like a polished SaaS dashboard, not a technical prototype.

---

## 6. Demo Datasets

v1 should include three preloaded demo datasets.

### Dataset Categories

1. **Fitness App**

   * Inspired by products like Strava or Peloton.
   * Feedback themes may include tracking accuracy, workout content, social features, subscription value, device integrations, and motivation.

2. **CRM Tool**

   * Inspired by products like Attio or Zoho CRM.
   * Feedback themes may include contact management, sales pipeline UX, integrations, automation, reporting, onboarding, and pricing.

3. **Productivity Tool**

   * Inspired by products like Asana or Monday.com.
   * Feedback themes may include task management, collaboration, notifications, dashboards, templates, and workflow complexity.

Demo datasets should be publicly sourced where possible. The user will handle sourcing as a separate task.

---

## 7. v1 Input Sources

v1 should support four input paths.

### 1. Demo Dataset

User selects one of the three preloaded datasets.

### 2. CSV Upload

User uploads a CSV containing product feedback.

### 3. Raw Text Paste

User pastes comments, reviews, survey responses, or support notes.

### 4. X Integration

User enters a product, brand, handle, or keyword query. The system retrieves recent public posts from X and treats them as product feedback inputs.

The X integration should use app-owned credentials behind the scenes. Public users should not need to authenticate with X.

The X path should be positioned as recent public conversation analysis, not a complete historical review source.

---

## 8. Upload Requirements

### Supported Input Types

* CSV upload
* Raw text paste

### CSV Requirements

The app should support a flexible CSV format. At minimum, it should detect or map a text/comment column.

Recommended supported columns:

* `comment`
* `feedback`
* `review`
* `rating`
* `source`
* `date`
* `user_segment`
* `product_area`

If the app cannot identify a feedback text column, it should ask the user to select one.

### Raw Text Requirements

Users should be able to paste multiple comments, reviews, survey responses, or support notes into a text box. The system should split the pasted text into individual feedback items where possible.

### Upload Size Limit

Upload size limit remains a technical open question for Codex/implementation review.

---

## 9. Analysis Goals

Before running synthesis, the user should be able to choose an analysis goal.

v1 analysis goal options:

* Full Product Feedback Synthesis
* Identify top pain points
* Find feature requests
* Prioritize roadmap opportunities
* Summarize sentiment
* Identify churn or retention risks
* Generate product strategy recommendations

The default option should be **Full Product Feedback Synthesis**.

---

## 10. Dashboard Output

The primary v1 output is an interactive dashboard.

### Dashboard Sections

#### 1. Executive Summary

A short natural-language summary of the feedback dataset, including major themes, overall sentiment, and recommended focus areas.

#### 2. Top Feedback Themes

A ranked list of themes discovered in the feedback.

Each theme should include:

* Theme name
* Short description
* Percentage or count of feedback items
* Sentiment indicator
* Suggested priority

#### 3. Sentiment Overview

A simple sentiment breakdown:

* Positive
* Neutral
* Negative
* Mixed

#### 4. Feedback Classification Summary

A summary of ML or model-derived categories, such as:

* Bug report
* Feature request
* UX issue
* Pricing concern
* Performance issue
* Onboarding friction
* Positive feedback
* Support complaint
* Churn risk

#### 5. Pain Point Cards

Each major pain point should include:

* Pain point title
* What users are saying
* Evidence count
* Representative quotes
* Likely product impact
* Recommended product action

#### 6. Feature Request Summary

A table or card layout showing common feature requests.

Each item should include:

* Feature request
* User need
* Suggested priority
* Supporting quote or evidence

#### 7. Roadmap Recommendations

A prioritized recommendation section organized as:

* Now
* Next
* Later

Each recommendation should include a short rationale.

#### 8. Representative Quotes

A section showing selected user quotes that support the top themes and recommendations.

---

## 11. Chatbot Follow-Up Experience

After synthesis, the user should be able to ask follow-up questions about the results.

### Example Follow-Up Questions

* “What should the product team prioritize first?”
* “Why is this theme ranked highest?”
* “Show me evidence for the onboarding issue.”
* “Which feedback suggests churn risk?”
* “What are the top feature requests?”
* “Turn this into a roadmap planning summary.”
* “What would you recommend for the next sprint?”

### Chatbot Requirements

The chatbot should answer using the current analysis context. It should retrieve relevant feedback, themes, classifications, and representative quotes before answering.

The chatbot does not need to cite evidence in every answer by default. It should provide supporting examples when the user asks for evidence, rationale, quotes, or source feedback.

---

## 12. Agentic Workflow

The system should use a multi-step agentic workflow behind the scenes.

### Core Workflow

1. Load or ingest feedback.
2. Normalize feedback into structured records.
3. Classify each feedback item.
4. Detect sentiment, severity, and potential churn risk.
5. Cluster feedback into themes.
6. Retrieve representative quotes.
7. Generate dashboard-ready summaries.
8. Store the analysis run.
9. Support chatbot follow-up questions.

---

## 13. MCP Requirements

v1 should use a true MCP server if feasible.

### Preferred v1 Architecture

The Railway backend should host:

* Agent orchestration service
* MCP server
* MCP tools
* ML inference logic
* LLM and embedding API calls

### MCP Tool Examples

v1 MCP tools may include:

* `load_demo_dataset`
* `parse_uploaded_feedback`
* `parse_pasted_feedback`
* `search_x_feedback`
* `normalize_feedback`
* `classify_feedback`
* `analyze_sentiment`
* `cluster_themes`
* `retrieve_representative_quotes`
* `generate_dashboard_summary`
* `answer_followup_question`
* `store_analysis_run`

The MCP layer should be part of the project’s technical story and documented clearly in the public GitHub repo.

---

## 14. X Integration Requirements

v1 should include one live external integration: X.

### User Experience

The user should be able to enter:

* Product name
* Company name
* X handle
* Keyword query

The app should retrieve recent public posts relevant to that query and pass them into the same synthesis workflow used for uploads and demo datasets.

### Example Queries

* `Peloton app`
* `@asana`
* `Zoho CRM support`
* `Monday.com dashboard`
* `Strava subscription`

### Requirements

* Public user should not authenticate with X.
* App should use backend-held X credentials.
* Retrieved posts should be stored as feedback records for the analysis run.
* X results should be labeled clearly as public social feedback.
* App should handle rate limits and failed X requests gracefully.
* X should not be positioned as exhaustive customer feedback.

---

## 15. ML Requirements

v1 should include a lightweight ML classification component.

### Purpose

The ML model should classify feedback into useful product categories.

Example categories:

* Bug report
* Feature request
* UX issue
* Pricing concern
* Performance issue
* Onboarding friction
* Positive feedback
* Support complaint
* Churn risk

### Training Dataset

The public dataset for training the initial classifier remains an open question.

### Acceptable v1 Approach

The model can be lightweight and pragmatic. For example:

* Scikit-learn classifier
* TF-IDF features
* Logistic regression or linear SVM
* Public or synthetic labeled dataset
* Saved model artifact loaded by the backend

The ML layer does not need to be state-of-the-art. It needs to demonstrate that the application includes a real trained model inside the product workflow.

---

## 16. Embeddings and Vector Search

Embeddings and pgvector are likely deferred from v1.

### v1 Approach

For v1, the app can use simpler retrieval patterns:

* `analysis_id`
* `theme_id`
* `category`
* `sentiment`
* keyword match
* representative quote selection

### Future v1.1 Enhancement

A future version may add embeddings and vector search for:

* More precise semantic retrieval
* Better follow-up chatbot answers
* Similar-feedback search
* More advanced theme clustering
* Cross-dataset comparison

The v1 schema should avoid blocking future embedding support.

---

## 17. High-Level Architecture

### Frontend: Vercel

The frontend should be hosted on Vercel and built with Next.js or a similar React-based framework.

Responsibilities:

* Landing page
* Demo dataset selector
* Upload and paste input UI
* X search input UI
* Analysis goal selector
* Synthesis trigger
* Dashboard display
* Chatbot interface

### Database and Storage: Supabase

Supabase should support:

* Demo datasets
* Uploaded feedback records
* X-sourced feedback records
* Analysis runs
* Classifications
* Theme clusters
* Representative quotes
* Chat history
* Generated dashboard summaries
* File storage for uploaded CSVs

### Backend: Railway

Railway should host:

* FastAPI backend
* Agent orchestration layer
* True MCP server
* MCP tools
* ML inference
* LLM calls
* Optional embedding calls
* Upload parsing and processing
* X integration logic

### External Services

Likely external services:

* LLM API
* X API
* Optional embedding API
* Optional public review/search APIs in later versions

---

## 18. Authentication and Access

v1 should not require public users to create an account.

The app should support anonymous demo usage.

Optional lightweight session handling may be used to preserve analysis state during a browser session.

---

## 19. Data Privacy and Retention

Because users may upload their own feedback data, the app should include clear language explaining that uploaded data may be processed by AI services.

v1 should include:

* Basic privacy notice
* File size limits
* Supported file type guidance
* Recommendation not to upload sensitive personal information
* Explanation that uploaded feedback may be stored for product demo functionality

Current retention assumption: **no automatic purge date in v1**.

This should be revisited before public launch if the app is expected to receive sensitive or proprietary user uploads.

---

## 20. Non-Goals for v1

v1 will not include:

* User authentication
* Team workspaces
* Payment or billing
* Direct integrations with Zendesk, Intercom, G2, App Store, Google Play, Salesforce, or other private systems
* Full admin dashboard
* Fine-tuned LLM
* Complex model training UI
* Exportable PDF or Markdown report
* Shareable dashboard URLs
* Multi-user collaboration
* Production-grade enterprise privacy controls
* Full semantic vector search unless easy to add

---

## 21. Success Criteria

v1 is successful if a hiring manager can:

* Understand the product’s value within 60 seconds.
* Run a demo dataset without assistance.
* Upload or paste their own feedback.
* Run a recent X-based feedback search.
* View a polished dashboard of synthesized insights.
* Ask follow-up questions and receive useful answers.
* Understand from the repo/docs that the app uses Vercel, Supabase, Railway, MCP, ML classification, X integration, and LLM synthesis.

---

## 22. Acceptance Criteria

### Demo Flow

* User can select one of three demo datasets.
* User can run synthesis without logging in.
* User receives dashboard output.

### Upload Flow

* User can upload a CSV.
* User can paste raw text.
* System can parse and process feedback records.
* User receives dashboard output from uploaded/pasted data.

### X Flow

* User can enter a product, handle, company, or keyword query.
* System retrieves recent public X posts.
* System processes X posts through the synthesis workflow.
* X-sourced feedback is labeled clearly in the dashboard.

### Dashboard

* Dashboard displays executive summary.
* Dashboard displays top themes.
* Dashboard displays sentiment overview.
* Dashboard displays classification summary.
* Dashboard displays representative quotes.
* Dashboard displays roadmap recommendations.
* Dashboard feels polished and portfolio-ready.

### Chatbot

* User can ask follow-up questions after synthesis.
* Chatbot uses analysis context.
* Chatbot can provide supporting feedback examples when requested.
* Chatbot avoids answering as if it knows data not present in the analysis.

### Architecture

* Frontend deployed on Vercel.
* Data stored in Supabase.
* Backend deployed on Railway.
* MCP server exists in v1.
* At least several backend capabilities are exposed as MCP tools.
* Lightweight ML classifier is included in the workflow.
* X integration is included as the first external source.

---

## 23. Open Questions

1. Which exact public dataset should train the initial ML classifier?
2. What upload size limit should v1 enforce?
3. Should the MCP server be mounted inside the main FastAPI backend or deployed as a separate Railway service?
4. Should embeddings and vector search be included in v1 if implementation is straightforward, or explicitly deferred to v1.1?
5. What level of X query customization should users have in v1?
6. What fallback behavior should the app use when X rate limits or errors occur?
7. Should uploaded data retention be revisited before public launch?
8. What specific visual system should the polished dashboard use?

---

## 24. Recommended v1 Build Target

The first build should prioritize a complete UI-first vertical slice:

> A user views a polished post-synthesis dashboard using realistic placeholder data.

After the dashboard direction is approved, the next vertical slice should be:

> A user selects the productivity demo dataset, runs synthesis, sees the dashboard populated with real generated results, and asks one follow-up question.

The priority is not to build every feature first. The priority is to prove the full system loop:

> input → ingestion → MCP tools → ML classification → synthesis → dashboard → chatbot follow-up.
