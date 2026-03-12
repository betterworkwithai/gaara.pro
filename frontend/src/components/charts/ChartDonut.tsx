import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatBRL } from '../../lib/formatters'
import { CHART_COLORS } from '../../lib/constants'

interface DataItem {
  name: string
  amount: number
  color?: string
  icon?: string
}

interface ChartDonutProps {
  data: DataItem[]
  title?: string
  height?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900">{d.icon} {d.name}</p>
        <p className="text-primary font-bold">{formatBRL(d.amount)}</p>
        <p className="text-gray-500 text-xs">{d.percent?.toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

export function ChartDonut({ data, title, height = 280 }: ChartDonutProps) {
  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0)

  const dataWithPercent = data.map((item, i) => ({
    ...item,
    percent: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    fill: item.color || CHART_COLORS[i % CHART_COLORS.length],
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dataWithPercent}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="amount"
          >
            {dataWithPercent.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
