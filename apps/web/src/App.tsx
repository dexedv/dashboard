import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import LoginPage from './pages/LoginPage';
import AppLayout from './layout/AppLayout';
import HomePage from './pages/HomePage';
import NotesPage from './pages/NotesPage';
import CalendarPage from './pages/CalendarPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import OrderDetailPage from './pages/OrderDetailPage';
import FilesPage from './pages/FilesPage';
import SpotifyPage from './pages/SpotifyPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminPermissionsPage from './pages/AdminPermissionsPage';
import AdminLicensesPage from './pages/AdminLicensesPage';
import EmailPage from './pages/EmailPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import WhatsAppPage from './pages/WhatsAppPage';
import SetupWizard from './pages/SetupWizard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  // Check if setup is complete
  const setupComplete = typeof window !== 'undefined' && localStorage.getItem('setupComplete');

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupWizard />} />
        {!setupComplete && <Route path="*" element={<Navigate to="/setup" replace />} />}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="email" element={<EmailPage />} />
          <Route path="spotify" element={<SpotifyPage />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/permissions" element={<AdminPermissionsPage />} />
          <Route path="admin/licenses" element={<AdminLicensesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
