import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, File, Download, Trash2, FileText, Image, Film, Music } from 'lucide-react';
import { cn, formatDate, formatFileSize } from '@/lib/utils';
export default function FilesPage() {
    const [isDragging, setIsDragging] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: filesResponse, isLoading } = useQuery({
        queryKey: ['files'],
        queryFn: () => api.getFiles(),
    });
    const files = filesResponse?.data || [];
    const uploadMutation = useMutation({
        mutationFn: (file) => api.uploadFile(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast({ title: 'Datei hochgeladen' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Hochladen' });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteFile(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast({ title: 'Datei gelöscht' });
        },
    });
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        files.forEach((file) => uploadMutation.mutate(file));
    }, [uploadMutation]);
    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => uploadMutation.mutate(file));
    }, [uploadMutation]);
    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/'))
            return Image;
        if (mimeType.startsWith('video/'))
            return Film;
        if (mimeType.startsWith('audio/'))
            return Music;
        return FileText;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Dateien" }), _jsxs("div", { className: cn('border-2 border-dashed rounded-lg p-8 text-center transition-colors', isDragging ? 'border-primary bg-primary/5' : 'border-border', 'cursor-pointer hover:border-primary/50'), onDragOver: (e) => { e.preventDefault(); setIsDragging(true); }, onDragLeave: () => setIsDragging(false), onDrop: handleDrop, onClick: () => document.getElementById('file-input')?.click(), children: [_jsx(Upload, { className: "h-10 w-10 mx-auto mb-4 text-muted-foreground" }), _jsx("p", { className: "text-lg font-medium", children: "Dateien hierher ziehen oder klicken zum Hochladen" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Maximale Dateigr\u00F6\u00DFe: 10MB" }), _jsx("input", { id: "file-input", type: "file", className: "hidden", multiple: true, onChange: handleFileSelect })] }), isLoading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Laden..." })) : files.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [_jsx(File, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Noch keine Dateien hochgeladen" })] })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: files.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    return (_jsx(Card, { className: "overflow-hidden", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "p-2 bg-muted rounded-lg", children: _jsx(Icon, { className: "h-6 w-6" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium truncate", title: file.originalName, children: file.originalName }), _jsx("p", { className: "text-sm text-muted-foreground", children: formatFileSize(file.size) }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDate(file.createdAt) })] })] }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx(Button, { variant: "outline", size: "sm", className: "flex-1", asChild: true, children: _jsxs("a", { href: api.getFileUrl(file.id), target: "_blank", rel: "noopener noreferrer", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Herunterladen"] }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                if (confirm('Diese Datei löschen?')) {
                                                    deleteMutation.mutate(file.id);
                                                }
                                            }, children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] })] }) }, file.id));
                }) }))] }));
}
