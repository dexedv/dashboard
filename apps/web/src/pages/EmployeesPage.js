import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { userRoleColors } from '@dashboard/shared/zod';
import { Mail, Phone, Calendar, Shield, User, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
export default function EmployeesPage() {
    const { user: currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: () => api.getEmployees({ q: search || undefined }),
    });
    const users = usersResponse?.data || [];
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'MANAGER') {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Zugriff verweigert" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Sie m\u00FCssen Manager oder Administrator sein, um diese Seite anzuzeigen." })] }));
    }
    const getRoleInfo = (role) => {
        return userRoleColors[role] || userRoleColors.USER;
    };
    const formatBirthday = (birthday) => {
        if (!birthday)
            return '-';
        try {
            return format(parseISO(birthday), 'd. MMMM yyyy', { locale: de });
        }
        catch {
            return birthday;
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Mitarbeiter" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Verwalten Sie Ihre Teammitglieder" })] }) }), _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Mitarbeiter suchen...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })] }), isLoading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." })) : users.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [_jsx(User, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Keine Mitarbeiter gefunden" })] })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: users.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    return (_jsxs(Card, { className: cn(!user.active && 'opacity-60'), children: [_jsxs(CardHeader, { className: "flex flex-row items-start justify-between space-y-0 pb-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg", children: user.name.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsxs(CardTitle, { className: "text-lg", children: [user.name, _jsxs("span", { className: "ml-2 text-muted-foreground font-normal", children: ["#", user.employeeNumber] })] }), _jsx("span", { className: cn('text-xs px-2 py-1 rounded', roleInfo.bg, roleInfo.text), children: roleInfo.label })] })] }), user.role === 'ADMIN' && (_jsx(Shield, { className: "h-5 w-5 text-primary" }))] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Mail, { className: "h-4 w-4" }), _jsx("span", { className: "truncate", children: user.email })] }), user.phone && (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Phone, { className: "h-4 w-4" }), _jsx("span", { children: user.phone })] })), user.birthday && (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Calendar, { className: "h-4 w-4" }), _jsx("span", { children: formatBirthday(user.birthday) })] })), _jsx("div", { className: "flex items-center gap-2 pt-2", children: _jsx("span", { className: cn('px-2 py-1 rounded text-xs font-medium', user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'), children: user.active ? 'Aktiv' : 'Inaktiv' }) }), _jsxs("p", { className: "text-xs text-muted-foreground pt-2", children: ["Erstellt am ", format(parseISO(user.createdAt), 'd. MMMM yyyy', { locale: de })] })] }) })] }, user.id));
                }) }))] }));
}
