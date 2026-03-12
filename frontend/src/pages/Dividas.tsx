import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Check } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { formatBRL, formatDate } from '../lib/formatters'
import { Debt } from '../types'
import api from '../lib/api'

function DebtForm({ onClose, debt }: { onClose: () => void; debt?: Debt }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: debt?.name || '',
    total_amount: debt?.total_amount?.toString() || '',
    remaining_amount: debt?.remaining_amount?.toString() || '',
    interest_rate: debt?.interest_rate?.toString() || '0',
    monthly_payment: debt?.monthly_payment?.toString() || '',
    due_date: debt?.due_date || '',
    notes: debt?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        total_amount: parseFloat(form.total_amount),
        remaining_amount: parseFloat(form.remaining_amount),
        interest_rate: parseFloat(form.interest_rate),
        monthly_payment: parseFloat(form.monthly_payment),
        due_date: form.due_date || null,
      }
      if (debt) return api.put(`/api/debts/${debt.id}`, payload)
      return api.post('/api/debts', payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); onClose() },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      <Input label="Nome da dívida" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Cartão Nubank" required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor total (R$)" type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
        <Input label="Saldo restante (R$)" type="number" step="0.01" value={form.remaining_amount} onChange={(e) => setForm({ ...form, remaining_amount: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Taxa de juros (% a.m.)" type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
        <Input label="Parcela mensal (R$)" type="number" step="0.01" value={form.monthly_payment} onChange={(e) => setForm({ ...form, monthly_payment: e.target.value })} required />
      </div>
      <Input label="Data de vencimento" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" className="flex-1 justify-center" loading={mutation.isPending}>{debt ? 'Salvar' : 'Adicionar'}</Button>
      </div>
    </form>
  )
}

export default function Dividas() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Debt | undefined>()
  const qc = useQueryClient()

  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: () => api.get('/api/debts').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/debts/${id}`, { is_paid: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })

  const activeDebts = debts.filter(d => !d.is_paid)
  const totalRemaining = activeDebts.reduce((s, d) => s + d.remaining_amount, 0)
  const totalMonthly = activeDebts.reduce((s, d) => s + d.monthly_payment, 0)

  return (
    <div>
      <Header
        title="Dívidas"
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(undefined); setShowModal(true) }}>Adicionar</Button>}
      />

      <div className="page-content space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total em dívidas" value={formatBRL(totalRemaining)} color="red" />
          <StatCard title="Parcelas mensais" value={formatBRL(totalMonthly)} color="primary" />
          <StatCard title="Dívidas ativas" value={activeDebts.length.toString()} />
        </div>

        <Card>
          <CardHeader><CardTitle>Dívidas Ativas</CardTitle></CardHeader>
          {isLoading ? <CardContent><PageSpinner /></CardContent> : (
            <div className="divide-y divide-gray-50">
              {activeDebts.map((debt) => {
                const paidPercent = debt.total_amount > 0
                  ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100
                  : 0
                const monthsLeft = debt.monthly_payment > 0 ? Math.ceil(debt.remaining_amount / debt.monthly_payment) : 0

                return (
                  <div key={debt.id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{debt.name}</h3>
                          <span className="text-lg font-bold text-red-500">{formatBRL(debt.remaining_amount)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full mb-2">
                          <div
                            className="h-full bg-red-400 rounded-full transition-all"
                            style={{ width: `${Math.min(paidPercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>{paidPercent.toFixed(0)}% pago</span>
                          <span>{monthsLeft} meses restantes</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Parcela: <strong>{formatBRL(debt.monthly_payment)}</strong>/mês</span>
                          <span>Juros: <strong>{debt.interest_rate}%</strong> a.m.</span>
                          {debt.due_date && <span>Venc: <strong>{formatDate(debt.due_date)}</strong></span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { if (confirm('Marcar como pago?')) markPaidMutation.mutate(debt.id) }} className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50" title="Marcar como pago">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditing(debt); setShowModal(true) }} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Excluir dívida?')) deleteMutation.mutate(debt.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {activeDebts.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">🎉 Nenhuma dívida ativa!</div>
              )}
            </div>
          )}
        </Card>

        {debts.filter(d => d.is_paid).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Dívidas Quitadas ✅</CardTitle></CardHeader>
            <div className="divide-y divide-gray-50">
              {debts.filter(d => d.is_paid).map((debt) => (
                <div key={debt.id} className="flex items-center gap-4 px-6 py-3 opacity-60">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-through">{debt.name}</p>
                    <p className="text-xs text-gray-400">{formatBRL(debt.total_amount)}</p>
                  </div>
                  <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(debt.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(undefined) }} title={editing ? 'Editar Dívida' : 'Nova Dívida'}>
        <DebtForm onClose={() => { setShowModal(false); setEditing(undefined) }} debt={editing} />
      </Modal>
    </div>
  )
}
