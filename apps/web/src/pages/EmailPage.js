import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Folder, FolderOpen, Settings, PenLine, Paperclip, ChevronRight, RefreshCw, ArrowLeft, User, Users } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
export default function EmailPage() {
    const [currentFolder, setCurrentFolder] = useState('INBOX');
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [isComposing, setIsComposing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: '',
        cc: '',
        bcc: '',
    });
    const [settingsData, setSettingsData] = useState({
        email: '',
        imapHost: 'imap.example.com',
        imapPort: '993',
        imapSecure: true,
        smtpHost: 'smtp.example.com',
        smtpPort: '465',
        smtpSecure: true,
        username: '',
        password: '',
    });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    // Get email account
    const { data: accountResponse, isLoading: accountLoading } = useQuery({
        queryKey: ['email-account'],
        queryFn: () => api.getEmailAccount(),
    });
    const account = accountResponse?.data;
    // Get employees for CC
    const { data: employeesResponse } = useQuery({
        queryKey: ['users-with-email'],
        queryFn: () => api.getUsersWithEmail(),
        enabled: !!account,
    });
    const employees = employeesResponse?.data || [];
    // Get folders
    const { data: foldersResponse, isLoading: foldersLoading, refetch: refetchFolders } = useQuery({
        queryKey: ['email-folders'],
        queryFn: () => api.getEmailFolders(),
        enabled: !!account,
    });
    const folders = foldersResponse?.data || [];
    // Get emails
    const { data: emailsResponse, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
        queryKey: ['emails', currentFolder],
        queryFn: () => api.getEmails(currentFolder),
        enabled: !!account,
    });
    const emails = emailsResponse?.data?.emails || [];
    // Setup email account mutation
    const setupMutation = useMutation({
        mutationFn: () => api.setupEmailAccount({
            email: settingsData.email,
            imapHost: settingsData.imapHost,
            imapPort: parseInt(settingsData.imapPort),
            imapSecure: settingsData.imapSecure,
            smtpHost: settingsData.smtpHost,
            smtpPort: parseInt(settingsData.smtpPort),
            smtpSecure: settingsData.smtpSecure,
            username: settingsData.username,
            password: settingsData.password,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-account'] });
            queryClient.invalidateQueries({ queryKey: ['email-folders'] });
            setIsSettingsOpen(false);
            toast({ title: 'E-Mail-Konto eingerichtet' });
        },
        onError: (err) => {
            toast({ variant: 'destructive', title: 'Einrichtungsfehler', description: err.message });
        },
    });
    // Delete account mutation
    const deleteMutation = useMutation({
        mutationFn: () => api.deleteEmailAccount(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-account'] });
            toast({ title: 'E-Mail-Konto entfernt' });
        },
    });
    // Send email mutation
    const sendMutation = useMutation({
        mutationFn: () => api.sendEmail({
            to: composeData.to,
            subject: composeData.subject,
            body: composeData.body,
            cc: composeData.cc || undefined,
            bcc: composeData.bcc || undefined,
        }),
        onSuccess: () => {
            setIsComposing(false);
            setComposeData({ to: '', subject: '', body: '', cc: '', bcc: '' });
            refetchFolders();
            toast({ title: 'E-Mail gesendet' });
        },
        onError: (err) => {
            toast({ variant: 'destructive', title: 'Sendefehler', description: err.message });
        },
    });
    const handleSelectEmail = async (email) => {
        const response = await api.getEmail(currentFolder, email.id);
        setSelectedEmail(response.data);
    };
    // Render folder tree
    const renderFolders = (folders, level = 0) => {
        return folders.map((folder) => (_jsxs("div", { children: [_jsxs("button", { className: cn('w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors', currentFolder === folder.path
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'), style: { paddingLeft: `${12 + level * 16}px` }, onClick: () => {
                        setCurrentFolder(folder.path);
                        setSelectedEmail(null);
                    }, children: [currentFolder === folder.path ? (_jsx(FolderOpen, { className: "h-4 w-4" })) : (_jsx(Folder, { className: "h-4 w-4" })), _jsx("span", { className: "truncate", children: folder.name })] }), folder.children && folder.children.length > 0 && renderFolders(folder.children, level + 1)] }, folder.path)));
    };
    // No account - show setup
    if (!account && !accountLoading) {
        return (_jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-5 w-5" }), "E-Mail-Konto einrichten"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-muted-foreground", children: "Richten Sie Ihr E-Mail-Konto ein, um E-Mails abzurufen und zu senden." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "E-Mail-Adresse" }), _jsx(Input, { type: "email", placeholder: "ihre@email.de", value: settingsData.email, onChange: (e) => setSettingsData({ ...settingsData, email: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Benutzername" }), _jsx(Input, { placeholder: "benutzer oder volle E-Mail", value: settingsData.username, onChange: (e) => setSettingsData({ ...settingsData, username: e.target.value }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Passwort" }), _jsx(Input, { type: "password", placeholder: "Passwort oder App-Passwort", value: settingsData.password, onChange: (e) => setSettingsData({ ...settingsData, password: e.target.value }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "IMAP-Server" }), _jsx(Input, { placeholder: "imap.example.com", value: settingsData.imapHost, onChange: (e) => setSettingsData({ ...settingsData, imapHost: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "IMAP-Port" }), _jsx(Input, { type: "number", placeholder: "993", value: settingsData.imapPort, onChange: (e) => setSettingsData({ ...settingsData, imapPort: e.target.value }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "imapSecure", checked: settingsData.imapSecure, onChange: (e) => setSettingsData({ ...settingsData, imapSecure: e.target.checked }) }), _jsx(Label, { htmlFor: "imapSecure", className: "font-normal", children: "IMAP mit SSL/TLS (empfohlen)" })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "SMTP-Server" }), _jsx(Input, { placeholder: "smtp.example.com", value: settingsData.smtpHost, onChange: (e) => setSettingsData({ ...settingsData, smtpHost: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "SMTP-Port" }), _jsx(Input, { type: "number", placeholder: "465", value: settingsData.smtpPort, onChange: (e) => setSettingsData({ ...settingsData, smtpPort: e.target.value }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "smtpSecure", checked: settingsData.smtpSecure, onChange: (e) => setSettingsData({ ...settingsData, smtpSecure: e.target.checked }) }), _jsx(Label, { htmlFor: "smtpSecure", className: "font-normal", children: "SMTP mit SSL/TLS (empfohlen)" })] }), _jsx(Button, { className: "w-full", onClick: () => setupMutation.mutate(), disabled: setupMutation.isPending || !settingsData.email || !settingsData.username || !settingsData.password, children: setupMutation.isPending ? 'Einrichten...' : 'Konto einrichten' })] })] })] }) }));
    }
    // Loading state
    if (accountLoading || foldersLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(RefreshCw, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "flex h-[calc(100vh-8rem)] gap-4", children: [_jsx("div", { className: "w-64 flex-shrink-0", children: _jsxs(Card, { className: "h-full flex flex-col", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Mail, { className: "h-4 w-4" }), "E-Mail"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
                                                refetchFolders();
                                                refetchEmails();
                                            }, title: "Aktualisieren", children: _jsx(RefreshCw, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsSettingsOpen(true), title: "Einstellungen", children: _jsx(Settings, { className: "h-4 w-4" }) })] })] }), _jsxs(CardContent, { className: "flex-1 overflow-y-auto", children: [_jsxs(Button, { className: "w-full mb-4", onClick: () => setIsComposing(true), children: [_jsx(PenLine, { className: "h-4 w-4 mr-2" }), "Verfassen"] }), _jsx("div", { className: "space-y-1", children: renderFolders(folders) })] })] }) }), _jsx("div", { className: "w-80 flex-shrink-0", children: _jsxs(Card, { className: "h-full flex flex-col", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base", children: currentFolder.split('/').pop() || currentFolder }) }), _jsx(CardContent, { className: "flex-1 overflow-y-auto p-0", children: emailsLoading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(RefreshCw, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : emails.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Keine E-Mails" })) : (_jsx("div", { className: "divide-y", children: emails.map((email) => (_jsx("button", { className: cn('w-full text-left p-3 hover:bg-accent transition-colors', selectedEmail?.id === email.id && 'bg-accent', !email.seen && 'bg-blue-50 dark:bg-blue-950/30'), onClick: () => handleSelectEmail(email), children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn('truncate text-sm', !email.seen && 'font-semibold'), children: email.from.split('<')[0] || email.from }), _jsx("p", { className: cn('truncate text-xs', !email.seen && 'font-medium'), children: email.subject || '(Kein Betreff)' }), _jsx("p", { className: "text-xs text-muted-foreground truncate", children: email.date ? formatDate(email.date) : '' })] }), email.hasAttachments && (_jsx(Paperclip, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }))] }) }, email.id))) })) })] }) }), _jsx("div", { className: "flex-1", children: _jsx(Card, { className: "h-full flex flex-col", children: selectedEmail ? (_jsxs(_Fragment, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(CardTitle, { className: "text-lg", children: selectedEmail.subject || '(Kein Betreff)' }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mt-1", children: [_jsx(User, { className: "h-4 w-4" }), _jsx("span", { children: selectedEmail.from })] }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [selectedEmail.date, " an ", selectedEmail.to] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                        setComposeData({
                                                            to: selectedEmail.from.split('<')[1]?.replace('>', '') || selectedEmail.from,
                                                            subject: selectedEmail.subject ? `Re: ${selectedEmail.subject}` : '',
                                                            body: '',
                                                            cc: '',
                                                            bcc: '',
                                                        });
                                                        setIsComposing(true);
                                                    }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Antworten"] }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => setSelectedEmail(null), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] })] }) }), _jsxs(CardContent, { className: "flex-1 overflow-y-auto", children: [selectedEmail.html ? (_jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none", dangerouslySetInnerHTML: { __html: selectedEmail.html } })) : (_jsx("pre", { className: "whitespace-pre-wrap text-sm", children: selectedEmail.text || selectedEmail.body })), selectedEmail.attachments && selectedEmail.attachments.length > 0 && (_jsxs("div", { className: "mt-4 pt-4 border-t", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Anh\u00E4nge" }), _jsx("div", { className: "space-y-1", children: selectedEmail.attachments.map((att, i) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Paperclip, { className: "h-4 w-4" }), _jsx("span", { children: att.filename }), _jsxs("span", { className: "text-muted-foreground", children: ["(", Math.round(att.size / 1024), " KB)"] })] }, i))) })] }))] })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-muted-foreground", children: "E-Mail ausw\u00E4hlen" })) }) }), _jsx(Dialog, { open: isComposing, onOpenChange: setIsComposing, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Neue E-Mail" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "An" }), _jsx(Input, { type: "email", value: composeData.to, onChange: (e) => setComposeData({ ...composeData, to: e.target.value }), placeholder: "empfaenger@example.com" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "CC" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "email", value: composeData.cc, onChange: (e) => setComposeData({ ...composeData, cc: e.target.value }), className: "flex-1" }), _jsxs(Select, { value: "", onValueChange: (value) => {
                                                                const employee = employees.find((e) => e.email === value);
                                                                if (employee) {
                                                                    const currentCc = composeData.cc ? `${composeData.cc}, ${value}` : value;
                                                                    setComposeData({ ...composeData, cc: currentCc });
                                                                }
                                                            }, children: [_jsx(SelectTrigger, { className: "w-[50px] h-10", children: _jsx(Users, { className: "h-4 w-4" }) }), _jsx(SelectContent, { children: employees.map((employee) => (_jsx(SelectItem, { value: employee.email, children: employee.name || employee.email }, employee.id))) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "BCC" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "email", value: composeData.bcc, onChange: (e) => setComposeData({ ...composeData, bcc: e.target.value }), className: "flex-1" }), _jsxs(Select, { value: "", onValueChange: (value) => {
                                                                const employee = employees.find((e) => e.email === value);
                                                                if (employee) {
                                                                    const currentBcc = composeData.bcc ? `${composeData.bcc}, ${value}` : value;
                                                                    setComposeData({ ...composeData, bcc: currentBcc });
                                                                }
                                                            }, children: [_jsx(SelectTrigger, { className: "w-[50px] h-10", children: _jsx(Users, { className: "h-4 w-4" }) }), _jsx(SelectContent, { children: employees.map((employee) => (_jsx(SelectItem, { value: employee.email, children: employee.name || employee.email }, employee.id))) })] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Betreff" }), _jsx(Input, { value: composeData.subject, onChange: (e) => setComposeData({ ...composeData, subject: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Nachricht" }), _jsx("textarea", { className: "w-full min-h-[200px] p-3 border rounded-md", value: composeData.body, onChange: (e) => setComposeData({ ...composeData, body: e.target.value }) })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsComposing(false), children: "Abbrechen" }), _jsx(Button, { onClick: () => sendMutation.mutate(), disabled: sendMutation.isPending || !composeData.to || !composeData.subject, children: sendMutation.isPending ? 'Senden...' : 'Senden' })] })] })] }) }), _jsx(Dialog, { open: isSettingsOpen, onOpenChange: setIsSettingsOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "E-Mail-Konto" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-muted rounded-lg", children: [_jsx("p", { className: "font-medium", children: account?.email }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Verbunden mit ", account?.imapHost] })] }), _jsx(Button, { variant: "destructive", className: "w-full", onClick: () => {
                                        if (confirm('Möchten Sie das E-Mail-Konto entfernen?')) {
                                            deleteMutation.mutate();
                                            setIsSettingsOpen(false);
                                        }
                                    }, children: "Konto entfernen" })] })] }) })] }));
}
