'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, X, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SETTINGS_KEY = 'followup_settings'
const LAST_RUN_KEY = 'followup_last_run'

type Settings = { enabled: boolean; days: number }

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { enabled: true, days: 7, ...JSON.parse(raw) }
  } catch {}
  return { enabled: true, days: 7 }
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center rounded-full transition-colors flex-shrink-0"
      style={{ width: '40px', height: '22px', background: checked ? '#0066FF' : '#2a2a3a' }}
    >
      <span
        className="absolute rounded-full bg-white transition-transform"
        style={{
          width: '16px',
          height: '16px',
          transform: checked ? 'translateX(21px)' : 'translateX(3px)',
        }}
      />
    </button>
  )
}

export default function FollowUpAutomation() {
  const [settings, setSettings] = useState<Settings>({ enabled: true, days: 7 })
  const [daysInput, setDaysInput] = useState('7')
  const [expanded, setExpanded] = useState(false)
  const [banner, setBanner] = useState(0)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    setDaysInput(String(s.days))
    setLastRun(localStorage.getItem(LAST_RUN_KEY))

    const today = new Date().toISOString().split('T')[0]
    if (!s.enabled) return
    if (localStorage.getItem(LAST_RUN_KEY) === today) return

    runCheck(s.days)
  }, [])

  async function runCheck(days: number) {
    setChecking(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    try {
      const [{ data: clients }, { data: interactions }] = await Promise.all([
        supabase.from('clients').select('id, full_name, assigned_to').in('status', ['lead', 'active']),
        supabase.from('interactions').select('client_id, date').order('date', { ascending: false }),
      ])

      // Build last-interaction map
      const lastMap: Record<string, string> = {}
      for (const i of interactions ?? []) {
        if (!lastMap[i.client_id]) lastMap[i.client_id] = i.date
      }

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      const stale = (clients ?? []).filter(c => {
        const last = lastMap[c.id]
        return !last || new Date(last) < cutoff
      })

      if (stale.length === 0) {
        localStorage.setItem(LAST_RUN_KEY, today)
        setLastRun(today)
        setChecking(false)
        return
      }

      // Avoid duplicates — check for existing pending follow-up tasks
      const { data: existing } = await supabase
        .from('tasks')
        .select('client_id')
        .eq('status', 'pending')
        .in('client_id', stale.map(c => c.id))
        .ilike('title', 'Follow up with%')

      const hasTask = new Set((existing ?? []).map(t => t.client_id))
      const toCreate = stale.filter(c => !hasTask.has(c.id))

      if (toCreate.length > 0) {
        await supabase.from('tasks').insert(
          toCreate.map(c => ({
            title: `Follow up with ${c.full_name}`,
            client_id: c.id,
            assigned_to: c.assigned_to,
            priority: 'medium',
            status: 'pending',
            due_date: today,
          }))
        )
        setBanner(toCreate.length)
      }

      localStorage.setItem(LAST_RUN_KEY, today)
      setLastRun(today)
    } catch (err) {
      console.error('Follow-up check error:', err)
    }

    setChecking(false)
  }

  function saveSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  }

  function handleDaysBlur() {
    const v = Math.max(1, Math.min(365, parseInt(daysInput) || 7))
    setDaysInput(String(v))
    saveSettings({ days: v })
  }

  function handleRunNow() {
    localStorage.removeItem(LAST_RUN_KEY)
    runCheck(settings.days)
  }

  return (
    <div className="mb-6">
      {/* Banner */}
      {banner > 0 && !bannerDismissed && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl mb-4"
          style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.25)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,102,255,0.2)' }}>
              <Zap size={14} style={{ color: '#0066FF' }} />
            </div>
            <p className="text-sm text-white font-medium">
              {banner} follow-up task{banner !== 1 ? 's' : ''} automatically created
            </p>
            <Link href="/tasks" className="text-xs font-semibold whitespace-nowrap" style={{ color: '#0066FF' }}>
              View tasks →
            </Link>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1 rounded-lg hover:bg-[#1e1e2e] transition-colors flex-shrink-0"
            style={{ color: '#555570' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Settings card */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#13131f] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Zap size={15} style={{ color: settings.enabled ? '#0066FF' : '#555570' }} />
            <span className="text-sm font-medium text-white">Auto Follow-Up</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: settings.enabled ? 'rgba(0,102,255,0.15)' : 'rgba(85,85,112,0.15)',
                color: settings.enabled ? '#0066FF' : '#555570',
              }}
            >
              {checking ? 'Checking…' : settings.enabled ? `Every ${settings.days}d` : 'Off'}
            </span>
          </div>
          {expanded
            ? <ChevronUp size={15} style={{ color: '#555570' }} />
            : <ChevronDown size={15} style={{ color: '#555570' }} />}
        </button>

        {expanded && (
          <div className="px-5 pb-5 pt-1 space-y-4" style={{ borderTop: '1px solid #1e1e2e' }}>
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Enable auto follow-up</p>
                <p className="text-xs mt-0.5" style={{ color: '#555570' }}>
                  Creates a task when a client has no interaction for{' '}
                  <strong className="text-white">{settings.days}</strong> days
                </p>
              </div>
              <Toggle checked={settings.enabled} onChange={v => saveSettings({ enabled: v })} />
            </div>

            {/* Days setting */}
            <div className="flex items-center gap-3">
              <label className="text-sm flex-shrink-0" style={{ color: '#8888aa' }}>
                No-contact threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={daysInput}
                  onChange={e => setDaysInput(e.target.value)}
                  onBlur={handleDaysBlur}
                  disabled={!settings.enabled}
                  className="w-16 bg-[#0a0a0f] text-white border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-[#0066FF] disabled:opacity-40"
                />
                <span className="text-sm" style={{ color: '#8888aa' }}>days</span>
              </div>
            </div>

            {/* Status + run now */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs" style={{ color: '#555570' }}>
                {lastRun
                  ? `Last ran: ${lastRun}`
                  : 'Has not run yet this session'}
              </p>
              <button
                type="button"
                onClick={handleRunNow}
                disabled={checking || !settings.enabled}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                style={{ background: 'rgba(0,102,255,0.1)', color: '#0066FF', border: '1px solid rgba(0,102,255,0.2)' }}
              >
                {checking ? 'Checking…' : 'Run Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
