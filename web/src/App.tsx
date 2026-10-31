import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import Jobs from './admin/Jobs'
import Login from './admin/Login'
import Overview from './admin/Overview'
import Payments from './admin/Payments'
import SettingsPage from './admin/SettingsPage'
import FleetDetail from './admin/FleetDetail'
import MechanicDetail from './admin/MechanicDetail'
import { FleetsPage, MechanicsPage } from './admin/Users'
import { SettingsProvider } from './lib/settings'
import Home from './marketing/Home'

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="fleets" element={<FleetsPage />} />
            <Route path="mechanics" element={<MechanicsPage />} />
            <Route path="mechanics/:id" element={<MechanicDetail />} />
            <Route path="fleets/:id" element={<FleetDetail />} />
            <Route path="drivers" element={<Navigate to="/admin/fleets" replace />} />
            <Route path="payments" element={<Payments />} />
            <Route path="subscriptions" element={<Navigate to="/admin/payments?tab=subs" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  )
}
