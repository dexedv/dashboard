import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
import EmailPage from './pages/EmailPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function App() {
    return (_jsxs(AuthProvider, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/app", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(HomePage, {}) }), _jsx(Route, { path: "notes", element: _jsx(NotesPage, {}) }), _jsx(Route, { path: "calendar", element: _jsx(CalendarPage, {}) }), _jsx(Route, { path: "customers", element: _jsx(CustomersPage, {}) }), _jsx(Route, { path: "customers/:id", element: _jsx(CustomerDetailPage, {}) }), _jsx(Route, { path: "orders/:id", element: _jsx(OrderDetailPage, {}) }), _jsx(Route, { path: "files", element: _jsx(FilesPage, {}) }), _jsx(Route, { path: "email", element: _jsx(EmailPage, {}) }), _jsx(Route, { path: "spotify", element: _jsx(SpotifyPage, {}) }), _jsx(Route, { path: "employees", element: _jsx(EmployeesPage, {}) }), _jsx(Route, { path: "employees/:id", element: _jsx(EmployeeDetailPage, {}) }), _jsx(Route, { path: "admin/users", element: _jsx(AdminUsersPage, {}) }), _jsx(Route, { path: "admin/permissions", element: _jsx(AdminPermissionsPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/app", replace: true }) })] }), _jsx(Toaster, {})] }));
}
export default App;
