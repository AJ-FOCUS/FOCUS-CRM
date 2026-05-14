'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DealStage } from '@/lib/types'
import Link from 'next/link'

const COLUMNS: { id: DealStage; label: string; color: string }[] = [
  { id: 'new_enquiry', label: 'New Enquiry', color: '#8888aa' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: '#0066FF' },
  { id: 'negotiating', label: 'Negotiating', color: '#ffaa00' },
  { id: 'won', label: 'Won', color: '#00cc66' },
  { id: 'lost', label: 'Lost', color: '#ff4444' },
]

interface KanbanDeal {
  id: string
  name: string
  value: number
  stage: DealStage
  clients: {
    id: string
    full_name: string
    company: string | null
    profiles: { full_name: string } | null
  } | null
}

export default function KanbanBoard({ initialDeals }: { initialDeals: KanbanDeal[] }) {
  const [deals, setDeals] = useState(initialDeals)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<DealStage | null>(null)
  const supabase = createClient()
  const dragIdRef = useRef<string | null>(null)

  async function moveDeal(dealId: string, newStage: DealStage) {
    const deal = deals.find(d => d.id === dealId)
    if (!deal || deal.stage === newStage) return
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d))
    await supabase.from('deals').update({ stage: newStage }).eq('id', dealId)
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-4" style={{ minWidth: `${COLUMNS.length * 300}px` }}>
        {COLUMNS.map(col => {
          const colDeals = deals.filter(d => d.stage === col.id)
          const isOver = dragOverCol === col.id
          return (
            <div
              key={col.id}
              className="flex-1"
              style={{ minWidth: 260 }}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id) }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null)
                }
              }}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain') || dragIdRef.current
                if (id) moveDeal(id, col.id)
                setDragOverCol(null)
                setDraggingId(null)
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: '#1e1e2e', color: '#8888aa' }}
                  >
                    {colDeals.length}
                  </span>
                </div>
                {colDeals.length > 0 && (
                  <span className="text-xs font-medium" style={{ color: '#555570' }}>
                    £{colDeals.reduce((s, d) => s + d.value, 0).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Drop zone */}
              <div
                className="rounded-xl p-2 space-y-2 transition-colors min-h-24"
                style={{
                  background: isOver ? `${col.color}10` : '#0a0a0f',
                  border: `1px solid ${isOver ? col.color + '40' : '#1e1e2e'}`,
                }}
              >
                {colDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', deal.id)
                      e.dataTransfer.effectAllowed = 'move'
                      dragIdRef.current = deal.id
                      setDraggingId(deal.id)
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDragOverCol(null)
                      dragIdRef.current = null
                    }}
                    className="rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all select-none"
                    style={{
                      background: '#111118',
                      border: '1px solid #1e1e2e',
                      opacity: draggingId === deal.id ? 0.45 : 1,
                      boxShadow: draggingId === deal.id ? 'none' : '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Link
                      href={`/clients/${deal.clients?.id}`}
                      className="text-sm font-semibold text-white hover:text-[#0066FF] transition-colors block"
                      onClick={e => e.stopPropagation()}
                    >
                      {deal.clients?.full_name ?? 'Unknown'}
                    </Link>
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#8888aa' }}>{deal.name}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-bold text-white">£{deal.value.toLocaleString()}</span>
                      {deal.clients?.profiles?.full_name && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#1e1e2e', color: '#8888aa' }}
                        >
                          {deal.clients.profiles.full_name.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* Mobile stage selector */}
                    <select
                      className="lg:hidden w-full mt-2 text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', color: '#8888aa' }}
                      value={deal.stage}
                      onChange={e => moveDeal(deal.id, e.target.value as DealStage)}
                    >
                      {COLUMNS.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                ))}

                {colDeals.length === 0 && (
                  <div
                    className="h-16 flex items-center justify-center text-xs rounded-lg"
                    style={{ color: '#555570', border: '1px dashed #1e1e2e' }}
                  >
                    Drop here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
