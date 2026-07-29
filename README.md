# DS-Service

DS-Service is a backend API that sources and serves travel-destination data — points of interest, cities, and countries — for travel-planning applications. It uses an LLM (DeepSeek, via OpenRouter) to generate trip-planning suggestions and structured destination data, and persists that data to MongoDB.

It is currently consumed by [TBS (Travel Buddy Service)](https://github.com/itjinshan/TBS), which calls this service for LLM-backed trip planning and destination sourcing.

## What it does

- **Trip planning** — accepts a freeform natural-language travel query and returns an LLM-generated response.
- **Spot sourcing** — given a city name, asks the LLM for a list of notable points of interest (name, location, fees, best time to visit, etc.) and saves them to MongoDB, auto-creating the associated city/country records as needed.

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
| `POST` | `/datasourcing/sourcespots` | Sources and saves points of interest for a given city |

For full request/response shapes and field-level detail, see the **API Contract** section in [`CLAUDE.md`](./CLAUDE.md).

## Project structure

```
app.ts              Express app entry point (middleware, routes, DB connection)
APIs/                Route definitions
Deepseek/             LLM client wrapper (OpenRouter/DeepSeek)
Utils/                Auth middleware, LLM prompt templates, response parsing
DB_Models/            Mongoose schemas (Country, City, Spot)
```
