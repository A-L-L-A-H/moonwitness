# moonwitness-prophetic

Bounded prophetic research domain capability.

## Foundation status

Genesis 00 establishes the governed, portable repository baseline. Wave 3B adds
the bounded `prophetic-domain` mission-source resolution rule. It selects one
source deterministically (Qur'an, then Taurat, Zabur, Injil) and never
harmonises claims across sources. Its executable parity fixture is
`fixtures/prophetic-mission-source-resolution-v1.json`.

## ROCKSOUL LAZARUS PEP/1 R&D

The package contains a non-canonical, deterministic Prophetic Ethics Profile
research evaluator. It treats Qur'an passages, textual witnesses, human
interpretation, user-attested belief, and software assumptions as separate
source lanes. It does not authenticate revelation or infer theology from free
text.

The R&D evaluator currently provides:

- six source-linked ethics profiles expressed as human operational mappings;
- abstract runtime roles rather than prophet personas;
- one canonical `ISA` subject for Isa/Jesus/Yesus;
- a bounded `SERVANT_Q18_65` identity for the subject traditionally identified
  as al-Khidr, without promoting him to a Qur'an-explicit prophet;
- deterministic `ALLOW`, `REVISE`, `ESCALATE`, and `DENY` decisions;
- mandatory high-risk human review and AMANAH/rollback evidence;
- zero-tolerance rejection of AI faith, worship, revelation, prophetic
  identity, prophet-return, unseen-knowledge, impersonation, and hidden-wisdom
  bypass claims;
- golden and adversarial fixtures in
  `fixtures/prophetic-ethics-rnd-v1.json`.

A user's spiritual conviction may be retained as `USER_ATTESTED_BELIEF`. It is
not silently promoted to scripture, revelation, or model authority. The
evaluator remains internal and is not exported from the package entrypoint. This
R&D has no public network API, database, autonomous tool permission, fatwa
authority, or production status.

## Architecture boundary

This repository follows the frozen MoonWitness Gen2 blueprint. Consumers use its public package entrypoint only; private source paths and foreign databases are not integration boundaries.

## Development

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
