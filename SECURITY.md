# Security and data handling

Report suspected vulnerabilities privately to the repository owner. Do not include client records, document bytes, credentials, signature evidence, tax identifiers, or bank tokens in an issue.

- JWT, provider, email, banking, payment, and storage secrets have no fallback values. Store them in a managed secret service and rotate any value ever exposed in history.
- Production documents must use a private S3 bucket with encryption, least-privilege IAM, access logging, versioning, lifecycle controls, and blocked public access.
- Audit logs, provider events, hold links, document evidence, and completed reviews are database-immutable. Monitor audit-chain verification, failed/altered provider events, privileged access grants, hold changes, and disposition attempts.
- Treat OCR text, signatures, filings, financial records, and template content as sensitive. Provider contracts must cover privacy, residency, retention, breach notification, subcontractors, and deletion.
- Back up PostgreSQL and object storage together; test restoration and checksum reconciliation. A database backup without the corresponding immutable object versions is incomplete.
- Never use the development seed against shared or production infrastructure.
