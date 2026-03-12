export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface Category {
  id: number
  user_id: number
  name: string
  type: 'income' | 'expense' | 'investment' | 'debt'
  color: string
  icon: string
  is_default: boolean
  parent_id: number | null
  keywords: { id: number; keyword: string }[]
  subcategories: Category[]
}

export interface Transaction {
  id: number
  user_id: number
  amount: number
  type: 'income' | 'expense' | 'transfer'
  description: string
  date: string
  source: string
  notes: string | null
  category_id: number | null
  goal_id: number | null
  document_id: number | null
  is_recurring: boolean
  recurrence_interval: string | null
  recurrence_end_date: string | null
  category: { id: number; name: string; color: string; icon: string; type: string } | null
  created_at: string
}

export interface Investment {
  id: number
  user_id: number
  name: string
  type: 'acao' | 'fii' | 'renda_fixa' | 'crypto' | 'outro'
  amount_invested: number
  current_value: number
  date: string
  notes: string | null
  created_at: string
}

export interface Debt {
  id: number
  user_id: number
  name: string
  total_amount: number
  remaining_amount: number
  interest_rate: number
  monthly_payment: number
  due_date: string | null
  is_paid: boolean
  notes: string | null
  created_at: string
}

export interface Budget {
  id: number
  user_id: number
  category_id: number
  amount: number
  month: number
  year: number
  created_at: string
  spent: number
  remaining: number
  percentage: number
  category_name: string
  category_color: string
  category_icon: string
}

export interface Goal {
  id: number
  user_id: number
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  color: string
  icon: string
  is_completed: boolean
  created_at: string
  monthly_needed: number | null
  progress_percentage: number
}

export interface Document {
  id: number
  user_id: number
  filename: string
  upload_date: string
  status: 'processing' | 'done' | 'error'
  document_type: 'credit_card' | 'bank_statement'
}

export interface ExtractedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category_id: number | null
  category_name?: string
}

export interface DashboardSummary {
  month: number
  year: number
  summary: {
    income: number
    expenses: number
    net: number
    transaction_count: number
  }
  health_score: {
    score: number
    label: string
    color: string
    breakdown: {
      savings_rate: number
      savings_score: number
      debt_to_income: number
      debt_score: number
      investment_rate: number
      investment_score: number
      budget_score: number
    }
  }
  expenses_by_category: { id: number | null; name: string; color: string; icon: string; amount: number }[]
  recent_transactions: {
    id: number
    description: string
    amount: number
    type: string
    date: string
    category: { name: string; color: string; icon: string }
  }[]
  debts: { total: number; monthly_payment: number; count: number }
  investments: { total_invested: number; current_value: number; gain: number; gain_percentage: number }
  goals: { id: number; name: string; target_amount: number; current_amount: number; progress: number; color: string; icon: string }[]
  subscriptions_monthly: number
}

export interface Projection {
  year: number
  income: number
  expenses: number
  savings: number
  investments: number
  debt: number
  net_worth: number
}

export interface InsightSuggestion {
  titulo: string
  descricao: string
  impacto_estimado: string
  prioridade: 'alta' | 'media' | 'baixa'
}
