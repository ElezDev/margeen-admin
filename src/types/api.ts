export interface Company {
  id: number
  name: string
  document: string | null
  phone: string | null
  address: string | null
  logo_path?: string | null
  logo_url?: string | null
  notes?: string | null
  is_active?: boolean
  invoice_prefix: string
  next_invoice_number: number
  default_margin_percent: string
  users_count?: number
  clients_count?: number
  products_count?: number
  invoices_count?: number
  created_at?: string | null
  updated_at?: string | null
}

export interface User {
  id: number
  company_id: number
  name: string
  email: string
  document: string | null
  phone: string | null
  address: string | null
  notes: string | null
  roles: string[]
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
  company?: Company
}

export interface Client {
  id: number
  name: string
  document: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

export interface Product {
  id: number
  name: string
  unit_id: number
  unit: string
  cost_price: string
  sale_price: string
  is_active: boolean
}

export interface MeasurementUnit {
  id: number
  name: string
  sort_order: number
  is_active: boolean
}

export interface InvoiceItem {
  id?: number
  product_id?: number | null
  description: string
  quantity: string
  unit: string
  unit_price: string
  unit_cost: string
  line_total: string
  line_profit: string
}

export interface Invoice {
  id: number
  number: string
  status: 'issued' | 'cancelled' | 'draft'
  subtotal: string
  discount: string
  total: string
  total_cost: string
  total_profit: string
  profit_margin_percent: number
  notes: string | null
  pdf_url: string | null
  issued_at: string | null
  created_at: string | null
  client?: Client
  seller?: { id: number; name: string }
  items?: InvoiceItem[]
}

export interface DashboardData {
  period: { from: string; to: string }
  summary: {
    invoice_count: number
    total_sales: string
    total_profit: string
    profit_margin_percent: number
  }
  top_clients: Array<{
    client_id: number
    client_name: string | null
    total_sales: string
    invoice_count: number
  }>
  top_products: Array<{
    product_id: number | null
    description: string
    total_quantity: string
    total_sales: string
    total_profit: string
  }>
  sales_by_day: Array<{
    date: string
    invoice_count: number
    total_sales: string
    total_profit: string
  }>
  recent_invoices: Array<{
    id: number
    number: string
    client_name: string | null
    total: string
    total_profit: string
    issued_at: string | null
  }>
}

export interface PaginatedMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: PaginatedMeta
  links?: Record<string, string | null>
}

export interface ApiResponse<T> {
  message?: string
  data: T
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface InvoiceItemInput {
  product_id?: number
  description?: string
  quantity: number
  unit?: string
  unit_price?: number
  unit_cost?: number
}

export interface Permission {
  id: number
  name: string
  guard_name: string
}

export interface Role {
  id: number
  name: string
  guard_name: string
  is_system: boolean
  permissions: string[]
}
