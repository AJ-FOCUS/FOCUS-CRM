'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, AlertCircle, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type ReminderTask = {
  id: string
  title: string
  due_date: string
  priority: string
  clients: { id: string; full_name: string } | null
}

const SESSION_KEY = 'task_reminders_shown'

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ff4444',
  medium: '#ffaa00',
  low: '#8888aa',
}

export default function TaskReminderPopup() {
  const [tasks, setTasks] = useState<ReminderTask[]>([])
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, clients(id, full_name)')
        .eq('assigned_to', user.id)
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .lte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(20)

      if (!data || data.length === 0) return

      sessionStorage.setItem(SESSION_KEY, '1')
      setTasks(data as unknown as ReminderTask[])
      setVisible(true)
      // Defer so the browser paints the off-screen position first
      setTimeout(() => setEntered(true), 50)
    }

    load()
  }, [])

  function dismiss() {
    setEntered(false)
    setTimeout(() => setVisible(false), 320)
  }

  if (!visible) return null

  const today = new Date().toISOString().split('T')[0]
  const overdueCount = tasks.filter(t => t.due_date < today).length
  const todayCount = tasks.filter(t => t.due_date === today).length

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        transform: entered ? 'translateY(0)' : 'translateY(calc(100% + 32px))',
        opacity: entered ? 1 : 0,
        transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        pointerEvents: entered ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          background: '#111118',
          border: '1px solid #1e1e2e',
          borderRadius: '16px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: '#0d0d14',
            borderBottom: '1px solid #1e1e2e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'rgba(255,68,68,0.15)',
                border: '1px solid rgba(255,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={15} color="#ff4444" />
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', lineHeight: '1.2' }}>
                Task Reminders
              </p>
              <p style={{ color: '#8888aa', fontSize: '11px', marginTop: '1px' }}>
                {overdueCount > 0 && `${overdueCount} overdue`}
                {overdueCount > 0 && todayCount > 0 && ' · '}
                {todayCount > 0 && `${todayCount} due today`}
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#555570',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1e1e2e'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#555570'
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Task list */}
        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {tasks.map((task, i) => {
            const isOverdue = task.due_date < today
            const priorityColor = PRIORITY_COLOR[task.priority] ?? '#8888aa'

            return (
              <div
                key={task.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < tasks.length - 1 ? '1px solid #1e1e2e' : 'none',
                  borderLeft: `3px solid ${isOverdue ? '#ff4444' : '#ffaa00'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                {/* Priority dot */}
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: priorityColor,
                    flexShrink: 0,
                    marginTop: '5px',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {task.clients && (
                    <p style={{ color: '#0066FF', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>
                      {task.clients.full_name}
                    </p>
                  )}
                  <p
                    style={{
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '500',
                      lineHeight: '1.35',
                      marginBottom: '5px',
                    }}
                  >
                    {task.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isOverdue ? (
                      <AlertCircle size={10} color="#ff4444" />
                    ) : (
                      <Clock size={10} color="#ffaa00" />
                    )}
                    <span
                      style={{
                        fontSize: '11px',
                        color: isOverdue ? '#ff4444' : '#ffaa00',
                        fontWeight: '500',
                      }}
                    >
                      {isOverdue ? 'Overdue' : 'Due today'}
                      {' · '}
                      {format(new Date(task.due_date + 'T00:00:00'), 'd MMM yyyy')}
                    </span>
                  </div>
                </div>

                {task.clients && (
                  <Link
                    href={`/clients/${task.clients.id}`}
                    onClick={dismiss}
                    style={{
                      flexShrink: 0,
                      alignSelf: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#0066FF',
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: 'rgba(0,102,255,0.1)',
                      border: '1px solid rgba(0,102,255,0.2)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,102,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,102,255,0.1)')}
                  >
                    View
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#0d0d14',
            borderTop: '1px solid #1e1e2e',
          }}
        >
          <Link
            href="/tasks"
            onClick={dismiss}
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#0066FF',
              textDecoration: 'none',
            }}
          >
            View all tasks →
          </Link>
          <button
            onClick={dismiss}
            style={{
              fontSize: '12px',
              color: '#555570',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8888aa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555570')}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
