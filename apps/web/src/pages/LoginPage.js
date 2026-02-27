import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const { login, register, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isRegisterMode) {
                await register(email, password, name);
                toast({ title: 'Konto erstellt! Willkommen im Dashboard.' });
            }
            else {
                await login(email, password);
            }
            navigate('/app');
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: isRegisterMode ? 'Registrierung fehlgeschlagen' : 'Anmeldung fehlgeschlagen',
                description: error instanceof Error ? error.message : 'Ungültige Anmeldedaten',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" }), _jsx("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" }), _jsx("div", { className: "absolute -bottom-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent rotate-12" }), _jsxs("div", { className: "relative z-10 w-full max-w-md p-4", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/25 mb-4", children: _jsx("svg", { className: "h-8 w-8 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" }) }) }), _jsx("h1", { className: "text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text", children: "Dashboard Suite" }), _jsx("p", { className: "text-muted-foreground mt-2", children: isRegisterMode ? 'Erstellen Sie ein neues Konto' : 'Willkommen zurück' })] }), _jsx(Card, { className: "shadow-2xl shadow-black/5 border-border/50 bg-card/80 backdrop-blur-xl", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [isRegisterMode && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", type: "text", placeholder: "Ihr Name", value: name, onChange: (e) => setName(e.target.value), required: isRegisterMode, className: "h-11" })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "E-Mail" }), _jsx(Input, { id: "email", type: "email", placeholder: "name@beispiel.de", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "h-11" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Passwort" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: isRegisterMode ? 10 : 1, className: "h-11" }), isRegisterMode && (_jsx("p", { className: "text-xs text-muted-foreground", children: "Mindestens 10 Zeichen" }))] }), _jsx(Button, { type: "submit", className: "w-full h-11 text-base", disabled: isLoading, children: isLoading
                                                ? (isRegisterMode ? 'Konto wird erstellt...' : 'Anmelden...')
                                                : (isRegisterMode ? 'Konto erstellen' : 'Anmelden') })] }), _jsx("div", { className: "mt-6 text-center", children: _jsx(Button, { variant: "link", onClick: () => setIsRegisterMode(!isRegisterMode), className: "text-sm text-muted-foreground hover:text-primary", children: isRegisterMode
                                            ? 'Bereits ein Konto? Anmelden'
                                            : 'Noch kein Konto? Registrieren' }) }), !isRegisterMode && (_jsx("div", { className: "mt-4 p-3 rounded-lg bg-muted/50 text-center text-sm", children: _jsxs("p", { className: "text-muted-foreground", children: [_jsx("span", { className: "font-medium", children: "Admin:" }), " admin@dashboard.local"] }) }))] }) })] })] }));
}
