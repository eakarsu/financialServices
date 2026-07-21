export function csvCell(value: unknown): string {
  const text = value == null ? '' : typeof value === 'bigint' ? value.toString() : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function buildDocumentAuditCsv(input: {
  chainValid: boolean
  documents: Array<{
    id: string
    versions: Array<{
      id: string
      version: number
      reviewStatus: string
      contentSha256: string
      sourceProvider: string | null
      sourceEventId: string | null
      createdAt: Date
    }>
    legalHoldLinks: Array<{ legalHold: { status: string; matterRef: string } }>
  }>
  events: Array<{
    id: string
    entityId: string
    sequence: bigint
    action: string
    eventHash: string
    previousHash: string | null
    createdAt: Date
  }>
}): string {
  const rows = [['record_type', 'document_id', 'record_id', 'version_or_sequence', 'status', 'sha256_or_event_hash', 'source_or_previous_hash', 'hold_matter', 'created_at']]
  for (const document of input.documents) {
    for (const version of document.versions) {
      rows.push([
        'document_version', document.id, version.id, String(version.version), version.reviewStatus,
        version.contentSha256, `${version.sourceProvider || ''}:${version.sourceEventId || ''}`,
        document.legalHoldLinks.filter((link) => link.legalHold.status === 'ACTIVE').map((link) => link.legalHold.matterRef).join('|'),
        version.createdAt.toISOString(),
      ])
    }
  }
  for (const event of input.events) {
    rows.push(['audit_event', event.entityId, event.id, event.sequence.toString(), event.action, event.eventHash, event.previousHash || '', '', event.createdAt.toISOString()])
  }
  rows.unshift(['audit_chain_valid', input.chainValid ? 'true' : 'false', '', '', '', '', '', '', ''])
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n'
}
