# Hermes token research skills

These are the Hermes skills used by the onchain token research workflow.

- `token-research/` — verdict framework, SKIP/WATCH/APE escalation rules, token API pitfalls, watchlist/report discipline, and Z-specific token-scoring corrections.
- `x-research/` — X/Twitter research workflow using TwitterAPI plus no-credit fallbacks such as fxtwitter/vxtwitter/Jina/profile HTML.

To use them in Hermes, copy or symlink these directories into your Hermes skills directory, or ask Hermes to load them from this repo when working on token alerts.

Example:

```bash
mkdir -p ~/.hermes/skills/onchain-tools
ln -s "$PWD/skills/token-research" ~/.hermes/skills/onchain-tools/token-research
ln -s "$PWD/skills/x-research" ~/.hermes/skills/onchain-tools/x-research
```

Then start a fresh Hermes session so the skill loader can see them.
