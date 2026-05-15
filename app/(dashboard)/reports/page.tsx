import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const SERVICE_LABELS: Record<string, string> = {
  websites: 'Websites',
  automation: 'Automation',
  advertising: 'Advertising',
  tiktok_shop: 'TikTok Shop',
}

function formatGbp(v: number) {
  if (v >= 1000) return `£${(v / 1000).toFixed(1)}k`
  return `£${v}`
}

function BarChart({
  data,
  formatValue = (v: number) => v.toString(),
  color = '#0066FF',
}: {
  data: { label: string; value: number }[]
  formatValue?: (v: number) => string
  color?: string
}) {
  if (!data.length || data.every(d => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#555570' }}>
        No data available
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.value))
  const barW = 48
  const gap = 24
  const chartH = 130
  const labelH = 28
  const valH = 18
  const padX = 12
  const totalW = padX * 2 + data.length * barW + (data.length - 1) * gap

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${chartH + labelH + valH}`}
        style={{ width: '100%', minWidth: `${totalW}px` }}
      >
        {data.map((d, i) => {
          const bh = max > 0 ? Math.max((d.value / max) * chartH, d.value > 0 ? 4 : 0) : 0
          const x = padX + i * (barW + gap)
          const y = valH + chartH - bh
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} rx={5} fill={color} fillOpacity={0.85} />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill="#ffffff" fontSize={9} fontWeight="600">
                  {formatValue(d.value)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={valH + chartH + labelH - 8}
                textAnchor="middle"
                fill="#8888aa"
                fontSize={9}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function LineChart({
  data,
  formatValue = (v: number) => v.toString(),
}: {
  data: { label: string; value: number }[]
  formatValue?: (v: number) => string
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#555570' }}>
        Not enough data yet
      </div>
    )
  }

  const vW = 540
  const vH = 190
  const pL = 44, pR = 16, pT = 24, pB = 32
  const plotW = vW - pL - pR
  const plotH = vH - pT - pB
  const max = Math.max(...data.map(d => d.value), 1)

  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * plotW,
    y: pT + plotH - (d.value / max) * plotH,
    label: d.label,
    value: d.value,
  }))

  const linePts = pts.map(p => `${p.x},${p.y}`).join(' ')
  const areaPts = [
    `${pts[0].x},${pT + plotH}`,
    ...pts.map(p => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${pT + plotH}`,
  ].join(' ')

  const yTicks = [0, 0.5, 1].map(t => ({
    y: pT + plotH * (1 - t),
    val: Math.round(max * t),
  }))

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} style={{ width: '100%' }}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pL} y1={t.y} x2={vW - pR} y2={t.y} stroke="#1e1e2e" strokeWidth={1} />
          <text x={pL - 5} y={t.y + 3} textAnchor="end" fill="#555570" fontSize={9}>
            {formatValue(t.val)}
          </text>
        </g>
      ))}
      <polygon points={areaPts} fill="rgba(0,102,255,0.08)" />
      <polyline points={linePts} fill="none" stroke="#0066FF" strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#0066FF" />
          {p.value > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fill="white" fontSize={8} fontWeight="600">
              {formatValue(p.value)}
            </text>
          )}
          <text x={p.x} y={vH - 6} textAnchor="middle" fill="#8888aa" fontSize={9}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
      <p className="text-xs font-medium mb-2" style={{ color: '#8888aa' }}>{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#555570' }}>{sub}</p>}
    </div>
  )
}

export default async function ReportsPage() {
  const supabase = await createClient()

  const now = new Date()
  const monthStartDate = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEndDate = format(endOfMonth(now), 'yyyy-MM-dd')
  const yearStartDate = `${now.getFullYear()}-01-01`
  const yearEndDate = `${now.getFullYear()}-12-31`

  // Last 6 calendar months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: format(d, 'MMM'),
      start: format(startOfMonth(d), 'yyyy-MM-dd'),
      end: format(endOfMonth(d), 'yyyy-MM-dd'),
    }
  })

  const { data: allDeals } = await supabase
    .from('deals')
    .select('id, value, stage, service_type, expected_close_date, clients(profiles(full_name))')

  const deals = (allDeals ?? []) as any[]

  const wonDeals = deals.filter(d => d.stage === 'won')
  const lostDeals = deals.filter(d => d.stage === 'lost')
  const pipelineDeals = deals.filter(d => d.stage !== 'lost')

  const totalPipeline = pipelineDeals.reduce((s, d) => s + d.value, 0)
  const wonThisMonth = wonDeals
    .filter(d => d.expected_close_date >= monthStartDate && d.expected_close_date <= monthEndDate)
    .reduce((s, d) => s + d.value, 0)
  const wonThisYear = wonDeals
    .filter(d => d.expected_close_date >= yearStartDate && d.expected_close_date <= yearEndDate)
    .reduce((s, d) => s + d.value, 0)
  const closedCount = wonDeals.length + lostDeals.length
  const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0

  // Revenue by service type
  const serviceRevenue = ['websites', 'automation', 'advertising', 'tiktok_shop'].map(st => ({
    label: SERVICE_LABELS[st],
    value: wonDeals.filter(d => d.service_type === st).reduce((s: number, d: any) => s + d.value, 0),
  }))

  // Deals by team member (all stages)
  const memberMap: Record<string, number> = {}
  for (const d of deals) {
    const name = d.clients?.profiles?.full_name ?? 'Unassigned'
    memberMap[name] = (memberMap[name] ?? 0) + d.value
  }
  const memberDeals = Object.entries(memberMap)
    .map(([label, value]) => ({ label: label.split(' ')[0], value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Monthly revenue trend (won deals, last 6 months by expected_close_date)
  const monthlyTrend = months.map(m => ({
    label: m.label,
    value: wonDeals
      .filter((d: any) => d.expected_close_date >= m.start && d.expected_close_date <= m.end)
      .reduce((s: number, d: any) => s + d.value, 0),
  }))

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm mt-1" style={{ color: '#8888aa' }}>Revenue and pipeline analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Pipeline Value" value={`£${totalPipeline.toLocaleString()}`} sub="Excluding lost deals" />
        <StatCard label="Won This Month" value={`£${wonThisMonth.toLocaleString()}`} sub={format(now, 'MMMM yyyy')} />
        <StatCard label="Won This Year" value={`£${wonThisYear.toLocaleString()}`} sub={format(now, 'yyyy')} />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${wonDeals.length} won · ${lostDeals.length} lost`}
        />
      </div>

      {/* Monthly Revenue Trend */}
      <div className="rounded-xl p-6 mb-6" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Monthly Revenue Trend</h2>
        <LineChart data={monthlyTrend} formatValue={formatGbp} />
      </div>

      {/* Bottom row: 2 bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Revenue by Service</h2>
          <BarChart data={serviceRevenue} formatValue={formatGbp} color="#0066FF" />
        </div>
        <div className="rounded-xl p-6" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Pipeline by Team Member</h2>
          {memberDeals.length > 0 ? (
            <BarChart data={memberDeals} formatValue={formatGbp} color="#a050ff" />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#555570' }}>
              No deals assigned yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
