# Financial Services

Financial Services is a multi-tenant accounting platform with a governed document workflow. Document bytes are private, every version is checksum-bound to provenance, legal material requires independent review, and audit/provider evidence is append-only.

## Proven document journey

1. An authenticated firm member uploads real bytes through `/api/upload`. The server validates type/size, stores the object privately, records its SHA-256 and source identity, and creates immutable version 1.
2. Firm and client-matter scope is enforced for every read and mutation. Staff need assignment, ownership, or an active grant; privileged documents additionally require firm leadership or an explicit grant. Revocation takes effect immediately.
3. New bytes create a new immutable version. Contracts and engagement letters require jurisdiction, effective date, and an independent manager/partner/admin review. The uploader cannot approve their own work.
4. OCR, filing, e-signature, and authoritative templates use fail-closed provider contracts. Provider event IDs are idempotent, altered replay is rejected, and every result is bound to the source version SHA-256 and source timestamp.
5. Text redaction produces new bytes and a new version after independent approval. PDF/binary redaction is rejected unless a content-preserving external provider is integrated; visual overlays are never represented as secure redaction.
6. Legal holds preserve links and override retention eligibility. Disposition requires an expired retention date, no active hold, firm leadership, and exact current SHA-256 confirmation. Metadata, hashes, and audit evidence remain after object deletion.
7. Downloads are authorization-checked and audited. Firm leadership can export a CSV containing every version hash, provider identity, hold matter reference, and the verified hash-chained audit log.

The former generated AI/demo routes were removed. Financial-health narrative is deterministic threshold-based screening and explicitly requires professional review; no LLM can approve documents, file records, sign, redact, alter retention, or mutate accounting data.

## Development

Requirements: Node.js 22+, PostgreSQL 16+, and private provider test credentials when exercising external adapters.

```sh
cp .env.example .env
npm ci
npx prisma migrate deploy
npm test
npm run typecheck
npm run build
npm run dev
```

`start.sh` only validates configuration, applies checked-in migrations, and starts the selected server. It never creates/resets/seeds a database, edits `.env`, installs dependencies, or kills processes. Seeding is an explicit development-only command and does not create fake document evidence.

This repository introduces a baseline migration because the prior project used `prisma db push` without migration history. For an existing database: take a verified backup, compare it with `prisma migrate diff`, remediate drift, and only then baseline with `prisma migrate resolve --applied 20260719000000_initial`. Never mark the baseline applied without that review.

## Production boundary

Production requires PostgreSQL, a strong `JWT_SECRET`, private S3 storage, HTTPS/TLS ingress, managed secrets, backups, monitoring, and licensed provider contracts. Run `npx prisma migrate deploy` as an explicit release step. Local storage is rejected in production.

Provider selection, credentials, licensing/redistribution rights, filing authority, e-sign legal acceptance, retention policy approval, PDF redaction, disaster recovery, and historical secret rotation are external launch work and cannot be proven by repository source alone.
