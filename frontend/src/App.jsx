import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AlertsPage from "./pages/AlertsPage"
import AlertDetailPage from "./pages/AlertDetailPage"
import UsersPage from "./pages/UsersPage"
import ProtectedRoute from "./auth/ProtectedRoute"
import AdminRoute from "./auth/AdminRoute"

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
      <Route
        path="/alerts/:id"
        element={
          <ProtectedRoute>
            <AlertDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/alerts" replace />} />
    </Routes>
  )
}

export default App