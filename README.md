# LeetPhil

LeetPhil is a philosophy practice site for plain-text thought problems. Users sign in, answer original scenarios, and receive rubric-based LLM feedback.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in Supabase plus one judge provider.

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
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=https://your-domain.example
OPENROUTER_APP_NAME=LeetPhil
```

The free OpenRouter router is useful for demos and low-volume practice, but production traffic may need a paid or pinned model for reliability.
