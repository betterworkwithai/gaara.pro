import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Edit2, Download } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { TransactionTypeBadge } from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'
import { formatBRL, formatDate, currentMonthYear } from '../lib/formatters'
import { Transaction, Category } from '../types'
import { MONTH_NAMES } from '../lib/constants'
import api from '../lib/api'

const MONTHS = MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return { value: y, label: String(y) }
})

function TransactionForm({
  onClose,
  transaction,
  categories,
}: {
  onClose: () => void
  transaction?: Transaction
  categories: Category[]
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    type: transaction?.type || 'expense',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    category_id: transaction?.category_id?.toString() || '',
    notes: transaction?.notes || '',
    is_recurring: transaction?.is_recurring || false,
    recurrence_interval: transaction?.recurrence_interval || 'monthly',
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      }
      if (transaction) {
        return api.put(`/api/transactions/${transaction.id}`, payload)
      }
      return api.post('/api/transactions', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')
  const relevantCategories = form.type === 'income' ? incomeCategories : expenseCategories

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          options={[
            { value: 'expense', label: 'Despesa' },
            { value: 'income', label: 'Receita' },
            { value: 'transfer', label: 'Transferência' },
          ]}
        />
        <Input
          label="Valor (R$)"
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
      </div>
      <Input
        label="Descrição"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Ex: Supermercado Extra"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Data"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Select
          label="Categoria"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          options={[
            { value: '', label: 'Sem categoria' },
            ...relevantCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })),
          ]}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_recurring"
          checked={form.is_recurring}
          onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          className="rounded border-gray-300 text-primary"
        />
        <label htmlFor="is_recurring" className="text-sm text-gray-700">Transação recorrente</label>
      </div>
      {form.is_recurring && (
        <Select
          label="Frequência"
          value={form.recurrence_interval}
          onChange={(e) => setForm({ ...form, recurrence_interval: e.target.value })}
          options={[
            { value: 'monthly', label: 'Mensal' },
            { value: 'weekly', label: 'Semanal' },
            { value: 'yearly', label: 'Anual' },
          ]}
        />
      )}
      <Input
        label="Notas (opcional)"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Observações..."
      />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 justify-center">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 justify-center" loading={mutation.isPending}>
          {transaction ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}

export default function Transacoes() {
  const { month, year } = currentMonthYear()
  const [selMonth, setSelMonth] = useState(month)
  const [selYear, setSelYear] = useState(year)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | undefined>()
  const qc = useQueryClient()

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', selMonth, selYear, typeFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({
        month: selMonth.toString(),
        year: selYear.toString(),
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search }),
      })
      return api.get(`/api/transactions?${params}`).then(r => r.data)
    },
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const totalIncome = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const handleExport = async () => {
    const url = `/api/reports/export/csv?month=${selMonth}&year=${selYear}`
    const response = await api.get(url, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transacoes_${selMonth}_${selYear}.csv`
    link.click()
  }

  return (
    <div>
      <Header
        title="Transações"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              CSV
            </Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingTx(undefined); setShowModal(true) }}>
              Adicionar
            </Button>
          </div>
        }
      />

      <div className="page-content space-y-5">
        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3">
              <Select
                value={selMonth}
                onChange={(e) => setSelMonth(Number(e.target.value))}
                options={MONTHS}
                className="w-36"
              />
              <Select
                value={selYear}
                onChange={(e) => setSelYear(Number(e.target.value))}
                options={YEARS}
                className="w-28"
              />
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'Todos os tipos' },
                  { value: 'income', label: 'Receitas' },
                  { value: 'expense', label: 'Despesas' },
                  { value: 'transfer', label: 'Transferências' },
                ]}
                className="w-44"
              />
              <div className="flex-1 min-w-48">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar transações..."
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium">Receitas</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatBRL(totalIncome)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium">Despesas</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatBRL(totalExpenses)}</p>
          </div>
          <div className={`border rounded-xl p-4 ${totalIncome - totalExpenses >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className="text-xs text-gray-600 font-medium">Saldo</p>
            <p className={`text-xl font-bold mt-1 ${totalIncome - totalExpenses >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatBRL(totalIncome - totalExpenses)}
            </p>
          </div>
        </div>

        {/* Transactions table */}
        <Card>
          {isLoading ? (
            <CardContent><PageSpinner /></CardContent>
          ) : (
            <div className="divide-y divide-gray-50">
              {(transactions || []).map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: (t.category?.color || '#6B7280') + '20' }}
                  >
                    {t.category?.icon || '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                      {t.category && <span className="text-xs text-gray-400">· {t.category.name}</span>}
                      {t.is_recurring && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Recorrente</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                    </p>
                    <TransactionTypeBadge type={t.type} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingTx(t); setShowModal(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Excluir transação?')) deleteMutation.mutate(t.id) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(transactions || []).length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Nenhuma transação encontrada
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingTx(undefined) }}
        title={editingTx ? 'Editar Transação' : 'Nova Transação'}
      >
        <TransactionForm
          onClose={() => { setShowModal(false); setEditingTx(undefined) }}
          transaction={editingTx}
          categories={categories}
        />
      </Modal>
    </div>
  )
}
