import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { PageSpinner } from '../components/ui/Spinner'
import { ChartBar } from '../components/charts/ChartBar'
import { formatBRL, formatMonth, currentMonthYear } from '../lib/formatters'
import { MONTH_NAMES } from '../lib/constants'
import api from '../lib/api'

export default function Relatorios() {
  const { month, year } = currentMonthYear()
  const [selMonth, setSelMonth] = useState(month)
  const [selYear, setSelYear] = useState(year)
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'tax'>('monthly')

  const MONTHS = MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))
  const YEARS = Array.from({ length: 5 }, (_, i) => { const y = new Date().getFullYear() - i; return { value: y, label: String(y) } })

  const { data: monthly, isLoading: loadingM } = useQuery({
    queryKey: ['report-monthly', selMonth, selYear],
    queryFn: () => api.get(`/api/reports/monthly?month=${selMonth}&year=${selYear}`).then(r => r.data),
    enabled: reportType === 'monthly',
  })

  const { data: yearly, isLoading: loadingY } = useQuery({
    queryKey: ['report-yearly', selYear],
    queryFn: () => api.get(`/api/reports/yearly?year=${selYear}`).then(r => r.data),
    enabled: reportType === 'yearly',
  })

  const { data: tax, isLoading: loadingT } = useQuery({
    queryKey: ['report-tax', selYear],
    queryFn: () => api.get(`/api/reports/tax?year=${selYear}`).then(r => r.data),
    enabled: reportType === 'tax',
  })

  const handleExportCSV = async () => {
    const url = `/api/reports/export/csv?month=${selMonth}&year=${selYear}`
    const response = await api.get(url, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${selMonth}_${selYear}.csv`
    link.click()
  }

  return (
    <div>
      <Header
        title="Relatórios"
        actions={
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
            Exportar CSV
          </Button>
        }
      />

      <div className="page-content space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            options={[
              { value: 'monthly', label: 'Relatório Mensal' },
              { value: 'yearly', label: 'Relatório Anual' },
              { value: 'tax', label: 'Declaração de IR' },
            ]}
            className="w-52"
          />
          {reportType === 'monthly' && (
            <Select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))} options={MONTHS} className="w-36" />
          )}
          <Select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))} options={YEARS} className="w-28" />
        </div>

        {/* Monthly report */}
        {reportType === 'monthly' && (
          loadingM ? <PageSpinner /> : monthly && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium">Receitas</p>
                  <p className="text-xl font-bold text-green-700 mt-1">{formatBRL(monthly.summary.income)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-600 font-medium">Despesas</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{formatBRL(monthly.summary.expenses)}</p>
                </div>
                <div className={`border rounded-xl p-4 ${monthly.summary.net >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                  <p className="text-xs text-gray-600 font-medium">Saldo</p>
                  <p className={`text-xl font-bold mt-1 ${monthly.summary.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatBRL(monthly.summary.net)}</p>
                </div>
              </div>

              <Card>
                <CardHeader><CardTitle>Gastos por Categoria — {monthly.month_name} {monthly.year}</CardTitle></CardHeader>
                <div className="divide-y divide-gray-50">
                  {monthly.expenses_by_category.map((c: any) => (
                    <div key={c.name} className="flex items-center gap-3 px-6 py-3">
                      <span>{c.icon}</span>
                      <span className="flex-1 text-sm">{c.name}</span>
                      <span className="font-semibold text-sm">{formatBRL(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader><CardTitle>Transações do Mês</CardTitle></CardHeader>
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                  {monthly.transactions.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 px-6 py-2.5">
                      <span className="text-xs text-gray-400 w-20">{t.date}</span>
                      <span className="flex-1 text-sm text-gray-700">{t.description}</span>
                      <span className="text-xs text-gray-500">{t.category}</span>
                      <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )
        )}

        {/* Yearly report */}
        {reportType === 'yearly' && (
          loadingY ? <PageSpinner /> : yearly && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium">Receitas {yearly.year}</p>
                  <p className="text-xl font-bold text-green-700 mt-1">{formatBRL(yearly.annual_income)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-600 font-medium">Despesas {yearly.year}</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{formatBRL(yearly.annual_expenses)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium">Taxa de poupança</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{yearly.savings_rate}%</p>
                </div>
              </div>
              <Card>
                <CardHeader><CardTitle>Receitas vs Despesas — {yearly.year}</CardTitle></CardHeader>
                <CardContent>
                  <ChartBar
                    data={yearly.months}
                    keys={[
                      { key: 'income', name: 'Receitas', color: '#22C55E' },
                      { key: 'expenses', name: 'Despesas', color: '#EF4444' },
                    ]}
                    xKey="month_name"
                    height={320}
                  />
                </CardContent>
              </Card>
            </div>
          )
        )}

        {/* Tax report */}
        {reportType === 'tax' && (
          loadingT ? <PageSpinner /> : tax && (
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Resumo para Declaração de IR — {tax.year}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-sm text-green-600 font-medium">Renda total</p>
                      <p className="text-2xl font-bold text-green-700">{formatBRL(tax.total_income)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-600 font-medium">Ganhos em investimentos</p>
                      <p className="text-2xl font-bold text-blue-700">{formatBRL(tax.investment_gains)}</p>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Deduções</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">❤️ Despesas de saúde</span>
                        <span className="font-medium">{formatBRL(tax.deductible_expenses.health)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">📚 Despesas de educação</span>
                        <span className="font-medium">{formatBRL(tax.deductible_expenses.education)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>Total deduções</span>
                        <span>{formatBRL(tax.deductible_expenses.total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button icon={<FileText className="w-4 h-4" />} onClick={handleExportCSV} variant="outline">
                      Exportar dados de receitas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  )
}
