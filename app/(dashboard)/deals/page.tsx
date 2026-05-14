import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { StageBadge, ServiceBadge } from '@/components/Badge'
import { DealStage } from '@/lib/types'
import UpdateDealStage from '@/components/UpdateDealStage'

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const stageFilter = params.stage as DealStage | undefined

  let query = supabase
    .from('deals')
    .select('*, clients(id, full_name, company)')
    .order('created_at', { ascending: false })

  if (stageFilter) {
    query = query.eq('stage', stageFilter)
  }

  const { data: deals } = await query

  const stages: { value: DealStage; label: string }[] = [
    { value: 'new_enquiry', label: 'New Enquiry' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ]

  const totalValue = deals?.filter(d => d.stage !== 'lost').reduce((s, d) => s + d.value, 0) ?? 0
  const wonValue = deals?.filter(d => d.stage === 'won').reduce((s, d) => s + d.value, 0) ?? 0

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Deals</h1>
        <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
          {deals?.length ?? 0} deals · £{totalValue.toLocaleString()} pipeline · £{wonValue.toLocaleString()} won
        </p>
      </div>

      {/* Stage filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/deals"
          className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: !stageFilter ? '#0066FF' : '#1e1e2e', color: !stageFilter ? 'white' : '#8888aa' }}
        >
          All
        </Link>
        {stages.map(s => (
          <Link
            key={s.value}
            href={`/deals?stage=${s.value}`}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: stageFilter === s.value ? '#0066FF' : '#1e1e2e', color: stageFilter === s.value ? 'white' : '#8888aa' }}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {!deals?.length ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <p className="text-sm" style={{ color: '#8888aa' }}>No deals found. Add deals from a client profile.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <div className="divide-y divide-[#1e1e2e]">
            {deals.map((deal: any) => (
              <div key={deal.id} className="flex items-start gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white">{deal.name}</span>
                    <StageBadge stage={deal.stage} />
                    <ServiceBadge service={deal.service_type} />
                  </div>
                  <Link href={`/clients/${deal.clients?.id}`} className="text-xs hover:underline" style={{ color: '#8888aa' }}>
                    {deal.clients?.full_name}{deal.clients?.company ? ` · ${deal.clients.company}` : ''}
                  </Link>
                  {deal.notes && <p className="text-xs mt-1" style={{ color: '#555570' }}>{deal.notes}</p>}
                  {deal.expected_close_date && (
                    <p className="text-xs mt-1" style={{ color: '#555570' }}>
                      Close: {format(new Date(deal.expected_close_date), 'd MMM yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">£{deal.value.toLocaleString()}</div>
                  </div>
                  <UpdateDealStage dealId={deal.id} currentStage={deal.stage} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
