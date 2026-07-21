import { createHmac, randomUUID } from 'crypto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import prisma from '../../src/lib/prisma'
import { verifyAuditChain } from '../../src/lib/audit'
import { DocumentAccessError, getDocumentForAccess } from '../../src/lib/document-governance'
import { addDocumentVersion, createDocumentRecord, reviewDocumentVersion, sha256 } from '../../src/lib/documents'
import { buildDocumentAuditCsv } from '../../src/lib/document-audit-export'
import { applyTextRedactions } from '../../src/lib/redaction'
import { POST as processSignatureWebhook } from '../../src/app/api/webhooks/esignature/route'

test('governed document workflow persists and protects evidence', async (suite) => {
  const suffix = randomUUID()
  const firm = await prisma.firm.create({ data: { name: `Workflow ${suffix}` } })
  const userData = (role: 'ADMIN' | 'PARTNER' | 'MANAGER' | 'STAFF', label: string) => ({
    email: `${label}-${suffix}@example.test`, password: 'not-used-in-test', firstName: label, lastName: 'Tester',
    role, firmId: firm.id, isActive: true, emailVerified: true,
  })
  const uploader = await prisma.user.create({ data: userData('MANAGER', 'uploader') })
  const reviewer = await prisma.user.create({ data: userData('MANAGER', 'reviewer') })
  const outsider = await prisma.user.create({ data: userData('STAFF', 'outsider') })
  const leader = await prisma.user.create({ data: userData('PARTNER', 'leader') })
  const client = await prisma.client.create({
    data: { clientNumber: `CLIENT-${suffix}`, type: 'BUSINESS', status: 'ACTIVE', businessName: 'Evidence Client', firmId: firm.id },
  })
  await prisma.clientAssignment.createMany({
    data: [
      { clientId: client.id, userId: uploader.id, role: 'Preparer' },
      { clientId: client.id, userId: reviewer.id, role: 'Reviewer' },
    ],
  })
  const original = Buffer.from('Contract for account 123-45-6789')
  const context = { requestId: randomUUID(), ipAddress: '127.0.0.1', userAgent: 'node-test' }
  const document = await createDocumentRecord(uploader, {
    name: 'Engagement contract', type: 'CONTRACT', clientId: client.id, isPrivileged: false,
    jurisdiction: 'US-NY', effectiveDate: new Date('2026-07-19'), retainUntil: new Date('2027-07-19'),
  }, {
    storageKey: `test/${suffix}/v1.txt`, size: original.length, mimeType: 'text/plain', contentSha256: sha256(original),
    sourceType: 'UPLOAD', sourceProvider: 'test-suite', sourceEventId: `upload-${suffix}`, sourceTimestamp: new Date(),
  }, context)

  await suite.test('initial upload creates provenance version and a valid audit chain', async () => {
    assert.equal(document.versions.length, 1)
    assert.equal(document.versions[0].contentSha256, sha256(original))
    assert.equal(await verifyAuditChain(firm.id), true)
  })

  await suite.test('matter assignment permits view while an outsider is denied', async () => {
    assert.equal((await getDocumentForAccess(document.id, uploader, 'VIEW')).id, document.id)
    await assert.rejects(() => getDocumentForAccess(document.id, outsider, 'VIEW'), (error: unknown) => {
      return error instanceof DocumentAccessError && error.status === 403
    })
  })

  await suite.test('explicit grant and revocation change access immediately', async () => {
    const grant = await prisma.documentAccessGrant.create({
      data: { firmId: firm.id, documentId: document.id, userId: outsider.id, grantedById: leader.id, accessLevel: 'VIEW', reason: 'Time-bound review' },
    })
    assert.equal((await getDocumentForAccess(document.id, outsider, 'VIEW')).id, document.id)
    await prisma.documentAccessGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } })
    await assert.rejects(() => getDocumentForAccess(document.id, outsider, 'VIEW'), DocumentAccessError)
  })

  await suite.test('creator cannot self-approve and independent reviewer can approve', async () => {
    await assert.rejects(() => reviewDocumentVersion(document, uploader, 'APPROVED', {
      note: 'self review', jurisdiction: 'US-NY', effectiveDate: new Date('2026-07-19'),
    }, { ...context, requestId: randomUUID() }), /cannot approve/)
    const reviewed = await reviewDocumentVersion(document, reviewer, 'APPROVED', {
      note: 'Compared with controlling engagement authority', jurisdiction: 'US-NY', effectiveDate: new Date('2026-07-19'),
    }, { ...context, requestId: randomUUID() })
    assert.equal(reviewed.reviewStatus, 'APPROVED')
    assert.equal(await verifyAuditChain(firm.id), true)
  })

  await suite.test('database rejects version evidence mutation and second review', async () => {
    const version = await prisma.documentVersion.findUniqueOrThrow({ where: { id: document.versions[0].id } })
    await assert.rejects(() => prisma.documentVersion.update({ where: { id: version.id }, data: { contentSha256: 'f'.repeat(64) } }))
    await assert.rejects(() => prisma.documentVersion.update({ where: { id: version.id }, data: { reviewStatus: 'REJECTED' } }))
  })

  await suite.test('new evidence creates a conflicting pending version without changing history', async () => {
    const current = await prisma.document.findUniqueOrThrow({ where: { id: document.id } })
    const changed = Buffer.from(applyTextRedactions(original.toString('utf8'), [{ start: 21, end: 32 }]))
    assert.equal(changed.toString('utf8'), 'Contract for account [REDACTED]')
    const version = await addDocumentVersion(current, reviewer.id, {
      storageKey: `test/${suffix}/v2.txt`, size: changed.length, mimeType: 'text/plain', contentSha256: sha256(changed),
      sourceType: 'REDACTION', sourceProvider: 'test-redactor', sourceEventId: `redaction-${suffix}`, sourceTimestamp: new Date(),
    }, 'Approved deterministic redaction', { ...context, requestId: randomUUID() })
    assert.equal(version.version, 2)
    const versions = await prisma.documentVersion.findMany({ where: { documentId: document.id }, orderBy: { version: 'asc' } })
    assert.deepEqual(versions.map((item) => item.contentSha256), [sha256(original), sha256(changed)])
  })

  await suite.test('duplicate provider identity with altered evidence rolls back', async () => {
    const current = await prisma.document.findUniqueOrThrow({ where: { id: document.id } })
    const beforeVersion = current.version
    await assert.rejects(() => addDocumentVersion(current, reviewer.id, {
      storageKey: `test/${suffix}/collision.txt`, size: 1, mimeType: 'text/plain', contentSha256: sha256('x'),
      sourceType: 'REDACTION', sourceProvider: 'test-redactor', sourceEventId: `redaction-${suffix}`, sourceTimestamp: new Date(),
    }, 'Altered replay', { ...context, requestId: randomUUID() }))
    assert.equal((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).version, beforeVersion)
  })

  await suite.test('active hold links and audit events are database-immutable', async () => {
    const hold = await prisma.legalHold.create({
      data: {
        firmId: firm.id, clientId: client.id, createdById: leader.id, name: 'Investigation hold', reason: 'Preserve evidence',
        authority: 'General Counsel', matterRef: `MATTER-${suffix}`, effectiveAt: new Date(),
        documents: { create: { documentId: document.id } },
      },
    })
    await assert.rejects(() => prisma.legalHoldDocument.delete({ where: { legalHoldId_documentId: { legalHoldId: hold.id, documentId: document.id } } }))
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { firmId: firm.id } })
    await assert.rejects(() => prisma.auditLog.update({ where: { id: audit.id }, data: { action: 'tampered' } }))
    assert.equal(await verifyAuditChain(firm.id), true)
  })

  await suite.test('audit export contains versions, hashes, and hold authority', async () => {
    const documents = await prisma.document.findMany({
      where: { firmId: firm.id },
      include: { versions: { orderBy: { version: 'asc' } }, legalHoldLinks: { include: { legalHold: true } } },
    })
    const events = await prisma.auditLog.findMany({ where: { firmId: firm.id }, orderBy: { sequence: 'asc' } })
    const csv = buildDocumentAuditCsv({ documents, events, chainValid: await verifyAuditChain(firm.id) })
    assert.match(csv, /audit_chain_valid","true/)
    assert.match(csv, new RegExp(document.versions[0].contentSha256))
    assert.match(csv, new RegExp(`MATTER-${suffix}`))
  })

  await suite.test('verified signer failure is persisted, audited, idempotent, and terminal', async () => {
    const version = await prisma.documentVersion.findUniqueOrThrow({
      where: { documentId_version: { documentId: document.id, version: 1 } },
    })
    const provider = `test-esign-${suffix}`
    const envelopeId = `envelope-${suffix}`
    const signerEmail = `signer-${suffix}@example.test`
    const signature = await prisma.documentSignature.create({
      data: {
        documentId: document.id,
        documentVersionId: version.id,
        requestedById: uploader.id,
        signerName: 'Failure Signer',
        signerEmail,
        provider,
        providerEnvelopeId: envelopeId,
        status: 'PENDING',
      },
    })
    const secret = 'integration-test-webhook-secret-more-than-32-characters'
    process.env.ESIGNATURE_WEBHOOK_SECRET = secret
    const event = {
      provider,
      eventId: `failure-${suffix}`,
      envelopeId,
      signerEmail,
      status: 'FAILED',
      occurredAt: new Date().toISOString(),
      sourceSha256: version.contentSha256,
      failureCode: 'SIGNER_IDENTITY_FAILED',
      failureReason: 'Signer identity evidence could not be verified',
      evidence: { attempt: 1, identityVerified: false },
    } as const
    const rawBody = JSON.stringify(event)
    const signedRequest = () => new NextRequest('http://localhost/api/webhooks/esignature', {
      method: 'POST',
      body: rawBody,
      headers: {
        'content-type': 'application/json',
        'x-esignature-signature': createHmac('sha256', secret).update(rawBody).digest('hex'),
      },
    })
    const response = await processSignatureWebhook(signedRequest())
    assert.equal(response.status, 200)
    const failed = await prisma.documentSignature.findUniqueOrThrow({ where: { id: signature.id } })
    assert.equal(failed.status, 'FAILED')
    assert.equal(failed.failureCode, event.failureCode)
    assert.equal(await prisma.documentProcessingEvent.count({ where: { provider, providerEventId: event.eventId } }), 1)

    const replay = await processSignatureWebhook(signedRequest())
    assert.equal(replay.status, 200)
    assert.equal((await replay.json()).replay, true)
    assert.equal(await prisma.documentProcessingEvent.count({ where: { provider, providerEventId: event.eventId } }), 1)

    const signedBody = JSON.stringify({ ...event, eventId: `late-sign-${suffix}`, status: 'SIGNED' })
    const lateSigned = await processSignatureWebhook(new NextRequest('http://localhost/api/webhooks/esignature', {
      method: 'POST',
      body: signedBody,
      headers: {
        'content-type': 'application/json',
        'x-esignature-signature': createHmac('sha256', secret).update(signedBody).digest('hex'),
      },
    }))
    assert.equal(lateSigned.status, 409)
    assert.equal((await prisma.documentSignature.findUniqueOrThrow({ where: { id: signature.id } })).status, 'FAILED')
    assert.equal(await verifyAuditChain(firm.id), true)
  })
})
