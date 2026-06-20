import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/format'
import { Logo } from '../components/Logo'
import { Alert, Button, Card, Input, LoadingScreen } from '../components/ui'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from || '/'

  if (isLoading) return <LoadingScreen />

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-slate-500">
            Ingresa con tu cuenta de administrador
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <Alert>{error}</Alert>}

          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" loading={submitting}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo admin: admin@demo.com / password<br />
          Super admin: superadmin@margeen.com / password
        </p>
      </Card>
    </div>
  )
}
