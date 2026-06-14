import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { EditModeProvider } from "./context/EditModeContext"
import { TutorialProvider } from "./context/TutorialContext"
import { ProtectedLayout } from "./components/ProtectedLayout"
import { ActivationGuard } from "./components/ActivationGuard"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Activation from "./pages/Activation"
import Dashboard from "./pages/Dashboard"
import PersonalInfo from "./pages/PersonalInfo"
import AccountManagement from "./pages/AccountManagement"
import ResourceManagement from "./pages/ResourceManagement"
import DataStatistics from "./pages/DataStatistics"
import OperationLogs from "./pages/OperationLogs"
import BugTracker from "./pages/BugTracker"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EditModeProvider>
          <TutorialProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Activation (requires auth but no sidebar) */}
              <Route path="/activation" element={<ActivationGuard />} />

              {/* Protected Routes (with sidebar) */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<PersonalInfo />} />
                <Route path="management" element={<AccountManagement />} />
                <Route path="resources" element={<ResourceManagement />} />
                <Route path="statistics" element={<DataStatistics />} />
                <Route path="logs" element={<OperationLogs />} />
                <Route path="bugs" element={<BugTracker />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </TutorialProvider>
        </EditModeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
