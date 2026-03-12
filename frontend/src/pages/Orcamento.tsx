import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { formatBRL, formatMonth, currentMonthYear } from '../lib/formatters'
import { Budget, Category } from '../types'
import { MONTH_NAMES } from '../lib/constants'
import api from '../lib/api'

export default function Orcamento() {
  const { month, year } = currentMonthYear()
  const [selMonth, setSelMonth] = useState(month)
  const [selYear, setSelYear] = useState(year)
  const [showModal, setShowModal] = useState(false)
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const qc = useQueryClient()

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', selMonth, selYear],
    queryFn: () => api.get(`/api/budgets?month=${selMonth}&year=${selYear}`).then(r => r.data),
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/budgets', {
      category_id: parseInt(newCategoryId),
      amount: parseFloat(newAmount),
      month: selMonth,
      year: selYear,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setShowModal(false); setNewCategoryId(''); setNewAmount('') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const MONTHS = MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))
  const YEARS = Array.from({ length: 3 }, (_, i) => { const y = new Date().getFullYear() - i; return { value: y, label: String(y) } })

  return (
    <div>
      <Header
        title="Orçamento"
        subtitle={formatMonth(selMonth, selYear)}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Novo Orçamento</Button>}
      />

      <div className="page-content space-y-5">
        {/* Month selector */}
        <div className="flex gap-3">
          <Select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))} options={MONTHS} className="w-36" />
          <Select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))} options={YEARS} className="w-28" />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-medium">Orçamento Total</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatBRL(totalBudget)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium">Gasto</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatBRL(totalSpent)}</p>
          </div>
          <div className={`border rounded-xl p-4 ${totalBudget - totalSpent >= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className="text-xs text-gray-600 font-medium">Disponível</p>
            <p className={`text-xl font-bold mt-1 ${totalBudget - totalSpent >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
              {formatBRL(totalBudget - totalSpent)}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
          {isLoading ? <CardContent><PageSpinner /></CardContent> : (
            <div className="divide-y divide-gray-50">
              {budgets.map((b) => (
                <div key={b.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{b.category_icon}</span>
                      <span className="font-medium text-sm text-gray-900">{b.category_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${b.remaining >= 0 ? 'text-gray-600' : 'text-red-500'}`}>
                        {formatBRL(b.spent)} / {formatBRL(b.amount)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.percentage >= 100 ? 'bg-red-100 text-red-600' :
                        b.percentage >= 80 ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>{b.percentage.toFixed(0)}%</span>
                      <button onClick={() => { if (confirm('Excluir orçamento?')) deleteMutation.mutate(b.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(b.percentage, 100)}%`,
                        backgroundColor: b.percentage >= 100 ? '#EF4444' : b.percentage >= 80 ? '#F97316' : b.category_color,
                      }}
                    />
                  </div>
                </div>
              ))}
              {budgets.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Nenhum orçamento definido para este mês
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Definir Orçamento">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }} className="space-y-4">
          <Select
            label="Categoria"
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            options={[
              { value: '', label: 'Selecione uma categoria' },
              ...expenseCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })),
            ]}
          />
          <Input
            label="Limite mensal (R$)"
            type="number"
            step="0.01"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="0,00"
            required
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancelar</Button>
            <Button type="submit" className="flex-1 justify-center" loading={createMutation.isPending} disabled={!newCategoryId || !newAmount}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
