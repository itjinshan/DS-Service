# DS-Service

DS-Service is a backend API that sources and serves travel-destination data — points of interest, cities, and countries — for travel-planning applications. It uses an LLM (DeepSeek, via OpenRouter) to generate trip-planning suggestions and structured destination data, and persists that data to MongoDB.

It is currently consumed by [TBS (Travel Buddy Service)](https://github.com/itjinshan/TBS), which calls this service for LLM-backed trip planning and destination sourcing.

## What it does

- **Trip planning** — accepts a freeform natural-language travel query and returns an LLM-generated response.
- **Spot sourcing** — given a city name, sources points of interest (name, location, fees, best time to visit, category, etc.), checking its own MongoDB for spots already sourced for that city before asking the LLM for more — see ["How Spot Sourcing Works"](#how-spot-sourcing-works) below.
- **Accommodation sourcing** — given a city and budget tier, sources lodging options the same way.
- **NLU extraction** — given a chat message and a list of fields to pull out (destination, duration, traveler count, budget tier, vacation pace, transport mode, arrival/departure point, yes/no), asks the LLM to extract exactly those fields as structured JSON — see ["How NLU Extraction Works"](#how-nlu-extraction-works) below.

## Tech stack

- Node.js + Express, written in TypeScript
- MongoDB via Mongoose
- OpenAI SDK, pointed at [OpenRouter](https://openrouter.ai)'s DeepSeek model
- JWT-based service-to-service authentication

## Getting started

### Prerequisites

- Node.js
- A MongoDB instance (connection string)
- An OpenRouter API key

### Install

```bash
npm install
```

### Configure

Create a `.env` file in the project root:

```
PORT=8888
MONGODB_URI=<your MongoDB connection string>
OPEN_ROUTER_DEEPSEEK_API_KEY=<your OpenRouter API key>
DEEPSEEK_JWT_SECRET=<shared secret with any calling service>
```

### Run

```bash
npm run dev
```

This compiles the TypeScript source and runs it under `nodemon`, restarting on changes. The server listens on `PORT` (default `8888`).

## API overview

All endpoints except `GET /` require a JSON body field `token` — a JWT signed with `DEEPSEEK_JWT_SECRET`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/deepseek/plantrip` | Freeform trip-planning query, returned as the LLM's raw reply |
| `POST` | `/datasourcing/sourcespots` | Sources points of interest for a city — DB-first, LLM-top-up |
| `POST` | `/datasourcing/sourceaccommodations` | Sources lodging options for a city and budget tier |
| `POST` | `/nlu/extract` | Extracts structured fields (destination, duration, etc.) from a chat message |

For full request/response shapes and field-level detail, see the **API Contract** section in [`CLAUDE.md`](./CLAUDE.md).

## Project structure

```
app.ts              Express app entry point (middleware, routes, DB connection)
APIs/                Route definitions (deepseek, datasourcing, nlu)
Deepseek/             LLM client wrapper (OpenRouter/DeepSeek)
Utils/
  spotSourcing.ts     DB-first-then-LLM-top-up orchestrator behind /datasourcing/sourcespots
  cityLookup.ts        Case-insensitive city/country lookup-or-create
  queryScripts.ts       LLM prompt templates
  spotMapper.ts / accommodationMapper.ts / nluMapper.ts   Response parsing/persistence
  auth.ts               requireAuth middleware
DB_Models/            Mongoose schemas (Country, City, Spot, Accommodation)
```

## How Spot Sourcing Works

`POST /datasourcing/sourcespots` (implemented in `Utils/spotSourcing.ts`) is **DB-first, LLM-top-up**, not a fresh LLM call on every request:

1. Look up the requested city (case-insensitively) and check how many spots are already saved for it in MongoDB.
2. If that existing count already meets the requested `minCount`, skip the LLM entirely — just return the existing spots, capped to `minCount` and sorted by rating (highest first), so a popular city's ever-growing pool doesn't balloon the response or crowd out quality with quantity.
3. Otherwise, ask the LLM for just the shortfall (padded a bit, since the LLM won't return exactly the number requested), dedupe its output against what's already saved (by normalized name) so a repeat call for the same city doesn't create near-duplicate rows, and save only the genuinely new ones.

This means the first request for a city pays the full LLM cost, but every subsequent request for that city — from any trip, any user — is cheap, and the corpus of real, saved spot data for a city only grows over time. A short-TTL cache in front of this (tracked in "Pending Tasks" below) would be the next layer, sitting ahead of the Mongo check without needing to change this logic.

**Known limitation:** a spot's `City` reference is resolved from the *LLM's own* per-spot `city` field, not the originally-requested city — so a landmark that's technically in a neighboring municipality (e.g. Lisbon's Cristo Rei, across the river in Almada) can get filed under that neighboring city instead. This doesn't affect what a consuming app displays (TBS, for instance, overwrites the city label to whatever it originally asked for), but it means the "existing count" check above can occasionally undercount by a spot or two, triggering an LLM call that technically wasn't necessary. Minor inefficiency, not a correctness bug.

## How NLU Extraction Works

`POST /nlu/extract` takes a chat message and a list of fields to pull out of it (`destination`, `duration`, `numOfTravelers`, `budget`, `pace`, `transportMode`, `arrivalPoint`, `departurePoint`, or `yesno`), and asks the LLM to return exactly those fields as a JSON object — nothing else, no explanation, `null` for anything genuinely not present in the message.

This exists so a consuming app's conversational intake flow doesn't have to rely on regex/keyword matching to understand what a user said. The optional `context` field matters most for `yesno`: a bare "yes" or "no" has no meaning on its own, so the caller passes a short hint (e.g. "whether the traveler already has a place to stay booked") so the LLM knows what it's confirming or denying.

The endpoint does no persistence — it's a stateless extraction call, unlike `sourcespots`/`sourceaccommodations` which write to MongoDB.
