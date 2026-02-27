import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, User, Mail, Shield, Trash2, Pencil } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        name: '',
        role: 'USER',
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
    });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.getUsers(),
    });
    const users = usersResponse?.data || [];
    const createMutation = useMutation({
        mutationFn: (data) => api.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateOpen(false);
            setNewUser({ email: '', password: '', name: '', role: 'USER' });
            toast({ title: 'Benutzer erstellt' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUser(null);
            toast({ title: 'Benutzer aktualisiert' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Aktualisieren' });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Benutzer gelöscht' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Löschen' });
        },
    });
    const handleCreate = (e) => {
        e.preventDefault();
        createMutation.mutate(newUser);
    };
    const handleEdit = (e) => {
        e.preventDefault();
        if (editingUser) {
            updateMutation.mutate({
                id: editingUser.id,
                data: {
                    name: editForm.name,
                    email: editForm.email,
                },
            });
        }
    };
    const openEditDialog = (user) => {
        setEditingUser(user);
        setEditForm({ name: user.name, email: user.email });
    };
    if (currentUser?.role !== 'ADMIN') {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Zugriff verweigert" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Sie m\u00FCssen Admin sein, um diese Seite anzuzeigen." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Benutzerverwaltung" }), _jsxs(Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Benutzer hinzuf\u00FCgen"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Benutzer erstellen" }) }), _jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name *" }), _jsx(Input, { value: newUser.name, onChange: (e) => setNewUser({ ...newUser, name: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "E-Mail *" }), _jsx(Input, { type: "email", value: newUser.email, onChange: (e) => setNewUser({ ...newUser, email: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Passwort * (min. 10 Zeichen)" }), _jsx(Input, { type: "password", value: newUser.password, onChange: (e) => setNewUser({ ...newUser, password: e.target.value }), minLength: 10, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Rolle" }), _jsxs(Select, { value: newUser.role, onValueChange: (value) => setNewUser({ ...newUser, role: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "GUEST", children: "Gast" }), _jsx(SelectItem, { value: "USER", children: "Benutzer" }), _jsx(SelectItem, { value: "MANAGER", children: "Manager" }), _jsx(SelectItem, { value: "ADMIN", children: "Administrator" })] })] })] }), _jsx(Button, { type: "submit", className: "w-full", children: "Benutzer erstellen" })] })] })] })] }), isLoading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." })) : users.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [_jsx(User, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Keine Benutzer gefunden" })] })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: users.map((user) => (_jsxs(Card, { className: cn(!user.active && 'opacity-60'), children: [_jsxs(CardHeader, { className: "flex flex-row items-start justify-between space-y-0 pb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CardTitle, { className: "text-lg", children: user.name }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => openEditDialog(user), children: _jsx(Pencil, { className: "h-4 w-4" }) })] }), user.role === 'ADMIN' && (_jsx(Shield, { className: "h-5 w-5 text-primary" }))] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Mail, { className: "h-4 w-4" }), _jsx("span", { className: "truncate", children: user.email })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: cn('px-2 py-1 rounded text-xs font-medium', user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                                        user.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'GUEST' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-blue-100 text-blue-800'), children: user.role === 'ADMIN' ? 'Administrator' :
                                                        user.role === 'MANAGER' ? 'Manager' :
                                                            user.role === 'GUEST' ? 'Gast' : 'Benutzer' }), _jsx("span", { className: cn('px-2 py-1 rounded text-xs font-medium', user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'), children: user.active ? 'Aktiv' : 'Inaktiv' })] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Erstellt am ", formatDate(user.createdAt)] })] }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsxs(Select, { value: user.role, onValueChange: (value) => {
                                                updateMutation.mutate({ id: user.id, data: { role: value } });
                                            }, disabled: user.id === currentUser?.id, children: [_jsx(SelectTrigger, { className: "flex-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "GUEST", children: "Gast" }), _jsx(SelectItem, { value: "USER", children: "Benutzer" }), _jsx(SelectItem, { value: "MANAGER", children: "Manager" }), _jsx(SelectItem, { value: "ADMIN", children: "Administrator" })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                updateMutation.mutate({ id: user.id, data: { active: !user.active } });
                                            }, disabled: user.id === currentUser?.id, children: user.active ? 'Deaktivieren' : 'Aktivieren' }), _jsx(Button, { variant: "destructive", size: "sm", onClick: () => {
                                                if (confirm(`Möchten Sie ${user.name} wirklich löschen?`)) {
                                                    deleteMutation.mutate(user.id);
                                                }
                                            }, disabled: user.id === currentUser?.id, title: user.id === currentUser?.id ? 'Sie können sich selbst nicht löschen' : 'Löschen', children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] })] }, user.id))) })), _jsx(Dialog, { open: !!editingUser, onOpenChange: (open) => !open && setEditingUser(null), children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Benutzer bearbeiten" }) }), _jsxs("form", { onSubmit: handleEdit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: editForm.name, onChange: (e) => setEditForm({ ...editForm, name: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "E-Mail" }), _jsx(Input, { type: "email", value: editForm.email, onChange: (e) => setEditForm({ ...editForm, email: e.target.value }), required: true })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "submit", className: "flex-1", children: "Speichern" }), _jsx(Button, { type: "button", variant: "outline", onClick: () => setEditingUser(null), children: "Abbrechen" })] })] })] }) })] }));
}
