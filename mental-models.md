# mental-models.rambuilds.dev — full design document

> A personal knowledge system for learning, practising, and applying mental models daily.
> Inspired by Charlie Munger's latticework of mental models.

---

## Table of contents

1. [Vision](#vision)
2. [Site structure](#site-structure)
3. [The top 10 mental models](#the-top-10-mental-models)
4. [Model detail page spec](#model-detail-page-spec)
5. [Taxonomy system](#taxonomy-system)
6. [Daily practice mode](#daily-practice-mode)
7. [Wild card mode](#wild-card-mode)
8. [Decision log](#decision-log)
9. [Streak and progress dashboard](#streak-and-progress-dashboard)
10. [Model connection map](#model-connection-map)
11. [Build notes](#build-notes)

---

## Vision

Most mental model resources are encyclopedias — you read them once and forget. This site is different because it closes the loop:

**Learn → Understand origin → See real examples → Practice with your own life → Log your use of it**

That loop, repeated over months, builds the latticework Munger talks about. The goal is not a library you visit. It is a daily ritual that changes how you think.

---

## Site structure

Four core pages:

| Page | URL | Purpose |
|------|-----|---------|
| Library | `/library` | All models. Filter by field, author, domain. Each card links to the detail page. |
| Model detail | `/model/:slug` | Theory + origin + examples + self-check questions + personal notes. |
| Daily practice | `/practice` | One model, one scenario, write your answer, reveal insight, log it. |
| Wild card | `/practice/wildcard` | Paste your own real decision. Pick models. Get analysis. |
| Dashboard | `/practice/dashboard` | Streak, stats, decision log, monthly review. |
| Model map | `/map` | Visual graph of how models connect and cluster. |

---

## The top 10 mental models

### 01 — Inversion
**Author / origin:** Carl Jacobi (mathematician), popularised by Charlie Munger  
**Field:** Logic  
**Domain:** General — applies everywhere  

**Theory:** Instead of asking how to succeed, ask what guarantees failure — then avoid it. Invert the problem. Most people only think forward. Inversion forces you to see failure modes your optimism is hiding.

**Self-check questions:**
1. What would guarantee this fails? Am I doing any of those things?
2. If I wanted to destroy this company / relationship / plan, what would I do?
3. What is the opposite of what I am currently assuming?
4. What do most people get wrong about this, and am I making the same mistake?

---

### 02 — First principles / Occam's razor
**Author / origin:** Aristotle (first principles); William of Ockham (Occam's razor)  
**Field:** Logic / Philosophy  
**Domain:** General, science, product design, strategy  

**Theory:** Strip away assumptions. Rebuild reasoning from verified facts. The simplest explanation that fits all the facts is most likely correct. Borrowed beliefs that have never been verified are intellectual debt.

**Self-check questions:**
1. What do I know for certain here, and what am I just assuming?
2. If I had to rebuild this reasoning from scratch, what would survive?
3. Is there a simpler explanation I am ignoring because it seems too obvious?
4. Am I borrowing this belief from someone else, or have I actually verified it?

---

### 03 — Circle of competence
**Author / origin:** Warren Buffett and Charlie Munger  
**Field:** Epistemology / Decision-making  
**Domain:** Investing, career decisions, hiring, business strategy  

**Theory:** Know what you know. The most dangerous ignorance is not knowing what you do not know. Operating outside your circle of competence while believing you are inside it is how catastrophic mistakes happen.

**Self-check questions:**
1. Do I actually understand this, or am I just comfortable with the vocabulary?
2. Who knows this domain better than me, and what do they think?
3. Am I inside or outside my circle of competence right now?
4. What would I need to learn before this decision becomes one I am qualified to make?

---

### 04 — Second-order thinking
**Author / origin:** Howard Marks, popularised in *The Most Important Thing*  
**Field:** Systems thinking  
**Domain:** Investing, policy, product decisions, parenting, negotiation  

**Theory:** Ask not just "what happens next" but "and then what?" Most people stop at the first-order effect. The interesting — and dangerous — consequences live in the second and third order.

**Self-check questions:**
1. And then what? What happens after the obvious outcome plays out?
2. Who benefits from this in a way that is not immediately obvious?
3. What incentives does this create that might work against the intended goal?
4. If everyone did this, what would the world look like in 10 years?

---

### 05 — Probabilistic thinking
**Author / origin:** Statistics / mathematics; popularised by Annie Duke (*Thinking in Bets*)  
**Field:** Mathematics / Statistics  
**Domain:** Investing, forecasting, medicine, everyday decisions  

**Theory:** Think in odds, not certainties. Assign rough probabilities instead of binary right/wrong. Bad outcomes do not mean bad decisions. Good outcomes do not mean good decisions. What matters is whether the odds were in your favour at the time.

**Self-check questions:**
1. What is my actual confidence level here — 60%? 90%? Am I being honest?
2. What are the three most likely scenarios, and how do I act across all of them?
3. Am I treating a low-probability event as impossible, or a high-probability one as certain?
4. Have I updated my beliefs in proportion to the new evidence?

---

### 06 — Incentives
**Author / origin:** Charlie Munger; roots in economics and behavioural psychology  
**Field:** Psychology / Economics  
**Domain:** Management, negotiation, policy design, relationships, marketing  

**Theory:** Show me the incentive and I will show you the outcome. People respond to what they are rewarded for — not what they say they care about, and often not what they consciously intend. Systems produce the behaviour they incentivise.

**Self-check questions:**
1. What is this person actually being rewarded for — not what they say, but what the system pays them to do?
2. Am I being influenced by my own financial or social interest without noticing it?
3. What would a rational, self-interested actor do here, and is that what is happening?
4. Whose incentives are misaligned with mine, and where will that cause conflict?

---

### 07 — Margin of safety
**Author / origin:** Benjamin Graham (*The Intelligent Investor*); adopted by Munger and Buffett  
**Field:** Engineering / Finance  
**Domain:** Investing, project planning, engineering, personal finance  

**Theory:** Build in a buffer. If you need a bridge to hold 10 tons, build it to hold 30. Never rely on best-case assumptions. The margin of safety is the gap between what you need to be right about and what you have to be right about.

**Self-check questions:**
1. What is my worst realistic case, and can I survive it without catastrophic damage?
2. Am I dependent on everything going right? What happens if one thing goes wrong?
3. Have I left enough slack — time, money, energy — so that a mistake is not fatal?
4. What assumption in this plan, if wrong, breaks the whole thing?

---

### 08 — Availability bias
**Author / origin:** Daniel Kahneman and Amos Tversky (*Thinking, Fast and Slow*)  
**Field:** Cognitive psychology  
**Domain:** Risk assessment, investing, medical diagnosis, everyday judgment  

**Theory:** The mind gives too much weight to what is recent, vivid, or emotionally memorable. A plane crash you saw on the news makes flying feel more dangerous than driving, even though the statistics say the opposite. Availability is a proxy for frequency — but a bad one.

**Self-check questions:**
1. Is this fear or enthusiasm driven by a recent vivid event rather than actual probability?
2. What relevant facts am I not thinking about because they are boring or hard to recall?
3. Would I make the same decision if I heard about this outcome in a dry statistics table?
4. Am I confusing the availability of examples with the frequency of the actual event?

---

### 09 — Lollapalooza effect
**Author / origin:** Charlie Munger  
**Field:** Systems thinking / Psychology  
**Domain:** Business strategy, cult dynamics, bubbles, viral products  

**Theory:** Multiple forces acting in the same direction produce non-linear, extreme outcomes — for good or ill. One bias is manageable. Three biases plus social proof plus financial incentives all pointing the same way creates a lollapalooza: an outcome far larger than any single cause would predict.

**Self-check questions:**
1. How many independent factors are pushing in the same direction here?
2. Is the outcome I am seeing the result of one big cause, or several causes combining?
3. Am I being swept along by a confluence of biases, social proof, and incentives all pointing the same way?
4. What would break the reinforcing loop if it is a bad one?

---

### 10 — Opportunity cost
**Author / origin:** Economics; foundational concept from classical economics  
**Field:** Economics  
**Domain:** Investing, time management, product roadmaps, career decisions  

**Theory:** Every yes is a no to something else. The true cost of a decision includes what you gave up. Most people only see the direct cost. The invisible cost — the best available alternative foregone — is often larger.

**Self-check questions:**
1. What am I giving up by choosing this — not just money, but time, attention, optionality?
2. What is my best available alternative, and how does this compare to it?
3. Is this the best use of my next dollar / hour / unit of energy?
4. Would I still choose this if I had to explicitly write down what I am sacrificing?

---

## Model detail page spec

Each model's detail page carries the following structure:

```
/model/inversion
```

| Section | Content |
|---------|---------|
| Header | Model name + one-line tagline |
| Origin | Author, year/era, source book or paper, original discipline |
| Field tags | Where the idea came from (psychology, math, systems, economics…) |
| Domain tags | Where to apply it (investing, product, relationships, health…) |
| Theory | Plain-language explanation, 1–2 paragraphs, with a memorable metaphor |
| Real examples | 3 examples: one business, one personal, one historical |
| Self-check questions | The Munger-style questions, specific to this model |
| Related models | Links to models that combine with or contrast this one |
| Personal notes | Private scratchpad — when did you use this, what happened |
| Practice prompt | Button to run a wild card session with this model preselected |

---

## Taxonomy system

Two separate tag types on every model:

**Field of origin** — where the idea came from:
- Logic
- Mathematics / Statistics
- Psychology / Cognitive science
- Economics
- Systems thinking
- Engineering
- Philosophy
- Evolutionary biology
- Physics

**Domain of application** — where you would use it:
- Investing / Finance
- Business / Strategy
- Product / Design
- Career decisions
- Relationships
- Health
- Negotiation
- Management / Leadership
- General / Universal

A model like *regression to the mean* originates in **Statistics** but applies to **Investing, Health, Management**. Separating origin from application is what makes the library filterable in a useful way.

---

## Daily practice mode

### The 5-step loop

```
1. Model surfaces  →  2. Read scenario  →  3. Write response  →  4. Reveal insight  →  5. Log + streak
```

This loop must feel like a 3-minute ritual, not homework. If it feels heavy, people quit after a week.

### The practice screen

Each session shows:
- The model of the day (name, author, field)
- A scenario (business / personal / historical / wild card)
- A focused question applying the model to the scenario
- A text box to write your answer **before** seeing the insight
- A "Reveal insight" button
- The insight, with specific observations tied to the scenario
- A "Log it" action to save to the decision log

### Why "write before reveal" matters

The moment you commit to an answer in writing — even a rough one — your brain does the work. Reading the insight without writing first feels useful but does not transfer. This is retrieval practice, the same principle behind spaced repetition flashcards. The text box is the most important element on the page.

### Scenario categories

| Category | What it covers |
|----------|---------------|
| Business | Startup / product decisions — hiring, roadmap, pricing, pivots |
| Personal | Life decisions — career moves, relationships, health, money |
| Historical | Case studies — what did Bezos, Buffett, or Kodak actually face? |
| Wild card | Your own real situation — paste it in and get analysis |

### Format options

**Format A — Model of the day:** One model surfaces each morning. You journal one decision from yesterday through its lens.

**Format B — Scenario challenge:** A short real-world scenario is presented. Pick which model applies and write why. Compare with suggested answer. Best for onboarding and building model recognition.

**Format C — Decision log:** Log a real decision you made today. Tag which models you used (or missed). Review monthly. Best for experienced users.

---

## Wild card mode

### The 4-screen flow

```
Screen 1: Paste your decision
Screen 2: Choose which models to run  
Screen 3: Read the analysis
Screen 4: Record your verdict + log it
```

### Screen 1 — paste your decision

The input should feel like talking to a smart friend, not filling a form. Prompt: *"Describe it like you would explain it to a smart friend. Stakes, context, what is pulling you each way."*

Optional domain tag (Career / Business / Finance / Relationships / Health / Other) — used to suggest relevant models.

Two buttons: **Analyse with models →** and **Auto-pick models for me**.

### Screen 2 — model selection

Show a grid of 6–8 suggested models based on the domain. Each chip shows the model name and a one-line hook. User picks 2–3 for depth, or runs all.

Auto-suggestion logic by domain:
- **Career:** Inversion, Regret minimization, Opportunity cost, Second-order thinking
- **Business:** Inversion, Incentives, Second-order thinking, Margin of safety
- **Finance:** Margin of safety, Probabilistic thinking, Opportunity cost, Circle of competence
- **Relationships:** Incentives, Second-order thinking, Availability bias, Inversion

### Screen 3 — the analysis

Each model produces a structured block:

```
[Model name badge]  [Key question this model asks]
─────────────────────────────────────────────────
Red flag    ●  [specific observation about the decision]
Watch       ●  [something to pay attention to]  
Clear       ●  [what this model says is not the problem]
```

After all model blocks, a **Reframe** card synthesises the key insight across all models — the one thing that reframes the whole decision.

### Screen 4 — verdict and log

Three verdict options:
- **Leaning yes** — the analysis gave you a reason to move
- **Leaning no** — the tests pointed back to what you already have
- **Need more information** — a specific unknown is blocking clarity; name it

A free-text note field and tag input save the entry to the decision log.

### Design principle: verdict pressure

Forcing a verdict — even a tentative one — closes the loop. Decisions without verdicts create rumination, not clarity. Even "need more information" is a verdict: it names the specific unknown and assigns an action.

### What makes wild card different from curated scenarios

| Curated scenarios | Wild card |
|-------------------|-----------|
| Hypothetical stakes | Real stakes — the decision actually matters |
| Pre-written context | Your specific context, language, nuance |
| Teaches model recognition | Teaches model application |
| Good for beginners | Most valuable for experienced users |

### The 30-day revisit mechanic

Log a wild card decision today. Get a reminder in 30 days: *"What did you actually do? What happened?"* That feedback loop — prediction vs outcome — is how you calibrate the models over time. It turns this from a journaling app into a thinking system.

---

## Decision log

Every practice session and wild card session can be saved to the decision log.

### Log entry schema

```
date:       ISO date
model:      [array of model slugs used]
type:       curated | wildcard
domain:     career | business | finance | relationships | health | other
summary:    [1–2 sentence description of the decision]
verdict:    yes | no | wait | null
note:       [free text — reasoning, what you decided, what happened]
tags:       [free text tags]
revisit:    [date for 30-day follow-up, if set]
outcome:    [filled in at revisit — what actually happened]
```

### What the log tells you over time

After 3 months of logging:
- Which models you instinctively reach for (your defaults)
- Which models you only use when prompted (gaps to close)
- Which models you have never organically applied (still theoretical)
- Whether your verdicts on wild card decisions were correct

The gap between "know about" and "actually used" is your practice priority list.

---

## Streak and progress dashboard

URL: `/practice/dashboard`

### Stats shown

| Metric | What it measures |
|--------|-----------------|
| Current streak | Consecutive days with at least one session |
| Best streak | Longest streak ever |
| Total sessions | All-time practice count |
| Models used | Distinct models applied in wild card or logged decisions |
| Decisions logged | Entries in the decision log |
| Revisits due | Wild card entries with a 30-day revisit pending |

### Monthly calendar heatmap

A grid of days with three states:
- Done (teal) — session completed
- Today (purple) — current day
- Empty (gray) — no session

### Model usage breakdown

A simple bar or list showing how many times each model has been used across all sessions. Reveals over-reliance and blind spots.

### Streak design philosophy

Streaks are motivating but punishing. Build in:
- A **grace day** — one missed day per week does not break the streak
- A **best streak** counter alongside the current streak, so a break does not erase past work
- A gentle re-engagement message rather than a loss framing on missed days

---

## Model connection map

URL: `/map`

A visual graph showing how models relate. Edges represent:
- **Combines with** — models that work together (e.g. Inversion + Second-order thinking)
- **Contrasts with** — models in productive tension (e.g. Margin of safety vs Opportunity cost)
- **Prerequisite for** — one model makes another more useful (e.g. Circle of competence → Probabilistic thinking)

### Example connections

```
Inversion  ──────────────  Second-order thinking
     │                              │
     └── Lollapalooza effect ───────┘
              │
         Availability bias
              │
         Incentives ──── Circle of competence
```

### Clusters

- **Decision cluster:** Inversion, Opportunity cost, Regret minimization, Second-order thinking
- **Bias cluster:** Availability bias, Lollapalooza effect, Incentives
- **Risk cluster:** Margin of safety, Probabilistic thinking, Circle of competence
- **Systems cluster:** Second-order thinking, Lollapalooza, Incentives

---

## Build notes

### Recommended tech stack

| Layer | Option A (simpler) | Option B (scalable) |
|-------|--------------------|---------------------|
| Framework | Next.js (App Router) | Next.js (App Router) |
| Content / models | Markdown files + gray-matter | Notion as CMS via API |
| Personal notes + log | Local JSON / localStorage | Supabase (Postgres) |
| Auth | None (personal site) | Clerk or NextAuth |
| Styling | Tailwind CSS | Tailwind CSS |
| Hosting | Vercel | Vercel |

Start with Option A. Get the content structure right before building the database. Use markdown files as the backend while you figure out what you actually need, then migrate.

### Build order

```
Phase 1 — Content
  ├── Library page + model cards
  ├── Model detail page (static, markdown-driven)
  └── Taxonomy / filter system

Phase 2 — Practice
  ├── Daily practice loop (curated scenarios)
  ├── Streak tracker (localStorage to start)
  └── Basic decision log

Phase 3 — Wild card
  ├── Decision input + model selection
  ├── Analysis output (can use AI API for generation)
  └── Verdict + log save

Phase 4 — Intelligence
  ├── 30-day revisit reminders
  ├── Monthly review page
  └── Model connection map
```

### Content to build first

Before writing a line of code, write the content for 10 models in the detail page format. The act of writing forces you to understand the taxonomy, the depth required, and what "personal notes" actually looks like. Build the site around content that already exists.

### The one metric that matters

After 90 days: how many wild card decisions have you logged? Not how many models you have read about — how many times you have actually applied one to a real decision in your life. That number is the only measure of whether the site is working.

---

*Last updated: April 2026*  
*Site: mental-models.rambuilds.dev*
