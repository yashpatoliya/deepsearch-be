# Deep Research Engine 🚀

A production-ready, open-source backend for a "Deep Research Engine" similar in concept to Perplexity AI. It uses only free, publicly available data and tools (DuckDuckGo, Cheerio, TF-IDF). 

## 🌟 Features

- **Public Search & Scraping**: Uses DuckDuckGo to find top URLs and a Cheerio-based scraper to extract clean content from web pages.
- **Deep Search Mode**: Automatically issues multiple follow-up queries for deep context aggregation.
- **AI / NLP Summarization (No API Keys needed)**: Extractive summarization and TF-IDF keyword extraction are built-in (no expensive LLM APIs needed).
- **Intelligent Ranking**: Scores results based on query relevance, domain credibility, recency, and content length.
- **Advanced Caching & Rate Limiting**: Built-in Redis cache (queries cached for 6 hours, scraped pages for 24 hours) and fastify-rate-limit.
- **Robust Architecture**: Uses Fastify, TypeScript, and BullMQ for scalable and asynchronous processing.

## 🧱 Tech Stack

- **Framework**: Fastify + Node.js (v18+)
- **Language**: TypeScript (Strict mode)
- **Data & Caching**: Redis (ioredis)
- **Queues**: BullMQ
- **Scraping**: Cheerio + Axios
- **NLP**: Natural / Compromise (TF-IDF and basic heuristics)
- **Validation**: Zod

## 🚀 Quick Start (Docker)

The easiest way to run the application is via Docker Compose, which automatically provisions Redis and the Node.js API.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/deep-research-engine.git
   cd deep-research-engine
   ```

2. **Set up your environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration if necessary
   ```

3. **Start the services**:
   ```bash
   npm run docker:up
   ```

4. **View Logs**:
   ```bash
   npm run docker:logs
   ```

The API will be available at `http://localhost:3000`.

## 💻 Manual Setup

If you prefer to run it manually (requires Node 18+ and a running Redis instance):

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Ensure Redis is running** on `localhost:6379`.

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

4. **Build and start for production**:
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
/src
  /api
    /routes       # Fastify route controllers (search, cache management)
    server.ts     # Fastify server instantiation and config
  /config         # Centralized environment config
  /modules
    /ai           # NLP tasks: summarizer, TF-IDF, entity extraction
    /ranking      # Multi-factor ranking engine
    /scraper      # Web scraper and content cleaning
    /search       # DDG search integration
  /services       # Core orchestration and external services (Redis)
  /types          # Global TypeScript interfaces
  /utils          # Helpers (logging, URL/Text manipulation)
  /workers        # BullMQ background workers
  index.ts        # App entry point
```

## 🧪 Testing

The test suite uses Vitest. Note: Node.js 18+ is strictly required.

```bash
npm run test
npm run test:coverage
```

## ⚠️ Important Ethics & Usage Notes

- **No Private Data**: This engine ONLY scrapes public web pages and requires no logins.
- **Rate Limits**: It aggressively limits concurrent scrapes and request concurrency to respect target sites.
- **Fair Use**: Built for research, public info, and knowledge aggregation. Do not use for stalking or spam generation. Source links are fundamentally preserved.
