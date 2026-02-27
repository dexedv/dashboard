import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { LayoutDashboard, Home, FileText, Calendar, Users, Folder, Music, Settings, LogOut, Menu, X, Sun, Moon, User, Shield, Mail, } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
const navigation = [
    { name: 'Startseite', href: '/app', icon: Home },
    { name: 'Notizen', href: '/app/notes', icon: FileText },
    { name: 'Kalender', href: '/app/calendar', icon: Calendar },
    { name: 'Kunden', href: '/app/customers', icon: Users },
    { name: 'Mitarbeiter', href: '/app/employees', icon: User },
    { name: 'Dateien', href: '/app/files', icon: Folder },
    { name: 'E-Mail', href: '/app/email', icon: Mail },
    { name: 'Spotify', href: '/app/spotify', icon: Music },
];
export default function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', birthday: '' });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.updateMe(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
            setIsProfileOpen(false);
            toast({ title: 'Profil aktualisiert' });
            // Update local user state
            if (response.data) {
                updateUser(response.data);
            }
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Aktualisieren' });
        },
    });
    const openProfile = () => {
        setProfileData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            birthday: user?.birthday ? user.birthday.split('T')[0] : ''
        });
        setIsProfileOpen(true);
    };
    const handleUpdateProfile = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(profileData);
    };
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-background via-background to-primary/5", children: [_jsxs("div", { className: "lg:hidden", children: [sidebarOpen && (_jsx("div", { className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", onClick: () => setSidebarOpen(false) })), _jsxs("aside", { className: cn('fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-xl border-r shadow-2xl transform transition-transform lg:hidden gradient-mesh', sidebarOpen ? 'translate-x-0' : '-translate-x-full'), children: [_jsxs("div", { className: "flex items-center justify-between p-5 border-b/50", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25", children: _jsx(LayoutDashboard, { className: "h-5 w-5 text-white" }) }), _jsx("span", { className: "text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text", children: "Dashboard" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: toggleTheme, className: "rounded-lg", children: theme === 'dark' ? _jsx(Sun, { className: "h-5 w-5" }) : _jsx(Moon, { className: "h-5 w-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSidebarOpen(false), className: "rounded-lg", children: _jsx(X, { className: "h-5 w-5" }) })] })] }), _jsxs("nav", { className: "p-4 space-y-1.5", children: [navigation.map((item) => (_jsxs(Link, { to: item.href, className: cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', location.pathname === item.href
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'), onClick: () => setSidebarOpen(false), children: [_jsx(item.icon, { className: "h-5 w-5" }), item.name] }, item.name))), user?.role === 'ADMIN' && (_jsxs("div", { className: "pt-4 mt-4 border-t space-y-1.5", children: [_jsxs(Link, { to: "/app/admin/users", className: cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', location.pathname === '/app/admin/users'
                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'), onClick: () => setSidebarOpen(false), children: [_jsx(Settings, { className: "h-5 w-5" }), "Benutzer"] }), _jsxs(Link, { to: "/app/admin/permissions", className: cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', location.pathname === '/app/admin/permissions'
                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'), onClick: () => setSidebarOpen(false), children: [_jsx(Shield, { className: "h-5 w-5" }), "Berechtigungen"] })] }))] })] })] }), _jsxs("aside", { className: "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:border-r lg:bg-card/80 lg:backdrop-blur-xl", children: [_jsxs("div", { className: "flex h-20 items-center gap-3 border-b/50 px-6", children: [_jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25", children: _jsx(LayoutDashboard, { className: "h-6 w-6 text-white" }) }), _jsx("span", { className: "text-xl font-bold", children: "Dashboard" })] }), _jsxs("nav", { className: "flex-1 overflow-y-auto p-4 space-y-1.5", children: [navigation.map((item) => (_jsxs(Link, { to: item.href, className: cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', location.pathname === item.href
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'), children: [_jsx(item.icon, { className: "h-5 w-5" }), item.name] }, item.name))), user?.role === 'ADMIN' && (_jsxs("div", { className: "pt-4 mt-4 border-t space-y-1.5", children: [_jsxs(Link, { to: "/app/admin/users", className: cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', location.pathname === '/app/admin/users'
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'), children: [_jsx(Settings, { className: "h-5 w-5" }), "Benutzer"] }), _jsxs(Link, { to: "/app/admin/permissions", className: cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', location.pathname === '/app/admin/permissions'
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'), children: [_jsx(Shield, { className: "h-5 w-5" }), "Berechtigungen"] })] }))] }), _jsxs("div", { className: "border-t/50 p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-xl bg-muted/30", children: [_jsx("div", { className: "h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg", children: user?.name.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold truncate", children: user?.name }), _jsx("p", { className: "text-xs text-muted-foreground truncate", children: user?.email })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: toggleTheme, className: "rounded-xl", title: "Design wechseln", children: theme === 'dark' ? _jsx(Sun, { className: "h-4 w-4" }) : _jsx(Moon, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", onClick: openProfile, className: "rounded-xl", title: "Profil bearbeiten", children: _jsx(User, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", className: "rounded-xl justify-center", onClick: handleLogout, title: "Abmelden", children: _jsx(LogOut, { className: "h-4 w-4" }) })] })] })] }), _jsxs("div", { className: "lg:pl-72", children: [_jsxs("header", { className: "sticky top-0 z-40 flex h-16 items-center gap-2 border-b/50 bg-background/80 backdrop-blur-xl px-4 lg:hidden", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSidebarOpen(true), className: "rounded-lg", children: _jsx(Menu, { className: "h-5 w-5" }) }), _jsx("span", { className: "font-bold", children: "Dashboard" }), _jsxs("div", { className: "flex gap-1 ml-auto", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: openProfile, className: "rounded-lg", children: _jsx(User, { className: "h-5 w-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: toggleTheme, className: "rounded-lg", children: theme === 'dark' ? _jsx(Sun, { className: "h-5 w-5" }) : _jsx(Moon, { className: "h-5 w-5" }) })] })] }), _jsx("main", { className: "p-4 lg:p-8", children: _jsx("div", { className: "page-enter", children: _jsx(Outlet, {}) }) })] }), _jsx(Dialog, { open: isProfileOpen, onOpenChange: setIsProfileOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Profil bearbeiten" }) }), _jsxs("form", { onSubmit: handleUpdateProfile, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: profileData.name, onChange: (e) => setProfileData({ ...profileData, name: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "E-Mail" }), _jsx(Input, { type: "email", value: profileData.email, onChange: (e) => setProfileData({ ...profileData, email: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Telefon" }), _jsx(Input, { type: "tel", value: profileData.phone, onChange: (e) => setProfileData({ ...profileData, phone: e.target.value }), placeholder: "+49 123 456789" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Geburtstag" }), _jsx(Input, { type: "date", value: profileData.birthday, onChange: (e) => setProfileData({ ...profileData, birthday: e.target.value }) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsProfileOpen(false), className: "flex-1", children: "Abbrechen" }), _jsx(Button, { type: "submit", className: "flex-1", disabled: updateProfileMutation.isPending, children: updateProfileMutation.isPending ? 'Speichern...' : 'Speichern' })] })] })] }) })] }));
}
