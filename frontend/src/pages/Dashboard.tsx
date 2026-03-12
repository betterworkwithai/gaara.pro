import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '../components/ui/Card'
import { ChartBar } from '../components/charts/ChartBar'
import { ChartDonut } from '../components/charts/ChartDonut'
import { PageSpinner } from '../components/ui/Spinner'
import { TransactionTypeBadge } from '../components/ui/Badge'
import { formatBRL, formatDate, formatMonth, currentMonthYear } from '../lib/formatters'
import { DashboardSummary } from '../types'
import api from '../lib/api'

function HealthScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="transform -rotate-90 w-28 h-28">
          <circle cx="56" cy="56" r="40" fill="none" stroke="#F3F4F6" strokeWidth="10" />
          <circle
            cx="56" cy="56" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const { month, year } = currentMonthYear()
  const [selMonth] = useState(month)
  const [selYear] = useState(year)

  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', selMonth, selYear],
    queryFn: () => api.get(`/api/dashboard/summary?month=${selMonth}&year=${selYear}`).then(r => r.data),
  })

  const { data: chartData } = useQuery({
    queryKey: ['chart-income-expenses'],
    queryFn: () => api.get('/api/charts/income-vs-expenses?months=6').then(r => r.data),
  })

  if (isLoading) return <PageSpinner />

  const summary = data?.summary
  const health = data?.health_score

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={formatMonth(selMonth, selYear)}
      />

      <div className="page-content space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Receitas"
            value={formatBRL(summary?.income || 0)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Despesas"
            value={formatBRL(summary?.expenses || 0)}
            icon={<TrendingDown className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            title="Saldo"
            value={formatBRL(summary?.net || 0)}
            icon={<Wallet className="w-5 h-5" />}
            color={(summary?.net || 0) >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Investimentos"
            value={formatBRL(data?.investments.current_value || 0)}
            subtitle={`Ganho: ${formatBRL(data?.investments.gain || 0)}`}
            icon={<Activity className="w-5 h-5" />}
            color="secondary"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income vs Expenses chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Receitas vs Despesas (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartBar
                data={chartData || []}
                keys={[
                  { key: 'income', name: 'Receitas', color: '#22C55E' },
                  { key: 'expenses', name: 'Despesas', color: '#EF4444' },
                ]}
                xKey="month"
              />
            </CardContent>
          </Card>

          {/* Health Score + Donut */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde Financeira</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {health && (
                <HealthScoreGauge score={health.score} label={health.label} color={health.color} />
              )}
              {health && (
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxa de poupança</span>
                    <span className="font-medium">{health.breakdown.savings_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dívida/Renda</span>
                    <span className="font-medium">{health.breakdown.debt_to_income}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">% Investido</span>
                    <span className="font-medium">{health.breakdown.investment_rate}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses by category */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gastos por Categoria</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartDonut
                data={(data?.expenses_by_category || []).map(c => ({
                  name: `${c.icon} ${c.name}`,
                  amount: c.amount,
                  color: c.color,
                }))}
              />
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transações Recentes</CardTitle>
                <Link to="/transacoes" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {(data?.recent_transactions || []).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-6 py-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: t.category.color + '20', color: t.category.color }}
                    >
                      {t.category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">{t.category.name} • {formatDate(t.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                    </span>
                  </div>
                ))}
                {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">
                    Nenhuma transação este mês
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals + Debts row */}
        {((data?.goals?.length || 0) > 0 || (data?.debts?.count || 0) > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals */}
            {(data?.goals?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Metas</CardTitle>
                    <Link to="/metas" className="text-sm text-primary hover:text-primary-dark">Ver todas</Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.goals.map((g) => (
                    <div key={g.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{g.icon} {g.name}</span>
                        <span className="text-gray-500">{g.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(g.progress, 100)}%`, backgroundColor: g.color }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{formatBRL(g.current_amount)}</span>
                        <span>{formatBRL(g.target_amount)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Debts summary */}
            {(data?.debts?.count || 0) > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Dívidas</CardTitle>
                    <Link to="/dividas" className="text-sm text-primary hover:text-primary-dark">Gerenciar</Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total em dívidas</span>
                    <span className="font-bold text-red-500">{formatBRL(data?.debts.total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Parcelas mensais</span>
                    <span className="font-semibold">{formatBRL(data?.debts.monthly_payment || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Dívidas ativas</span>
                    <span className="font-semibold">{data?.debts.count}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
