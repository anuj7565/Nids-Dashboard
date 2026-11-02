import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AlertsPage from "./pages/AlertsPage"
import ProtectedRoute from "./auth/ProtectedRoute"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/alerts" replace />} />
    </Routes>
  )
}

export default App