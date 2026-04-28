# LeetPhil

LeetPhil is a philosophy practice site for plain-text thought problems. Users sign in, answer original scenarios, and receive rubric-based LLM feedback.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` and fill in Supabase plus one judge provider.

3. Apply the SQL files in `supabase/migrations/` to your Supabase project in order.

4. Run the app:

   ```bash
   npm run dev
   ```

For local development without an LLM key, set `JUDGE_PROVIDER=mock`. Supabase is still required for sign-in and private attempt history.

## Judge Providers

Use OpenAI:

```bash
JUDGE_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

Use OpenRouter:

```bash
JUDGE_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=inclusionai/ling-2.6-flash:free
OPENROUTER_SITE_URL=https://your-domain.example
OPENROUTER_APP_NAME=LeetPhil
```

The recommended free OpenRouter model is `inclusionai/ling-2.6-flash:free` because it currently supports structured JSON output and passed a live LeetPhil smoke test. Free models are useful for demos and low-volume practice, but production traffic may need a paid or pinned model for reliability.
When a free model cannot route strict JSON-schema parameters, LeetPhil retries with a JSON-only prompt and validates the result locally.

Use Gemini:

```bash
JUDGE_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

The recommended Gemini free-tier starting point is `gemini-2.5-flash`: it supports structured JSON output and has enough reasoning quality for rubric feedback. If you mainly need lower latency or quota-friendly demos, try `gemini-2.5-flash-lite`.
