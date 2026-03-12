import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>{children}</div>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-base font-semibold text-gray-900 ${className}`}>{children}</h3>
}

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; positive: boolean }
  color?: 'primary' | 'secondary' | 'green' | 'red' | 'default'
}

const colorMap = {
  primary: 'bg-primary-50 text-primary',
  secondary: 'bg-secondary-50 text-secondary',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  default: 'bg-gray-50 text-gray-600',
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                <span>{trend.positive ? '▲' : '▼'}</span>
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
