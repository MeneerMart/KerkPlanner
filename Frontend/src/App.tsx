import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPaneel from './pages/AdminPaneel';

function Navbar() {
  const { token, role, firstName, logout } = useAppStore();
  const location = useLocation();

  return (
    <header className="bg-white border-b shadow-sm p-4 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-800">Kerk<span className="text-blue-600">Planner</span></Link>
          
          {role === 'Admin' && (
            <nav className="hidden sm:flex gap-4">
              <Link to="/" className={`text-sm font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Home</Link>
              <Link to="/admin" className={`text-sm font-medium ${location.pathname === '/admin' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Werkdagen (Admin)</Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {firstName && <span className="text-sm font-medium hidden sm:inline-block text-slate-700">Hallo, {firstName}</span>}
          
          {token ? (
            <button onClick={() => logout()} className="text-sm text-red-600 font-medium hover:underline">Uitloggen</button>
          ) : (
            <Link to="/login" className="text-sm text-blue-600 font-medium hover:underline">Inloggen</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const role = useAppStore((state) => state.role);
  
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <Navbar />
        <main className="p-4 max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={role === 'Admin' ? <AdminPaneel /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}