import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { ChartArea } from '../components/charts/ChartArea'
import { PageSpinner } from '../components/ui/Spinner'
import { formatBRL } from '../lib/formatters'
import { Projection } from '../types'
import api from '../lib/api'

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step: number; format: (v: number) => string
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  )
}

export default function Projecoes() {
  const [years, setYears] = useState(10)
  const [incomeGrowth, setIncomeGrowth] = useState(0.05)
  const [expenseGrowth, setExpenseGrowth] = useState(0.03)
  const [investmentReturn, setInvestmentReturn] = useState(0.10)
  const [inflation, setInflation] = useState(0.045)

  const { data: projections = [], isLoading } = useQuery<Projection[]>({
    queryKey: ['projections', years, incomeGrowth, expenseGrowth, investmentReturn, inflation],
    queryFn: () => api.get(`/api/projections?years=${years}&income_growth_rate=${incomeGrowth}&expense_growth_rate=${expenseGrowth}&investment_return_rate=${investmentReturn}&inflation_rate=${inflation}`).then(r => r.data),
  })

  const lastYear = projections[projections.length - 1]

  return (
    <div>
      <Header title="Projeções Financeiras" subtitle="Simule seu futuro financeiro" />

      <div className="page-content space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sliders */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Slider
                label="Anos de projeção"
                value={years}
                onChange={setYears}
                min={1} max={30} step={1}
                format={(v) => `${v} anos`}
              />
              <Slider
                label="Crescimento da renda"
                value={incomeGrowth}
                onChange={setIncomeGrowth}
                min={0} max={0.3} step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}% a.a.`}
              />
              <Slider
                label="Crescimento das despesas"
                value={expenseGrowth}
                onChange={setExpenseGrowth}
                min={0} max={0.2} step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}% a.a.`}
              />
              <Slider
                label="Retorno dos investimentos"
                value={investmentReturn}
                onChange={setInvestmentReturn}
                min={0} max={0.3} step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}% a.a.`}
              />
              <Slider
                label="Inflação (IPCA)"
                value={inflation}
                onChange={setInflation}
                min={0} max={0.15} step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}% a.a.`}
              />
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? <PageSpinner /> : (
              <>
                {/* Net worth summary */}
                {lastYear && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs text-blue-600 font-medium">Patrimônio em {lastYear.year}</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">{formatBRL(lastYear.net_worth)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <p className="text-xs text-green-600 font-medium">Investimentos em {lastYear.year}</p>
                      <p className="text-xl font-bold text-green-700 mt-1">{formatBRL(lastYear.investments)}</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-xs text-red-600 font-medium">Dívida restante em {lastYear.year}</p>
                      <p className="text-xl font-bold text-red-700 mt-1">{formatBRL(lastYear.debt)}</p>
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader><CardTitle>Evolução do Patrimônio Líquido</CardTitle></CardHeader>
                  <CardContent>
                    <ChartArea
                      data={projections}
                      series={[
                        { key: 'net_worth', name: 'Patrimônio', color: '#3B82F6' },
                        { key: 'investments', name: 'Investimentos', color: '#22C55E' },
                      ]}
                      xKey="year"
                      height={280}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Renda vs Despesas</CardTitle></CardHeader>
                  <CardContent>
                    <ChartArea
                      data={projections}
                      series={[
                        { key: 'income', name: 'Renda', color: '#22C55E' },
                        { key: 'expenses', name: 'Despesas', color: '#EF4444' },
                        { key: 'savings', name: 'Poupança', color: '#F97316' },
                      ]}
                      xKey="year"
                      type="line"
                      height={250}
                    />
                  </CardContent>
                </Card>

                {/* Table */}
                <Card>
                  <CardHeader><CardTitle>Tabela de Projeções</CardTitle></CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Ano', 'Renda', 'Despesas', 'Poupança', 'Investimentos', 'Dívida', 'Patrimônio'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {projections.map((p) => (
                          <tr key={p.year} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-semibold">{p.year}</td>
                            <td className="px-4 py-2.5 text-green-600">{formatBRL(p.income)}</td>
                            <td className="px-4 py-2.5 text-red-500">{formatBRL(p.expenses)}</td>
                            <td className="px-4 py-2.5">{formatBRL(p.savings)}</td>
                            <td className="px-4 py-2.5 text-blue-600">{formatBRL(p.investments)}</td>
                            <td className="px-4 py-2.5 text-red-400">{formatBRL(p.debt)}</td>
                            <td className="px-4 py-2.5 font-bold">{formatBRL(p.net_worth)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
