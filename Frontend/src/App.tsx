import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MijnInschrijvingen from './pages/MijnInschrijvingen';
import AdminPaneel from './pages/AdminPaneel';
import { ConfirmDialog } from './components/ui/confirm-dialog';
import { Toaster } from 'sonner';

function Navbar() {
  const { token, role, firstName, logout } = useAppStore();
  const location = useLocation();
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  const navClass = (path: string) => `whitespace-nowrap text-sm font-medium transition-colors ${location.pathname === path ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`;

  return (
    <>
      <header className="sticky top-0 z-50 isolate border-b bg-white px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-sm [transform:translateZ(0)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-800">Kerk<span className="text-blue-600">Planner</span></Link>

        <nav aria-label="Hoofdnavigatie" className="order-3 flex w-full items-center gap-4 overflow-x-auto border-t pt-3 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
          <Link to="/" className={navClass('/')}>Home</Link>
          <Link to="/inschrijvingen" className={navClass('/inschrijvingen')}>Inschrijvingen</Link>
          {role === 'Admin' && <Link to="/admin" className={navClass('/admin')}>Beheerders paneel</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {firstName && <span className="hidden text-sm font-medium text-slate-700 md:inline-block">Hallo, {firstName}</span>}
          {token ? (
            <button onClick={() => setLogoutConfirmation(true)} className="whitespace-nowrap text-sm font-medium text-red-600 hover:underline">Uitloggen</button>
          ) : (
            <Link to="/login" className="whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">Inloggen</Link>
          )}
        </div>
      </div>
      </header>
      <ConfirmDialog
        open={logoutConfirmation}
        onOpenChange={setLogoutConfirmation}
        title="Uitloggen?"
        description="Weet je zeker dat je wilt uitloggen bij KerkPlanner?"
        confirmLabel="Uitloggen"
        destructive
        onConfirm={logout}
      />
    </>
  );
}

export default function App() {
  const role = useAppStore((state) => state.role);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-5xl p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inschrijvingen" element={<MijnInschrijvingen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={role === 'Admin' ? <AdminPaneel /> : <Navigate to="/" />} />
          </Routes>
        </main>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </Router>
  );
}
