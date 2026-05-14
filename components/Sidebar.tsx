'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Handshake,
  Kanban,
  BarChart2,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/deals', label: 'Deals', icon: Handshake },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#0066FF' }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">FOCUS</div>
            <div className="text-xs text-[#8888aa]">SOFTWARE CRM</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? 'rgba(0,102,255,0.15)' : 'transparent',
                color: isActive ? '#0066FF' : '#8888aa',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#1e1e2e]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-[#8888aa] hover:text-white hover:bg-[#1e1e2e] transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#111118] border border-[#1e1e2e]"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 flex flex-col bg-[#111118] border-r border-[#1e1e2e] transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111118] border-r border-[#1e1e2e] fixed left-0 top-0 bottom-0">
        <NavContent />
      </aside>
    </>
  )
}
