'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DealStage } from '@/lib/types'

const stages: { value: DealStage; label: string }[] = [
  { value: 'new_enquiry', label: 'New Enquiry' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

export default function UpdateDealStage({ dealId, currentStage }: { dealId: string; currentStage: DealStage }) {
  const [stage, setStage] = useState(currentStage)
  const router = useRouter()
  const supabase = createClient()

  async function handleChange(newStage: DealStage) {
    setStage(newStage)
    await supabase.from('deals').update({ stage: newStage }).eq('id', dealId)
    router.refresh()
  }

  return (
    <select
      value={stage}
      onChange={e => handleChange(e.target.value as DealStage)}
      className="bg-[#0f0f1a] text-white border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#0066FF] transition-colors"
      style={{ minWidth: '130px' }}
    >
      {stages.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}
