import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { formatBRL, formatPercent } from '../lib/formatters'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../lib/constants'
import { InsightSuggestion } from '../types'
import api from '../lib/api'

function HealthGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="transform -rotate-90 w-36 h-36">
          <circle cx="72" cy="72" r="52" fill="none" stroke="#F3F4F6" strokeWidth="12" />
          <circle
            cx="72" cy="72" r="52" fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="mt-3 text-lg font-bold" style={{ color }}>{label}</span>
    </div>
  )
}

export default function Insights() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.get('/api/insights').then(r => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  })

  const health = data?.health_score
  const ai = data?.ai_insights

  const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 }
  const suggestions: InsightSuggestion[] = [...(ai?.suggestions || [])].sort(
    (a, b) => (priorityOrder[a.prioridade] || 2) - (priorityOrder[b.prioridade] || 2)
  )

  return (
    <div>
      <Header
        title="Insights IA"
        subtitle="Análise inteligente da sua saúde financeira"
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Atualizar análise
          </Button>
        }
      />

      <div className="page-content space-y-6">
        {isLoading ? <PageSpinner /> : (
          <>
            {/* Health Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="flex flex-col items-center py-6">
                {health && <HealthGauge score={health.score} label={health.label} color={health.color} />}
                <p className="text-sm text-gray-500 mt-3">Score de Saúde Financeira</p>
              </Card>

              {/* Breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Detalhamento do Score</CardTitle></CardHeader>
                <CardContent>
                  {health && (
                    <div className="space-y-4">
                      {[
                        { label: 'Taxa de Poupança', score: health.breakdown.savings_score, value: `${health.breakdown.savings_rate}%`, weight: '30%' },
                        { label: 'Controle de Dívidas', score: health.breakdown.debt_score, value: `DTI: ${health.breakdown.debt_to_income}%`, weight: '25%' },
                        { label: 'Investimentos', score: health.breakdown.investment_score, value: `${health.breakdown.investment_rate}% da renda`, weight: '25%' },
                        { label: 'Aderência ao Orçamento', score: health.breakdown.budget_score, value: '', weight: '20%' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <div>
                              <span className="font-medium text-gray-900">{item.label}</span>
                              {item.value && <span className="text-gray-400 ml-2 text-xs">({item.value})</span>}
                            </div>
                            <span className="font-bold">{item.score}/100</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${item.score}%`,
                                backgroundColor: item.score >= 80 ? '#22C55E' : item.score >= 60 ? '#3B82F6' : item.score >= 40 ? '#F97316' : '#EF4444',
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">Peso: {item.weight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            {ai?.resumo && (
              <Card>
                <CardContent className="py-5">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-relaxed">{ai.resumo}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick stats */}
            {ai?.estatisticas && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ai.estatisticas.meta_poupanca && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium">Meta de Poupança Sugerida</p>
                    <p className="text-base font-bold text-green-700 mt-1">{ai.estatisticas.meta_poupanca}</p>
                  </div>
                )}
                {ai.estatisticas.prazo_quitacao_dividas && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs text-red-600 font-medium">Prazo Estimado para Quitar Dívidas</p>
                    <p className="text-base font-bold text-red-700 mt-1">{ai.estatisticas.prazo_quitacao_dividas}</p>
                  </div>
                )}
                {ai.estatisticas.projecao_patrimonio_5anos && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-medium">Patrimônio Estimado em 5 Anos</p>
                    <p className="text-base font-bold text-blue-700 mt-1">{ai.estatisticas.projecao_patrimonio_5anos}</p>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">Sugestões de Melhoria</h2>
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: PRIORITY_COLORS[s.prioridade] }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">{s.titulo}</h3>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                              style={{ backgroundColor: PRIORITY_COLORS[s.prioridade] }}
                            >
                              {PRIORITY_LABELS[s.prioridade]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{s.descricao}</p>
                          {s.impacto_estimado && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                              <p className="text-xs text-green-600">{s.impacto_estimado}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {suggestions.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Lightbulb className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">Clique em "Atualizar análise" para gerar insights</p>
                    <p className="text-xs text-gray-400 mt-1">Adicione transações para obter sugestões personalizadas</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
