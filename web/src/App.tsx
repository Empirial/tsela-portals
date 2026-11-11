import { withSentryReactRouterV7Routing } from '@sentry/react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import Jobs from './admin/Jobs'
import Login from './admin/Login'
import Overview from './admin/Overview'
import Payments from './admin/Payments'
import SettingsPage from './admin/SettingsPage'
import Surveys from './admin/Surveys'
import FleetDetail from './admin/FleetDetail'
import MechanicDetail from './admin/MechanicDetail'
import { FleetsPage, MechanicsPage } from './admin/Users'
import { LiveDataProvider } from './lib/live'
import { SettingsProvider } from './lib/settings'
import Download from './marketing/Download'
import Home from './marketing/Home'
import SurveyPage, { SurveyIndex } from './marketing/Survey'

const SentryRoutes = withSentryReactRouterV7Routing(Routes)

export default function App() {
  return (
    <SettingsProvider>
      <LiveDataProvider>
      <BrowserRouter>
        <SentryRoutes>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<Download />} />
          <Route path="/survey" element={<SurveyIndex />} />
          <Route path="/survey/:slug" element={<SurveyPage />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="fleets" element={<FleetsPage />} />
            <Route path="mechanics" element={<MechanicsPage />} />
            <Route path="mechanics/:id" element={<MechanicDetail />} />
            <Route path="fleets/:id" element={<FleetDetail />} />
            <Route path="drivers" element={<Navigate to="/admin/fleets" replace />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="payments" element={<Payments />} />
            <Route path="subscriptions" element={<Navigate to="/admin/payments?tab=subs" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </SentryRoutes>
      </BrowserRouter>
      </LiveDataProvider>
    </SettingsProvider>
  )
}
