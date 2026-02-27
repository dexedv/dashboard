import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Phone, Cake, Hash } from 'lucide-react';
import { formatDate } from '@/lib/utils';
export default function EmployeeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.getUsers(),
    });
    const user = usersResponse?.data.find(u => u.id === id);
    if (isLoading) {
        return _jsx("div", { className: "p-8", children: "Laden..." });
    }
    if (!user) {
        return (_jsxs("div", { className: "p-8", children: [_jsx("p", { children: "Mitarbeiter nicht gefunden" }), _jsx("button", { onClick: () => navigate('/app/employees'), className: "text-blue-500 hover:underline", children: "Zur\u00FCck zur Mitarbeiterliste" })] }));
    }
    const roleColors = {
        ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        USER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return (_jsxs("div", { className: "p-8 max-w-2xl mx-auto", children: [_jsxs("button", { onClick: () => navigate('/app/employees'), className: "flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Zur\u00FCck zur Mitarbeiterliste"] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx(User, { className: "h-6 w-6" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xl", children: user.name }), _jsx("span", { className: `text-sm px-2 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100'}`, children: user.role === 'ADMIN' ? 'Administrator' : 'Mitarbeiter' })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Mail, { className: "h-5 w-5 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "E-Mail" }), _jsx("p", { children: user.email })] })] }), user.phone && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Phone, { className: "h-5 w-5 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Telefon" }), _jsx("p", { children: user.phone })] })] })), user.birthday && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Cake, { className: "h-5 w-5 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Geburtstag" }), _jsx("p", { children: formatDate(user.birthday) })] })] })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Hash, { className: "h-5 w-5 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Mitarbeiternummer" }), _jsx("p", { children: user.employeeNumber })] })] }), _jsxs("div", { className: "pt-4 border-t", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Erstellt am: ", user.createdAt ? formatDate(user.createdAt) : '-'] }), _jsxs("p", { className: `text-sm ${user.active ? 'text-green-600' : 'text-red-600'}`, children: ["Status: ", user.active ? 'Aktiv' : 'Inaktiv'] })] })] })] })] }));
}
