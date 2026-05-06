# Onchain alert → Hermes token research integration

Session-derived pattern for Z's `github.com/0xArtex/onchain_tools` scanner.

## Goal

Every new-token alert from the scanner should wake Hermes immediately. Hermes then performs token research + X research and only interrupts Z when the token is interesting.

## Pipeline

1. `onchain_tools` launch monitor detects Base/Solana/BSC token.
2. Scanner forwards a structured JSON event to Hermes webhook/wake endpoint.
3. Hermes runs shallow research first:
   - DexScreener pair/token lookup
   - GoPlus/RugCheck security where supported
   - X search by ticker, token address, project name
   - official/project X account verification if present
4. Hermes classifies:
   - `SKIP`: no DM/call, optional internal log
   - `WATCH`: private DM + append watchlist
   - `APE`/`BUY`: private DM + append watchlist + phone call via AgentOS/agents-infra

## Recommended event payload

```json
{
  "type": "new_token_alert",
  "source": "onchain_tools",
  "chain": "base|solana|bsc",
  "token_address": "...",
  "pair_address": "...",
  "symbol": "...",
  "name": "...",
  "liquidity_usd": 12000,
  "market_cap": 85000,
  "volume_24h": 300000,
  "age_minutes": 8,
  "dex_url": "https://dexscreener.com/...",
  "twitter_url": "https://x.com/...",
  "rug_check": {},
  "red_flags": []
}
```

## Repo hook point

In `onchain_tools`, `app/agents/launch_monitor/agent.py` already has `_forward_to_abot(token_data)` and config fields:

- `ABOT_WEBHOOK_URL`
- `ABOT_PROXY_TOKEN`

Prefer forwarding strict JSON instead of a text blob prompt so Hermes can reliably parse chain/address/symbol/liquidity/mcap/volume/social fields.

## Verdict action contract

```json
{
  "verdict": "SKIP|WATCH|APE|BUY",
  "reason": "one-line reason",
  "confidence": 0.0,
  "actions_taken": ["dm", "watchlist", "phone_call"]
}
```

## Implementation notes from `onchain_tools`

A tested repo-side integration used this approach:

- Add `_build_hermes_alert_payload(token_data)` beside `_forward_to_abot()` in `app/agents/launch_monitor/agent.py`.
- Include `wakeMode: "now"`, `mode: "now"`, `deliver: false`, `delivery_policy: "only_watch_ape_buy"`, and `required_skills: ["token-research", "x-research", "agents-infra"]`.
- Preserve `text`/`message` fields for webhook adapters, but include a structured `token` object with nested `metrics`, `socials`, and `risk`.
- If `ABOT_WEBHOOK_URL` already contains `/webhooks/`, post to it exactly; otherwise fall back to trying `/hooks/wake` then `/hooks/agent` for older OpenClaw-style endpoints.
- Make `ABOT_PROXY_TOKEN` optional; send it as `X-Proxy-Token` only when present.
- Add tests that instantiate `LaunchMonitorAgent` via `object.__new__()` to avoid Redis/network setup, monkeypatch `httpx.AsyncClient`, and assert the JSON payload.

Hermes webhook setup may be missing on the agent host. `hermes webhook list` will explain how to enable the webhook platform (`WEBHOOK_ENABLED=true`, port, secret) before the scanner can point at `ABOT_WEBHOOK_URL`.

## Pitfalls

- Do not phone-call for `WATCH` by default; Z specified private DM + watchlist for WATCH, phone call only for APE/BUY.
- Do not filter out low market-cap tokens before research; lower mcap can be earlier entry.
- Do not auto-reject X Community links; investigate why the community exists and whether activity is organic.
- Verify dev/team claims from their own accounts, not community posts.
- If GitHub push auth is missing, still commit locally and export a `git format-patch` so the repo changes are portable.
