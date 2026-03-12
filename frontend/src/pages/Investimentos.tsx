import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { ChartDonut } from '../components/charts/ChartDonut'
import { formatBRL, formatDate } from '../lib/formatters'
import { Investment } from '../types'
import { INVESTMENT_TYPE_LABELS, CHART_COLORS } from '../lib/constants'
import api from '../lib/api'

function InvestmentForm({ onClose, investment }: { onClose: () => void; investment?: Investment }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: investment?.name || '',
    type: investment?.type || 'renda_fixa',
    amount_invested: investment?.amount_invested?.toString() || '',
    current_value: investment?.current_value?.toString() || '',
    date: investment?.date || new Date().toISOString().split('T')[0],
    notes: investment?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, amount_invested: parseFloat(form.amount_invested), current_value: parseFloat(form.current_value) }
      if (investment) return api.put(`/api/investments/${investment.id}`, payload)
      return api.post('/api/investments', payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); onClose() },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: PETR4" required />
      <Select
        label="Tipo"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value as any })}
        options={Object.entries(INVESTMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor investido (R$)" type="number" step="0.01" value={form.amount_invested} onChange={(e) => setForm({ ...form, amount_invested: e.target.value })} required />
        <Input label="Valor atual (R$)" type="number" step="0.01" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} required />
      </div>
      <Input label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
      <Input label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" className="flex-1 justify-center" loading={mutation.isPending}>{investment ? 'Salvar' : 'Adicionar'}</Button>
      </div>
    </form>
  )
}

export default function Investimentos() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Investment | undefined>()
  const qc = useQueryClient()

  const { data: investments = [], isLoading } = useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: () => api.get('/api/investments').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/investments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments'] }),
  })

  const totalInvested = investments.reduce((s, i) => s + i.amount_invested, 0)
  const totalCurrent = investments.reduce((s, i) => s + i.current_value, 0)
  const gain = totalCurrent - totalInvested
  const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0

  // Group by type for donut
  const byType = Object.entries(INVESTMENT_TYPE_LABELS).map(([type, label], idx) => ({
    name: label,
    amount: investments.filter(i => i.type === type).reduce((s, i) => s + i.current_value, 0),
    color: CHART_COLORS[idx % CHART_COLORS.length],
  })).filter(d => d.amount > 0)

  return (
    <div>
      <Header
        title="Investimentos"
        actions={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(undefined); setShowModal(true) }}>
            Adicionar
          </Button>
        }
      />

      <div className="page-content space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Investido" value={formatBRL(totalInvested)} color="secondary" icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard title="Valor Atual" value={formatBRL(totalCurrent)} color="secondary" />
          <StatCard
            title="Ganho/Perda"
            value={formatBRL(gain)}
            color={gain >= 0 ? 'green' : 'red'}
            icon={gain >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          />
          <StatCard title="Rentabilidade" value={`${gainPercent.toFixed(2)}%`} color={gainPercent >= 0 ? 'green' : 'red'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Distribuição por Tipo</CardTitle></CardHeader>
            <CardContent><ChartDonut data={byType} /></CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Meus Investimentos</CardTitle></CardHeader>
            {isLoading ? <CardContent><PageSpinner /></CardContent> : (
              <div className="divide-y divide-gray-50">
                {investments.map((inv) => {
                  const g = inv.current_value - inv.amount_invested
                  const gp = inv.amount_invested > 0 ? (g / inv.amount_invested) * 100 : 0
                  return (
                    <div key={inv.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{inv.name}</p>
                        <p className="text-xs text-gray-400">{INVESTMENT_TYPE_LABELS[inv.type]} · {formatDate(inv.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatBRL(inv.current_value)}</p>
                        <p className={`text-xs font-medium ${g >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {g >= 0 ? '+' : ''}{formatBRL(g)} ({gp.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(inv); setShowModal(true) }} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(inv.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {investments.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">Nenhum investimento cadastrado</div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(undefined) }} title={editing ? 'Editar Investimento' : 'Novo Investimento'}>
        <InvestmentForm onClose={() => { setShowModal(false); setEditing(undefined) }} investment={editing} />
      </Modal>
    </div>
  )
}
