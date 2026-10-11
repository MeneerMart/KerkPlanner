import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
// Import your page components (create these next)
import { Login } from './pages/Login';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  const { token, role } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={
          !token ? <Navigate to="/login" /> : 
          role === 'Admin' ? <Navigate to="/admin" /> : <Navigate to="/volunteer" />
        } />

        <Route path="/volunteer/*" element={
          token && role === 'Volunteer' ? <VolunteerDashboard /> : <Navigate to="/login" />
        } />

        <Route path="/admin/*" element={
          token && role === 'Admin' ? <AdminDashboard /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}