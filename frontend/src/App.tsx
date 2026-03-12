import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { PageLayout } from './components/layout/PageLayout'

import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Transacoes from './pages/Transacoes'
import Importar from './pages/Importar'
import Investimentos from './pages/Investimentos'
import Dividas from './pages/Dividas'
import Orcamento from './pages/Orcamento'
import Metas from './pages/Metas'
import Assinaturas from './pages/Assinaturas'
import Relatorios from './pages/Relatorios'
import Projecoes from './pages/Projecoes'
import Insights from './pages/Insights'
import Configuracoes from './pages/Configuracoes'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <PageLayout>{children}</PageLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transacoes" element={<ProtectedRoute><Transacoes /></ProtectedRoute>} />
      <Route path="/importar" element={<ProtectedRoute><Importar /></ProtectedRoute>} />
      <Route path="/investimentos" element={<ProtectedRoute><Investimentos /></ProtectedRoute>} />
      <Route path="/dividas" element={<ProtectedRoute><Dividas /></ProtectedRoute>} />
      <Route path="/orcamento" element={<ProtectedRoute><Orcamento /></ProtectedRoute>} />
      <Route path="/metas" element={<ProtectedRoute><Metas /></ProtectedRoute>} />
      <Route path="/assinaturas" element={<ProtectedRoute><Assinaturas /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/projecoes" element={<ProtectedRoute><Projecoes /></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
    </Routes>
  )
}
