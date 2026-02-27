import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, User, Mail, Phone, ArrowRight } from 'lucide-react';
export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: customersResponse, isLoading } = useQuery({
        queryKey: ['customers', search],
        queryFn: () => api.getCustomers({ q: search || undefined }),
    });
    const customers = customersResponse?.data || [];
    const createMutation = useMutation({
        mutationFn: (data) => api.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsCreateOpen(false);
            setNewCustomer({ name: '', email: '', phone: '', address: '', notes: '' });
            toast({ title: 'Kunde erstellt' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({ title: 'Kunde gelöscht' });
        },
    });
    const handleCreate = (e) => {
        e.preventDefault();
        createMutation.mutate({
            name: newCustomer.name,
            email: newCustomer.email || undefined,
            phone: newCustomer.phone || undefined,
            address: newCustomer.address || undefined,
            notes: newCustomer.notes || undefined,
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Kunden" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Verwalten Sie Ihre Kunden und Auftr\u00E4ge" })] }), _jsxs(Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "shadow-lg shadow-primary/25", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Kunde hinzuf\u00FCgen"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Kunde erstellen" }) }), _jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name *" }), _jsx(Input, { value: newCustomer.name, onChange: (e) => setNewCustomer({ ...newCustomer, name: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "E-Mail" }), _jsx(Input, { type: "email", value: newCustomer.email, onChange: (e) => setNewCustomer({ ...newCustomer, email: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Telefon" }), _jsx(Input, { value: newCustomer.phone, onChange: (e) => setNewCustomer({ ...newCustomer, phone: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Adresse" }), _jsx(Input, { value: newCustomer.address, onChange: (e) => setNewCustomer({ ...newCustomer, address: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Notizen" }), _jsx("textarea", { className: "w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/50 transition-all", value: newCustomer.notes, onChange: (e) => setNewCustomer({ ...newCustomer, notes: e.target.value }) })] }), _jsx(Button, { type: "submit", className: "w-full", children: "Erstellen" })] })] })] })] }), _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Kunden suchen...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })] }), isLoading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." })) : customers.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [_jsx(User, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Noch keine Kunden" })] })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: customers.map((customer) => (_jsxs(Card, { className: "card-hover", children: [_jsxs(CardHeader, { className: "flex flex-row items-start justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-lg font-semibold", children: _jsx(Link, { to: `/app/customers/${customer.id}`, className: "hover:text-primary transition-colors", children: customer.name }) }), _jsx(Link, { to: `/app/customers/${customer.id}`, className: "p-1 rounded-lg hover:bg-primary/10 transition-colors", children: _jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" }) })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2 text-sm", children: [customer.email && (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Mail, { className: "h-4 w-4" }), _jsx("span", { className: "truncate", children: customer.email })] })), customer.phone && (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Phone, { className: "h-4 w-4" }), _jsx("span", { children: customer.phone })] })), _jsxs("div", { className: "pt-2 text-xs text-muted-foreground", children: [customer.ordersCount, " Auftrag", customer.ordersCount !== 1 ? 'e' : ''] })] }) })] }, customer.id))) }))] }));
}
