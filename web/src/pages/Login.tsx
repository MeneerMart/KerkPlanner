import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Registration endpoint
        await api.post('/auth/register', { firstName, lastName, password });
        // Automatically switch to login after registering
        setIsRegister(false);
        setError('Registratie gelukt! Je kunt nu inloggen.');
      } else {
        // Login endpoint
        const response = await api.post('/auth/login', { firstName, lastName, password });
        const { token } = response.data;
        setToken(token);
        navigate('/');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        (isRegister ? 'Registratie mislukt. Controleer je gegevens.' : 'Inloggen mislukt. Ongeldige inloggegevens.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">KerkPlanner</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister ? 'Meld je aan als vrijwilliger' : 'Log in op je account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Voornaam</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              placeholder="bijv. Jan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Achternaam</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              placeholder="bijv. Jansen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Wachtwoord</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Account Aanmaken
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Inloggen
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            {isRegister
              ? 'Heb je al een account? Log hier in'
              : 'Nog geen account? Registreer als vrijwilliger'}
          </button>
        </div>
      </div>
    </div>
  );
}