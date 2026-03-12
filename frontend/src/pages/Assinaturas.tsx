import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'
import { formatBRL } from '../lib/formatters'
import { Transaction } from '../types'
import { RECURRENCE_LABELS } from '../lib/constants'
import api from '../lib/api'

export default function Assinaturas() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/api/transactions?is_recurring=true&type=expense&limit=200').then(r => r.data),
  })

  const subscriptions = transactions.filter(t => t.is_recurring && t.type === 'expense')

  const monthlyTotal = subscriptions.reduce((sum, t) => {
    if (t.recurrence_interval === 'yearly') return sum + t.amount / 12
    if (t.recurrence_interval === 'weekly') return sum + t.amount * 4.33
    return sum + t.amount
  }, 0)

  const yearlyTotal = monthlyTotal * 12

  return (
    <div>
      <Header title="Assinaturas" subtitle="Controle suas transações recorrentes" />

      <div className="page-content space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
            <p className="text-sm text-orange-600 font-medium">Custo mensal estimado</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{formatBRL(monthlyTotal)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <p className="text-sm text-red-600 font-medium">Custo anual estimado</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{formatBRL(yearlyTotal)}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas Ativas ({subscriptions.length})</CardTitle>
          </CardHeader>
          {isLoading ? <CardContent><PageSpinner /></CardContent> : (
            <div className="divide-y divide-gray-50">
              {subscriptions.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-6 py-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: (t.category?.color || '#6B7280') + '20' }}
                  >
                    {t.category?.icon || '📱'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{t.description}</p>
                    <p className="text-xs text-gray-400">
                      {t.category?.name} · {RECURRENCE_LABELS[t.recurrence_interval || 'monthly'] || 'Mensal'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-500">{formatBRL(t.amount)}</p>
                    <p className="text-xs text-gray-400">/{t.recurrence_interval === 'yearly' ? 'ano' : t.recurrence_interval === 'weekly' ? 'semana' : 'mês'}</p>
                  </div>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="py-12 text-center">
                  <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Nenhuma assinatura recorrente encontrada</p>
                  <p className="text-xs text-gray-400 mt-1">Marque transações como recorrentes ao criá-las</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
