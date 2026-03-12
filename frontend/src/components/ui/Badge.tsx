import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'income' | 'expense' | 'warning' | 'info'
  size?: 'sm' | 'md'
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-blue-100 text-blue-700',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

export function TransactionTypeBadge({ type }: { type: string }) {
  if (type === 'income') return <Badge variant="income">Receita</Badge>
  if (type === 'expense') return <Badge variant="expense">Despesa</Badge>
  return <Badge variant="info">Transferência</Badge>
}
