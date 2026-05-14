import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services/supabaseClient.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface-900 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1">
            Drip<span className="text-oil-gold">View</span>
          </h1>
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
            Fleet — Rebocadores Portuários
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">
              E-mail do operador
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-oil-gold transition-colors"
              placeholder="operador@empresa.com.br"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-oil-gold transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-oil-gold hover:bg-oil-amber active:scale-[0.98] transition-all font-bold text-surface-900 text-base disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center mt-8">
          Acesso restrito a operadores cadastrados.
          <br />Contate o supervisor para obter credenciais.
        </p>
      </div>
    </div>
  )
}
