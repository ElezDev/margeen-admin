import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardData } from '../types/api'
import { formatMoney, formatMoneyCompact, formatShortDate, parseMoney } from '../lib/format'
import { Card, EmptyState } from './ui'

const COLORS = {
  sales: '#0269e4',
  profit: '#16a34a',
  cost: '#94a3b8',
  clients: '#0289d4',
  products: '#6366f1',
}

interface DashboardChartsProps {
  data: DashboardData
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      {label && <p className="mb-1 font-medium text-slate-700">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-slate-600">
          {entry.name}: {formatMoney(entry.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

function truncateLabel(value: string, max = 22): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const salesSeries = data.sales_by_day.map((day) => ({
    date: formatShortDate(day.date),
    ventas: parseMoney(day.total_sales),
    ganancia: parseMoney(day.total_profit),
    facturas: day.invoice_count,
  }))

  const clientSeries = data.top_clients.map((client) => ({
    name: truncateLabel(client.client_name || 'Cliente'),
    ventas: parseMoney(client.total_sales),
  }))

  const productSeries = data.top_products.map((product) => ({
    name: truncateLabel(product.description),
    ventas: parseMoney(product.total_sales),
    ganancia: parseMoney(product.total_profit),
  }))

  const totalSales = parseMoney(data.summary.total_sales)
  const totalProfit = parseMoney(data.summary.total_profit)
  const totalCost = Math.max(totalSales - totalProfit, 0)

  const summaryPie = [
    { name: 'Ganancia', value: totalProfit },
    { name: 'Costo', value: totalCost },
  ].filter((item) => item.value > 0)

  const hasDailyData = salesSeries.some((day) => day.ventas > 0 || day.ganancia > 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Ventas y ganancia por día</h2>
              <p className="text-sm text-slate-500">
                {data.summary.invoice_count} facturas · {formatMoney(data.summary.total_sales)} en ventas ·{' '}
                {formatMoney(data.summary.total_profit)} de ganancia ({data.summary.profit_margin_percent}% margen)
              </p>
            </div>
          </div>

          {!hasDailyData ? (
            <EmptyState message="Sin ventas en este periodo." />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesSeries} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => formatMoneyCompact(value)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="ventas" name="Ventas" fill={COLORS.sales} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line
                    type="monotone"
                    dataKey="ganancia"
                    name="Ganancia"
                    stroke={COLORS.profit}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold">Composición de ventas</h2>
          <p className="mb-4 text-sm text-slate-500">Ganancia vs costo en el periodo</p>

          {summaryPie.length === 0 ? (
            <EmptyState message="Sin datos para el gráfico." />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summaryPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    <Cell fill={COLORS.profit} />
                    <Cell fill={COLORS.cost} />
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top clientes</h2>
          {clientSeries.length === 0 ? (
            <EmptyState message="Sin ventas por cliente." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientSeries} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => formatMoneyCompact(value)}
                  />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ventas" name="Ventas" fill={COLORS.clients} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top productos</h2>
          {productSeries.length === 0 ? (
            <EmptyState message="Sin productos vendidos." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productSeries} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => formatMoneyCompact(value)}
                  />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ventas" name="Ventas" fill={COLORS.products} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
