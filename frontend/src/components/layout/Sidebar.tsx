import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Upload, TrendingUp, CreditCard,
  Target, RefreshCw, FileText, BarChart3, Lightbulb, Settings, LogOut,
  ChevronLeft, ChevronRight, DollarSign,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/importar', icon: Upload, label: 'Importar PDF' },
  { to: '/investimentos', icon: TrendingUp, label: 'Investimentos' },
  { to: '/dividas', icon: CreditCard, label: 'Dívidas' },
  { to: '/orcamento', icon: BarChart3, label: 'Orçamento' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/assinaturas', icon: RefreshCw, label: 'Assinaturas' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/projecoes', icon: BarChart3, label: 'Projeções' },
  { to: '/insights', icon: Lightbulb, label: 'Insights IA' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`
      bg-gray-900 text-white flex flex-col transition-all duration-300 h-screen sticky top-0
      ${collapsed ? 'w-16' : 'w-60'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-white">FinançasBR</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors
              ${isActive
                ? 'bg-primary text-white font-medium'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-gray-700 p-3">
        {!collapsed && user && (
          <div className="px-2 py-2 mb-2">
            <p className="text-xs text-gray-500">Logado como</p>
            <p className="text-sm text-white font-medium truncate">{user.name}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors mt-1 ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>}
        </button>
      </div>
    </aside>
  )
}
