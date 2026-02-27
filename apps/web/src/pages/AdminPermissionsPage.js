import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { User, Shield, ChevronDown, ChevronRight, Save } from 'lucide-react';
const categoryLabels = {
    orders: 'Aufträge',
    customers: 'Kunden',
    employees: 'Mitarbeiter',
    calendar: 'Kalender',
    notes: 'Notizen',
    files: 'Dateien',
    home: 'Startseite',
    spotify: 'Spotify',
    admin: 'Administration',
};
export default function AdminPermissionsPage() {
    const { user: currentUser } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState(new Set());
    const [expandedCategories, setExpandedCategories] = useState(new Set(Object.keys(categoryLabels)));
    const queryClient = useQueryClient();
    const { toast } = useToast();
    // Get all permissions
    const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => api.getPermissions(),
    });
    // Get all users
    const { data: usersResponse, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.getUsers(),
    });
    // Get selected user's permissions
    const { data: userPermissionsResponse, isLoading: userPermsLoading } = useQuery({
        queryKey: ['userPermissions', selectedUserId],
        queryFn: () => selectedUserId ? api.getUserPermissions(selectedUserId) : Promise.resolve({ success: true, data: [] }),
        enabled: !!selectedUserId,
    });
    const permissions = permissionsResponse?.data?.all || [];
    const permissionsGrouped = permissionsResponse?.data?.grouped || {};
    const users = usersResponse?.data || [];
    const userPermissions = userPermissionsResponse?.data || [];
    // Set selected permissions when user permissions load
    useState(() => {
        if (userPermissions.length > 0) {
            setSelectedPermissions(new Set(userPermissions.map((p) => p.name)));
        }
        else {
            setSelectedPermissions(new Set());
        }
    });
    // Update selected permissions when data changes
    if (userPermissionsResponse && selectedUserId) {
        const permSet = new Set(userPermissions.map((p) => p.name));
        if (JSON.stringify([...permSet]) !== JSON.stringify([...selectedPermissions])) {
            setSelectedPermissions(permSet);
        }
    }
    const updatePermissionsMutation = useMutation({
        mutationFn: ({ userId, permissions }) => api.setUserPermissions(userId, permissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userPermissions', selectedUserId] });
            toast({ title: 'Berechtigungen gespeichert' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Speichern' });
        },
    });
    const toggleCategory = (category) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        }
        else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };
    const togglePermission = (permissionName) => {
        const newPerms = new Set(selectedPermissions);
        if (newPerms.has(permissionName)) {
            newPerms.delete(permissionName);
        }
        else {
            newPerms.add(permissionName);
        }
        setSelectedPermissions(newPerms);
    };
    const selectAllInCategory = (category, granted) => {
        const categoryPerms = permissionsGrouped[category] || [];
        const newPerms = new Set(selectedPermissions);
        categoryPerms.forEach((p) => {
            if (granted) {
                newPerms.add(p.name);
            }
            else {
                newPerms.delete(p.name);
            }
        });
        setSelectedPermissions(newPerms);
    };
    const handleSave = () => {
        if (selectedUserId) {
            updatePermissionsMutation.mutate({
                userId: selectedUserId,
                permissions: [...selectedPermissions],
            });
        }
    };
    if (currentUser?.role !== 'ADMIN') {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Zugriff verweigert" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Sie m\u00FCssen Admin sein, um diese Seite anzuzeigen." })] }));
    }
    if (permissionsLoading || usersLoading) {
        return _jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h1", { className: "text-3xl font-bold", children: "Berechtigungen" }) }), _jsxs("div", { className: "grid gap-6 md:grid-cols-[250px_1fr]", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(User, { className: "h-4 w-4" }), "Mitarbeiter"] }) }), _jsx(CardContent, { className: "space-y-2", children: users.map((user) => (_jsxs(Button, { variant: selectedUserId === user.id ? 'default' : 'ghost', className: "w-full justify-start text-left", onClick: () => {
                                        setSelectedUserId(user.id);
                                        // Reset permissions for new user
                                        const userPerms = userPermissionsResponse?.data || [];
                                        setSelectedPermissions(new Set(userPerms.map((p) => p.name)));
                                    }, children: [_jsx("span", { className: "truncate", children: user.name }), user.role === 'ADMIN' && _jsx(Shield, { className: "h-4 w-4 ml-auto" })] }, user.id))) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0", children: [_jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Shield, { className: "h-4 w-4" }), "Berechtigungen", selectedUserId && (_jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: ["- ", users.find((u) => u.id === selectedUserId)?.name] }))] }), selectedUserId && (_jsxs(Button, { size: "sm", onClick: handleSave, disabled: updatePermissionsMutation.isPending, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Speichern"] }))] }), _jsx(CardContent, { children: !selectedUserId ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "W\u00E4hlen Sie einen Mitarbeiter aus, um dessen Berechtigungen zu verwalten." })) : userPermsLoading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." })) : (_jsx("div", { className: "space-y-4", children: Object.entries(categoryLabels).map(([category, label]) => (_jsxs("div", { className: "border rounded-lg overflow-hidden", children: [_jsxs(Button, { variant: "ghost", className: "w-full justify-between font-medium", onClick: () => toggleCategory(category), children: [_jsx("span", { children: label }), expandedCategories.has(category) ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" }))] }), expandedCategories.has(category) && (_jsxs("div", { className: "p-3 bg-muted/30 border-t", children: [_jsxs("div", { className: "flex gap-2 mb-3", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => selectAllInCategory(category, true), children: "Alle" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => selectAllInCategory(category, false), children: "Keine" })] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: (permissionsGrouped[category] || []).map((perm) => (_jsxs("div", { className: "flex items-start gap-2 p-2 rounded hover:bg-muted/50", children: [_jsx(Checkbox, { id: perm.name, checked: selectedPermissions.has(perm.name), onCheckedChange: () => togglePermission(perm.name) }), _jsxs("label", { htmlFor: perm.name, className: "text-sm cursor-pointer flex-1", children: [_jsx("div", { className: "font-medium", children: perm.name.split('.')[1] }), _jsx("div", { className: "text-xs text-muted-foreground", children: perm.description })] })] }, perm.id))) })] }))] }, category))) })) })] })] })] }));
}
