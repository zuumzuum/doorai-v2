# DoorAI — Engineering Playbook (MVP v2)

## 1 🌟 Philosophy

* **Server‑First Next.js 15**: default to Server Components; add `"use client"` only for UI interactivity.
* **One Source of Truth**: every DB read/write goes through Supabase Row‑Level‑Security.
* **Claude Code workflow**: `/todo ▸ /implement ▸ /review` with atomic Git patches.

---

## 2 📁 Repo Layout

```text
/app            ← Next 15 App Router pages
  (public)/     ← marketing & login (no auth required)
  (app)/        ← authenticated area
    ├─ dashboard/
    ├─ properties/
    └─ settings/
/lib
  ├─ dal/       ← Supabase queries only (Server‑side)
  ├─ ai/        ← GPT‑4o helpers (Batch & RT)
  └─ stripe/    ← client + webhook utils
/supabase
  └─ migrations/
/tests          ← vitest + playwright
.vscode         ← tasks added by Claude‑Code
```

---

## 3 🔑 Authentication

| Phase                 | Pattern                                             | Notes                                  |
| --------------------- | --------------------------------------------------- | -------------------------------------- |
| **Sign‑in / Sign‑up** | **Client Comp** + `supabase.auth.signInWithOAuth()` | Google pop‑up requires browser context |
| **Session check**     | **Server Comp / Action** `await getUser()`          | Redirect if `!user`                    |
| **Data fetch**        | Server Comp — direct DAL                            | Avoid client keys                      |

---

## 4 ⚙️ Server Actions Cheat‑Sheet

| Action         | File                                         | Call from       |
| -------------- | -------------------------------------------- | --------------- |
| Checkout (sub) | `app/api/billing/create-checkout/route.ts`   | Pricing Page    |
| Token Pack     | `app/api/billing/create-token-pack/route.ts` | 100 % modal     |
| CSV → Batch    | `app/api/batch-generate/route.ts`            | Properties page |
| Msg → LINE     | `app/api/line/route.ts` (edge)               | LINE webhook    |

*Always mark with `"use server"`; return typed data for React usage.*

---

## 5 🗄 Supabase Rules

* **RLS ON for ALL tables** (`auth.uid() = auth_user_id` or `tenant_id` join).
* No service key on client!
* Use `cache(async () => …)` in DAL to dedupe duplicates in one request.

---

## 6 💳 Billing Rules

* Two prices → `STRIPE_PRICE_STD_MONTH`, `STRIPE_PRICE_PRO_MONTH`.
* Pack price → `STRIPE_PRICE_PACK_1M`.
* Trial handled via `trial_period_days: 7` in Checkout.
* Webhook events: `checkout.session.completed`, `customer.subscription.*`.
* Stored procedure `add_token_pack()` for idempotent +1 M.

---

## 7 ⏲ Cron Jobs (Edge)

| Job             | Schedule        | Purpose                              |
| --------------- | --------------- | ------------------------------------ |
| `monthly_reset` | `0 0 1 * *` JST | `tokens_used=0; additional_tokens=0` |
| `batch_poller`  | every 15 min    | Update OpenAI Batch status           |

---

## 8 📐 UI Guidelines

* Components: shadcn/ui + Tailwind. No extra CSS files.
* Dark‑mode via `class="dark"`.
* Token Banner & Upgrade Modal subscribe to `usageTokensContext` (Client).

---

## 9 🛡️ Testing & CI

* **Vitest** 80 % coverage minimum.
* **pg‑tap** for RLS policies.
* GitHub CI: `pnpm lint`, `pnpm test`, `pnpm build` (no warnings).

---

## 10 🧑‍💻 Claude‑Code Workflow

1. Add TODO  → `/todo add "Implement LINE webhook"`.
2. Get approval  → `/implement <id>` produces patch.
3. After merge, run `pnpm typecheck && pnpm test` (task set).

> Stick to this playbook; update here if architecture changes.