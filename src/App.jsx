import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CheckIn from './pages/CheckIn';
import Logs from './pages/Logs';
import Pricing from './pages/Pricing';
import RegisterAdmin from './pages/RegisterAdmin';
import Auth from './pages/Auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Auth onLogin={() => setIsAuthenticated(true)} />
      </ToastProvider>
    );
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="register" element={<Register />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="logs" element={<Logs />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="register-admin" element={<RegisterAdmin />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
