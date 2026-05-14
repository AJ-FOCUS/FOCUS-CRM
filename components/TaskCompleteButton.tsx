'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { TaskStatus } from '@/lib/types'

export default function TaskCompleteButton({
  taskId,
  status,
}: {
  taskId: string
  status: TaskStatus
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const newStatus: TaskStatus = status === 'pending' ? 'complete' : 'pending'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    router.refresh()
    setLoading(false)
  }

  const isDone = status === 'complete'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isDone ? 'Mark as pending' : 'Mark as complete'}
      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 hover:scale-110"
      style={{
        borderColor: isDone ? '#00cc66' : '#2a2a3a',
        background: isDone ? '#00cc66' : 'transparent',
      }}
    >
      {isDone && <Check size={10} color="white" strokeWidth={3} />}
    </button>
  )
}
