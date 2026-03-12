import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Trophy } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { formatBRL, formatDate } from '../lib/formatters'
import { Goal } from '../types'
import api from '../lib/api'

const GOAL_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#F59E0B']
const GOAL_ICONS = ['🎯', '🏖️', '🚗', '🏠', '💍', '📱', '✈️', '🎓', '💼', '🏋️']

function GoalForm({ onClose, goal }: { onClose: () => void; goal?: Goal }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: goal?.name || '',
    target_amount: goal?.target_amount?.toString() || '',
    current_amount: goal?.current_amount?.toString() || '0',
    target_date: goal?.target_date || '',
    color: goal?.color || GOAL_COLORS[0],
    icon: goal?.icon || '🎯',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount), target_date: form.target_date || null }
      if (goal) return api.put(`/api/goals/${goal.id}`, payload)
      return api.post('/api/goals', payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); onClose() },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="flex flex-wrap gap-2">
          {GOAL_ICONS.map(icon => (
            <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
              className={`text-xl p-1.5 rounded-lg ${form.icon === icon ? 'bg-primary-100 ring-2 ring-primary' : 'hover:bg-gray-100'}`}
            >{icon}</button>
          ))}
        </div>
      </div>
      <Input label="Nome da meta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Viagem para Europa" required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor alvo (R$)" type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
        <Input label="Já guardei (R$)" type="number" step="0.01" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
      </div>
      <Input label="Data alvo" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Cor</label>
        <div className="flex gap-2">
          {GOAL_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" className="flex-1 justify-center" loading={mutation.isPending}>{goal ? 'Salvar' : 'Criar Meta'}</Button>
      </div>
    </form>
  )
}

export default function Metas() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>()
  const qc = useQueryClient()

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/api/goals').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  return (
    <div>
      <Header
        title="Metas Financeiras"
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(undefined); setShowModal(true) }}>Nova Meta</Button>}
      />

      <div className="page-content space-y-6">
        {isLoading ? <PageSpinner /> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{goal.name}</h3>
                          {goal.target_date && (
                            <p className="text-xs text-gray-400">até {formatDate(goal.target_date)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(goal); setShowModal(true) }} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => { if (confirm('Excluir meta?')) deleteMutation.mutate(goal.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{formatBRL(goal.current_amount)}</span>
                        <span>{goal.progress_percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(goal.progress_percentage, 100)}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">Meta: {formatBRL(goal.target_amount)}</p>
                    </div>

                    {/* Monthly needed */}
                    {goal.monthly_needed !== null && goal.monthly_needed > 0 && (
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Guardar por mês</p>
                        <p className="font-bold text-sm" style={{ color: goal.color }}>{formatBRL(goal.monthly_needed)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* New goal CTA */}
              <button
                onClick={() => { setEditing(undefined); setShowModal(true) }}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nova meta</p>
              </button>
            </div>

            {completedGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Metas Concluídas 🏆</CardTitle>
                </CardHeader>
                <div className="divide-y divide-gray-50">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4 px-6 py-3 opacity-70">
                      <span className="text-xl">{goal.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{goal.name}</p>
                        <p className="text-xs text-gray-400">{formatBRL(goal.target_amount)}</p>
                      </div>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {goals.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🎯</p>
                <p className="text-lg font-semibold text-gray-900">Defina suas metas financeiras</p>
                <p className="text-sm text-gray-500 mt-1 mb-6">Economize para viagens, carro, casa e muito mais</p>
                <Button onClick={() => setShowModal(true)}>Criar primeira meta</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(undefined) }} title={editing ? 'Editar Meta' : 'Nova Meta'}>
        <GoalForm onClose={() => { setShowModal(false); setEditing(undefined) }} goal={editing} />
      </Modal>
    </div>
  )
}
