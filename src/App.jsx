import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CheckIn from './pages/CheckIn';
import Logs from './pages/Logs';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="register" element={<Register />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
