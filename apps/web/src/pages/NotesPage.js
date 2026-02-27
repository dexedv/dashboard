import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Pin, Trash2, FileText } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
export default function NotesPage() {
    const [search, setSearch] = useState('');
    const [selectedNote, setSelectedNote] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: notesResponse, isLoading } = useQuery({
        queryKey: ['notes', search],
        queryFn: () => api.getNotes({ q: search || undefined }),
    });
    const notes = notesResponse?.data || [];
    const createMutation = useMutation({
        mutationFn: (data) => api.createNote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            setIsCreateOpen(false);
            setNewNote({ title: '', content: '', tags: '' });
            toast({ title: 'Notiz erstellt' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateNote(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            if (selectedNote) {
                api.getNote(selectedNote.id).then((res) => {
                    if (res.success)
                        setSelectedNote(res.data);
                });
            }
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteNote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            setSelectedNote(null);
            toast({ title: 'Notiz gelöscht' });
        },
    });
    const togglePinMutation = useMutation({
        mutationFn: (id) => api.togglePinNote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
    const handleCreate = (e) => {
        e.preventDefault();
        createMutation.mutate({
            title: newNote.title,
            content: newNote.content,
            tags: newNote.tags.split(',').map((t) => t.trim()).filter(Boolean),
        });
    };
    const handleSave = () => {
        if (selectedNote) {
            updateMutation.mutate({
                id: selectedNote.id,
                data: { content: selectedNote.content, title: selectedNote.title },
            });
        }
    };
    const pinnedNotes = notes.filter((n) => n.pinned);
    const unpinnedNotes = notes.filter((n) => !n.pinned);
    return (_jsxs("div", { className: "h-[calc(100vh-8rem)] flex gap-4", children: [_jsxs("div", { className: "w-80 flex flex-col border-r pr-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Notizen durchsuchen...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-9" })] }), _jsxs(Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { size: "icon", children: _jsx(Plus, { className: "h-4 w-4" }) }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Notiz erstellen" }) }), _jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Titel" }), _jsx(Input, { value: newNote.title, onChange: (e) => setNewNote({ ...newNote, title: e.target.value }), placeholder: "Notiz-Titel", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Inhalt" }), _jsx("textarea", { className: "w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm", value: newNote.content, onChange: (e) => setNewNote({ ...newNote, content: e.target.value }), placeholder: "Notiz-Inhalt..." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Tags (kommagetrennt)" }), _jsx(Input, { value: newNote.tags, onChange: (e) => setNewNote({ ...newNote, tags: e.target.value }), placeholder: "tag1, tag2" })] }), _jsx(Button, { type: "submit", className: "w-full", children: "Erstellen" })] })] })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto space-y-2", children: isLoading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." })) : notes.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(FileText, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "Noch keine Notizen" })] })) : (_jsxs(_Fragment, { children: [pinnedNotes.length > 0 && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Angepinnt" }), pinnedNotes.map((note) => (_jsx(NoteItem, { note: note, isSelected: selectedNote?.id === note.id, onClick: () => setSelectedNote(note), onTogglePin: () => togglePinMutation.mutate(note.id) }, note.id)))] })), unpinnedNotes.length > 0 && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1 mt-2", children: "Notizen" }), unpinnedNotes.map((note) => (_jsx(NoteItem, { note: note, isSelected: selectedNote?.id === note.id, onClick: () => setSelectedNote(note), onTogglePin: () => togglePinMutation.mutate(note.id) }, note.id)))] }))] })) })] }), _jsx("div", { className: "flex-1", children: selectedNote ? (_jsxs(Card, { className: "h-full", children: [_jsxs(CardHeader, { className: "flex flex-row items-center gap-2", children: [_jsx(Input, { value: selectedNote.title, onChange: (e) => setSelectedNote({ ...selectedNote, title: e.target.value }), onBlur: handleSave, className: "text-xl font-bold border-0 px-0 focus-visible:ring-0", placeholder: "Notiz-Titel" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => togglePinMutation.mutate(selectedNote.id), children: _jsx(Pin, { className: cn('h-4 w-4', selectedNote.pinned && 'fill-current') }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
                                        if (confirm('Diese Notiz löschen?')) {
                                            deleteMutation.mutate(selectedNote.id);
                                        }
                                    }, children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] }), _jsxs(CardContent, { children: [_jsx("textarea", { className: "w-full h-[calc(100%-2rem)] min-h-[300px] resize-none border-0 focus-visible:ring-0 bg-transparent", value: selectedNote.content, onChange: (e) => setSelectedNote({ ...selectedNote, content: e.target.value }), onBlur: handleSave, placeholder: "Beginne zu schreiben..." }), _jsx("div", { className: "flex gap-2 mt-2", children: selectedNote.tags.map((tag) => (_jsx("span", { className: "text-xs bg-secondary px-2 py-1 rounded-full", children: tag }, tag))) }), _jsxs("p", { className: "text-xs text-muted-foreground mt-4", children: ["Aktualisiert ", formatDate(selectedNote.updatedAt)] })] })] })) : (_jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "W\u00E4hle eine Notiz zum Anzeigen oder Bearbeiten" })] }) })) })] }));
}
function NoteItem({ note, isSelected, onClick, onTogglePin, }) {
    return (_jsx("div", { className: cn('p-3 rounded-lg cursor-pointer transition-colors', isSelected ? 'bg-primary/10' : 'hover:bg-accent'), onClick: onClick, children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-medium truncate", children: note.title || 'Ohne Titel' }), _jsx("p", { className: "text-sm text-muted-foreground truncate", children: note.content.slice(0, 50) || 'Kein Inhalt' })] }), note.pinned && (_jsx(Pin, { className: "h-4 w-4 fill-current flex-shrink-0" }))] }) }));
}
