import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { ProtectedRoute } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { HomeRedirect } from './pages/HomeRedirect'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsPage } from './pages/ClientsPage'
import { ProductsPage } from './pages/ProductsPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { InvoiceCreatePage } from './pages/InvoiceCreatePage'
import { InvoiceDetailPage } from './pages/InvoiceDetailPage'
import { UsersPage } from './pages/UsersPage'
import { PlatformCompaniesPage } from './pages/PlatformCompaniesPage'
import { PlatformRolesPage } from './pages/PlatformRolesPage'

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="platform/companies" element={<PlatformCompaniesPage />} />
            <Route path="platform/roles" element={<PlatformRolesPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/new" element={<InvoiceCreatePage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  )
}
