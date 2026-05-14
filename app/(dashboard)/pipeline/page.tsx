import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('deals')
    .select('id, name, value, stage, created_at, clients(id, full_name, company, profiles(full_name))')
    .order('created_at', { ascending: false })

  const allDeals = (deals ?? []) as any[]
  const pipelineValue = allDeals
    .filter(d => d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0)

  const wonCount = allDeals.filter(d => d.stage === 'won').length
  const lostCount = allDeals.filter(d => d.stage === 'lost').length
  const closedCount = wonCount + lostCount
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
            Drag cards between columns to update deal stage
          </p>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-right">
            <div className="text-xs" style={{ color: '#8888aa' }}>Pipeline Value</div>
            <div className="text-lg font-bold text-white">£{pipelineValue.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: '#8888aa' }}>Win Rate</div>
            <div className="text-lg font-bold" style={{ color: winRate >= 50 ? '#00cc66' : '#ffaa00' }}>
              {winRate}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: '#8888aa' }}>Total Deals</div>
            <div className="text-lg font-bold text-white">{allDeals.length}</div>
          </div>
        </div>
      </div>
      <KanbanBoard initialDeals={allDeals} />
    </div>
  )
}
