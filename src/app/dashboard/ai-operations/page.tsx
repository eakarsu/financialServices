import AdvisoryWorkspace from '@/components/runtime-ai/AdvisoryWorkspace'
export const dynamic = 'force-dynamic'
export default function Page() {
  return <AdvisoryWorkspace title="Workflow readiness review" description="Review authorization, evidence retention and professional review controls for a document workflow. Your ledger and document approvals remain separate human decisions." endpoint="/api/application-ai/legal-workflow-readiness" field="workflow" fieldLabel="Workflow to review" maxLength={1000} examples={[
    { label: 'Document review', value: 'Review operational readiness for a client document review workflow: verified firm and matter access, real source bytes and version hashes, an independent reviewer, revocation handling and retained provider evidence. Identify missing evidence; do not approve, file or sign anything.' },
    { label: 'Tax preparation', value: 'Review operational readiness for a client tax-document preparation workflow. Return three controls covering staff authorization and matter scope, provenance and immutable version retention, and documented professional review before filing. No client data has been supplied; do not invent it.' },
    { label: 'Retention review', value: 'Review operational readiness for a financial document retention workflow. Address leadership authorization, real retention and legal-hold evidence with version hashes, and independent professional review before disposition. Give controls and uncertainty; do not alter retention or delete documents.' }
  ]}/>
}
