import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Check, X, AlertCircle } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { formatBRL, formatDate } from '../lib/formatters'
import { ExtractedTransaction, Category } from '../types'
import api from '../lib/api'

export default function Importar() {
  const [documentType, setDocumentType] = useState('credit_card')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'review' | 'done'>('idle')
  const [documentId, setDocumentId] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const qc = useQueryClient()

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType)
      return api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: ({ data }) => {
      setDocumentId(data.document_id)
      const txs = (data.transactions || []).map((t: any, i: number) => ({ ...t, _id: i }))
      setTransactions(txs)
      setSelectedIds(new Set(txs.map((_: any, i: number) => i)))
      setUploadStatus('review')
    },
    onError: () => setUploadStatus('idle'),
  })

  const confirmMutation = useMutation({
    mutationFn: () => {
      const selected = transactions.filter((_, i) => selectedIds.has(i))
      return api.post(`/api/documents/${documentId}/confirm`, { transactions: selected })
    },
    onSuccess: () => {
      setUploadStatus('done')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setUploadStatus('uploading')
      uploadMutation.mutate(files[0])
    }
  }, [documentType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploadStatus !== 'idle',
  })

  const toggleSelect = (i: number) => {
    const next = new Set(selectedIds)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelectedIds(next)
  }

  const updateTx = (i: number, field: string, value: any) => {
    setTransactions(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  const allCategories = categories.flatMap(c => [c, ...(c.subcategories || [])])

  return (
    <div>
      <Header title="Importar PDF" subtitle="Importe extratos bancários e faturas de cartão" />

      <div className="page-content space-y-6">
        {uploadStatus === 'idle' && (
          <Card>
            <CardHeader><CardTitle>Selecionar Arquivo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Tipo de documento"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                options={[
                  { value: 'credit_card', label: 'Fatura de Cartão de Crédito' },
                  { value: 'bank_statement', label: 'Extrato Bancário' },
                ]}
              />
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-gray-300'}`} />
                <p className="text-gray-700 font-medium">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Apenas arquivos .PDF</p>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadStatus === 'uploading' && (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Processando com IA...</p>
                <p className="text-sm text-gray-500 mt-1">Claude está extraindo e categorizando as transações</p>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadStatus === 'review' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revisar Transações ({transactions.length} encontradas)</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set(transactions.map((_, i) => i)))}
                  >
                    Selecionar todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Desmarcar todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {transactions.map((t, i) => (
                  <div key={i} className={`flex items-center gap-4 px-6 py-3 transition-colors ${selectedIds.has(i) ? '' : 'opacity-40'}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(i)}
                      onChange={() => toggleSelect(i)}
                      className="rounded border-gray-300 text-primary w-4 h-4"
                    />
                    <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                      <input
                        type="date"
                        value={t.date}
                        onChange={(e) => updateTx(i, 'date', e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={t.description}
                        onChange={(e) => updateTx(i, 'description', e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 col-span-1"
                      />
                      <select
                        value={t.category_id || ''}
                        onChange={(e) => updateTx(i, 'category_id', e.target.value ? parseInt(e.target.value) : null)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        <option value="">Sem categoria</option>
                        {allCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                        </span>
                        <select
                          value={t.type}
                          onChange={(e) => updateTx(i, 'type', e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1 py-1"
                        >
                          <option value="expense">Despesa</option>
                          <option value="income">Receita</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-sm text-gray-500">{selectedIds.size} de {transactions.length} selecionadas</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setUploadStatus('idle'); setTransactions([]) }}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => confirmMutation.mutate()}
                    loading={confirmMutation.isPending}
                    disabled={selectedIds.size === 0}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Importar {selectedIds.size} transações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadStatus === 'done' && (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-lg">Importação concluída!</p>
                <p className="text-sm text-gray-500 mt-1">As transações foram adicionadas com sucesso</p>
              </div>
              <Button onClick={() => { setUploadStatus('idle'); setTransactions([]) }}>
                Importar outro arquivo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
