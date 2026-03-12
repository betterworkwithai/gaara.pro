import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { Category } from '../types'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

const CATEGORY_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#64748B']
const CATEGORY_ICONS = ['🏠', '🍽️', '🚗', '❤️', '📚', '🎉', '👗', '📱', '🔧', '💳', '💼', '💻', '📈', '🏦', '🏢', '₿', '💰', '🎯', '✈️', '🎓']

function CategoryForm({ onClose, category }: { onClose: () => void; category?: Category }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: category?.name || '',
    type: category?.type || 'expense',
    color: category?.color || CATEGORY_COLORS[0],
    icon: category?.icon || '💰',
    keywords: category?.keywords?.map(k => k.keyword).join(', ') || '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean)
      const payload = { ...form, keywords }
      if (category) return api.put(`/api/categories/${category.id}`, payload)
      return api.post('/api/categories', payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); onClose() },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {CATEGORY_ICONS.map(icon => (
          <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
            className={`text-xl p-1.5 rounded ${form.icon === icon ? 'bg-primary-100 ring-2 ring-primary' : 'hover:bg-gray-100'}`}
          >{icon}</button>
        ))}
      </div>
      <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Select
        label="Tipo"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value as any })}
        options={[
          { value: 'expense', label: 'Despesa' },
          { value: 'income', label: 'Receita' },
          { value: 'investment', label: 'Investimento' },
          { value: 'debt', label: 'Dívida' },
        ]}
      />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Cor</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <Input
        label="Palavras-chave (separadas por vírgula)"
        value={form.keywords}
        onChange={(e) => setForm({ ...form, keywords: e.target.value })}
        placeholder="supermercado, ifood, mercado"
      />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" className="flex-1 justify-center" loading={mutation.isPending}>{category ? 'Salvar' : 'Criar'}</Button>
      </div>
    </form>
  )
}

export default function Configuracoes() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()
  const [typeFilter, setTypeFilter] = useState('all')
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  const filtered = typeFilter === 'all' ? categories : categories.filter(c => c.type === typeFilter)

  const typeLabel: Record<string, string> = { expense: 'Despesa', income: 'Receita', investment: 'Investimento', debt: 'Dívida' }

  return (
    <div>
      <Header title="Configurações" />

      <div className="page-content space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categorias</CardTitle>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(undefined); setShowModal(true) }}>
                Nova
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-0">
            <div className="flex gap-2 mb-4">
              {[['all', 'Todas'], ['expense', 'Despesas'], ['income', 'Receitas'], ['investment', 'Investimentos']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTypeFilter(v)}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${typeFilter === v ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </CardContent>
          {isLoading ? <CardContent><PageSpinner /></CardContent> : (
            <div className="divide-y divide-gray-50">
              {filtered.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 px-6 py-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">{typeLabel[cat.type]}{cat.is_default ? ' · Padrão' : ''}</p>
                  </div>
                  {!cat.is_default && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(cat); setShowModal(true) }} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Excluir categoria?')) deleteMutation.mutate(cat.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(undefined) }} title={editing ? 'Editar Categoria' : 'Nova Categoria'}>
        <CategoryForm onClose={() => { setShowModal(false); setEditing(undefined) }} category={editing} />
      </Modal>
    </div>
  )
}
