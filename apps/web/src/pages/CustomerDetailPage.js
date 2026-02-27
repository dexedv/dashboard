import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, ArrowLeft, Mail, Phone, MapPin, FileText, Upload, Trash2, File, Clock, History, Pencil, X, Eye } from 'lucide-react';
import { cn, formatDate, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';
const ORDER_STATUSES = ['NEW', 'IN_PROGRESS', 'WAITING_MATERIAL', 'DONE', 'SHIPPED', 'CANCELED'];
const EVENT_TYPES = ['STATUS_CHANGE', 'NOTE', 'FILE_ADDED', 'CONTACT'];
export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isEventOpen, setIsEventOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ type: 'NOTE', note: '' });
    const [editData, setEditData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });
    const [newOrder, setNewOrder] = useState({
        title: '',
        description: '',
        status: 'NEW',
        dueDate: '',
        promisedDeliveryDate: '',
    });
    const [orderFile, setOrderFile] = useState(null);
    // Fetch customer data
    const { data: customerResponse, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => api.getCustomer(id),
        enabled: !!id,
    });
    // Fetch orders for this customer
    const { data: ordersResponse } = useQuery({
        queryKey: ['orders', id],
        queryFn: () => api.getOrders({ customerId: id }),
        enabled: !!id,
    });
    // Fetch files for this customer
    const { data: filesResponse, refetch: refetchFiles } = useQuery({
        queryKey: ['customer-files', id],
        queryFn: () => api.getFiles({ customerId: id }),
        enabled: !!id,
    });
    const customer = customerResponse?.data;
    const orders = ordersResponse?.data || [];
    const files = filesResponse?.data || [];
    const updateMutation = useMutation({
        mutationFn: (data) => api.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', id] });
            setIsEditOpen(false);
            toast({ title: 'Kunde aktualisiert' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Aktualisieren' });
        },
    });
    const createOrderMutation = useMutation({
        mutationFn: async (data) => {
            // Create order
            const orderResponse = await api.createOrder(data);
            if (!orderResponse.success)
                throw new Error(orderResponse.error);
            // Upload file if provided
            if (orderFile) {
                await api.uploadFile(orderFile, id, orderResponse.data.id);
            }
            // Auto-create calendar event when Lieferdatum is set
            if (data.promisedDeliveryDate) {
                const deliveryDate = new Date(data.promisedDeliveryDate);
                const startTime = new Date(deliveryDate);
                startTime.setHours(9, 0, 0, 0);
                const endTime = new Date(deliveryDate);
                endTime.setHours(17, 0, 0, 0);
                await api.createEvent({
                    title: `[Lieferung] ${data.title}`,
                    description: data.description || undefined,
                    startAt: startTime.toISOString(),
                    endAt: endTime.toISOString(),
                    orderId: orderResponse.data.id,
                });
            }
            return orderResponse;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders', id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            refetchFiles();
            setIsOrderOpen(false);
            setNewOrder({ title: '', description: '', status: 'NEW', dueDate: '', promisedDeliveryDate: '' });
            setOrderFile(null);
            toast({ title: 'Auftrag erstellt' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
        },
    });
    const updateOrderMutation = useMutation({
        mutationFn: ({ orderId, data }) => api.updateOrder(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders', id] });
            if (selectedOrder) {
                queryClient.invalidateQueries({ queryKey: ['order', selectedOrder.id] });
            }
            toast({ title: 'Auftrag aktualisiert' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Aktualisieren' });
        },
    });
    const deleteOrderMutation = useMutation({
        mutationFn: (orderId) => api.deleteOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders', id] });
            setSelectedOrder(null);
            toast({ title: 'Auftrag gelöscht' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Löschen' });
        },
    });
    const addOrderEventMutation = useMutation({
        mutationFn: ({ orderId, data }) => api.addOrderEvent(orderId, data),
        onSuccess: () => {
            if (selectedOrder) {
                queryClient.invalidateQueries({ queryKey: ['order', selectedOrder.id] });
            }
            setIsEventOpen(false);
            setNewEvent({ type: 'NOTE', note: '' });
            toast({ title: 'Eintrag hinzugefügt' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Hinzufügen' });
        },
    });
    const uploadFileMutation = useMutation({
        mutationFn: async (file) => {
            await api.uploadFile(file, id, undefined);
        },
        onSuccess: () => {
            refetchFiles();
            toast({ title: 'Datei hochgeladen' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Hochladen' });
        },
    });
    const deleteFileMutation = useMutation({
        mutationFn: (fileId) => api.deleteFile(fileId),
        onSuccess: () => {
            refetchFiles();
            toast({ title: 'Datei gelöscht' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Löschen' });
        },
    });
    if (isLoading)
        return _jsx("div", { className: "text-center py-8", children: "Laden..." });
    if (!customer) {
        return _jsx("div", { className: "text-center py-8", children: "Kunde nicht gefunden" });
    }
    const handleEdit = () => {
        setEditData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            notes: customer.notes || '',
        });
        setIsEditOpen(true);
    };
    const handleUpdate = (e) => {
        e.preventDefault();
        updateMutation.mutate({
            name: editData.name,
            email: editData.email || null,
            phone: editData.phone || null,
            address: editData.address || null,
            notes: editData.notes || null,
        });
    };
    const handleCreateOrder = (e) => {
        e.preventDefault();
        createOrderMutation.mutate({
            customerId: id,
            title: newOrder.title,
            description: newOrder.description || null,
            status: newOrder.status,
            dueDate: newOrder.dueDate ? new Date(newOrder.dueDate).toISOString() : null,
            promisedDeliveryDate: newOrder.promisedDeliveryDate ? new Date(newOrder.promisedDeliveryDate).toISOString() : null,
        });
        // Note: Calendar event and file upload are handled in the mutation
    };
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadFileMutation.mutate(file);
            e.target.value = '';
        }
    };
    const handleAddEvent = (e) => {
        e.preventDefault();
        if (selectedOrder) {
            addOrderEventMutation.mutate({ orderId: selectedOrder.id, data: newEvent });
        }
    };
    const openOrderDetail = async (order) => {
        const orderResponse = await api.getOrder(order.id);
        if (orderResponse?.success && orderResponse?.data) {
            setSelectedOrder(orderResponse.data);
        }
    };
    const getEventTypeLabel = (type) => {
        const labels = {
            STATUS_CHANGE: 'Statusänderung',
            NOTE: 'Notiz',
            FILE_ADDED: 'Datei hinzugefügt',
            CONTACT: 'Kontakt',
        };
        return labels[type] || type;
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate('/app/customers'), children: _jsx(ArrowLeft, { className: "h-4 w-4" }) }), _jsx("h1", { className: "text-3xl font-bold", children: customer.name }), _jsxs(Button, { variant: "outline", onClick: handleEdit, className: "ml-auto", children: [_jsx(Pencil, { className: "h-4 w-4 mr-2" }), "Bearbeiten"] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Kontaktdaten" }) }), _jsxs(CardContent, { className: "space-y-4", children: [customer.email && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { children: customer.email })] })), customer.phone && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Phone, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { children: customer.phone })] })), customer.address && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { children: customer.address })] })), customer.notes && (_jsx("div", { className: "pt-2 border-t", children: _jsx("p", { className: "text-sm text-muted-foreground", children: customer.notes }) })), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Erstellt am ", formatDate(customer.createdAt)] })] })] }), _jsxs(Card, { className: "lg:col-span-2", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs(CardTitle, { children: ["Auftr\u00E4ge (", orders.length, ")"] }), _jsxs(Dialog, { open: isOrderOpen, onOpenChange: setIsOrderOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Neuer Auftrag"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Auftrag erstellen" }) }), _jsxs("form", { onSubmit: handleCreateOrder, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Titel *" }), _jsx(Input, { value: newOrder.title, onChange: (e) => setNewOrder({ ...newOrder, title: e.target.value }), placeholder: "z.B. Projekt XY", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Beschreibung" }), _jsx("textarea", { className: "w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm", value: newOrder.description, onChange: (e) => setNewOrder({ ...newOrder, description: e.target.value }), placeholder: "Optionale Beschreibung..." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: newOrder.status, onValueChange: (value) => setNewOrder({ ...newOrder, status: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: ORDER_STATUSES.map((status) => (_jsx(SelectItem, { value: status, children: getStatusLabel(status) }, status))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "F\u00E4lligkeitsdatum" }), _jsx(Input, { type: "date", value: newOrder.dueDate, onChange: (e) => setNewOrder({ ...newOrder, dueDate: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Lieferdatum" }), _jsx(Input, { type: "date", value: newOrder.promisedDeliveryDate, onChange: (e) => setNewOrder({ ...newOrder, promisedDeliveryDate: e.target.value }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Dokument hochladen" }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("input", { type: "file", id: "order-file", className: "hidden", accept: ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif", onChange: (e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        setOrderFile(file);
                                                                                    }
                                                                                } }), _jsx("label", { htmlFor: "order-file", className: "flex-1 cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2", children: orderFile ? orderFile.name : 'Datei auswählen' }), orderFile && (_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setOrderFile(null), type: "button", children: _jsx(X, { className: "h-4 w-4" }) }))] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: createOrderMutation.isPending, children: createOrderMutation.isPending ? 'Erstellen...' : 'Auftrag erstellen' })] })] })] })] }), _jsx(CardContent, { children: orders.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Noch keine Auftr\u00E4ge vorhanden" })) : (_jsx("div", { className: "space-y-2", children: orders.map((order) => (_jsx("div", { className: "flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer", onClick: () => openOrderDetail(order), children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: order.title }), _jsx("span", { className: cn('text-xs px-2 py-1 rounded', getStatusColor(order.status)), children: getStatusLabel(order.status) })] }), _jsxs("div", { className: "flex gap-4 mt-1 text-sm text-muted-foreground", children: [order.dueDate && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), "F\u00E4llig: ", formatDate(order.dueDate)] })), order.promisedDeliveryDate && (_jsxs("span", { children: ["Lieferung: ", formatDate(order.promisedDeliveryDate)] }))] })] }) }, order.id))) })) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "h-5 w-5" }), "Dokumente & Rechnungen (", files.length, ")"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileUpload, className: "hidden", accept: ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif" }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => fileInputRef.current?.click(), disabled: uploadFileMutation.isPending, children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), uploadFileMutation.isPending ? 'Hochladen...' : 'Datei hochladen'] })] })] }), _jsx(CardContent, { children: files.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Noch keine Dokumente hochgeladen" })) : (_jsx("div", { className: "grid gap-2 md:grid-cols-2 lg:grid-cols-3", children: files.map((file) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg border group", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx(File, { className: "h-8 w-8 text-muted-foreground flex-shrink-0" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-medium truncate", children: file.originalName }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formatFileSize(file.size), " \u2022 ", formatDate(file.createdAt)] })] })] }), _jsx("div", { className: "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => deleteFileMutation.mutate(file.id), children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) }) })] }, file.id))) })) })] }), _jsx(Dialog, { open: !!selectedOrder, onOpenChange: (open) => !open && setSelectedOrder(null), children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [selectedOrder?.title, selectedOrder && (_jsx("span", { className: cn('text-sm px-2 py-1 rounded', getStatusColor(selectedOrder.status)), children: getStatusLabel(selectedOrder.status) }))] }) }), selectedOrder && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Status \u00E4ndern" }), _jsxs(Select, { value: selectedOrder.status, onValueChange: (value) => updateOrderMutation.mutate({ orderId: selectedOrder.id, data: { status: value } }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: ORDER_STATUSES.map((status) => (_jsx(SelectItem, { value: status, children: getStatusLabel(status) }, status))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "F\u00E4lligkeitsdatum" }), _jsx(Input, { type: "date", value: selectedOrder.dueDate ? selectedOrder.dueDate.split('T')[0] : '', onChange: (e) => updateOrderMutation.mutate({
                                                        orderId: selectedOrder.id,
                                                        data: { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null }
                                                    }) })] })] }), selectedOrder.description && (_jsxs("div", { children: [_jsx(Label, { children: "Beschreibung" }), _jsx("p", { className: "mt-1 text-sm", children: selectedOrder.description })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx(Label, { children: "Verlauf" }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => setIsEventOpen(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Eintrag hinzuf\u00FCgen"] })] }), _jsx("div", { className: "space-y-3 max-h-60 overflow-y-auto", children: selectedOrder.events.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Noch kein Verlauf vorhanden" })) : (selectedOrder.events.map((event) => (_jsxs("div", { className: "flex gap-3 p-3 rounded-lg bg-muted", children: [_jsx(History, { className: "h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium uppercase", children: getEventTypeLabel(event.type) }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDateTime(event.createdAt) })] }), _jsx("p", { className: "text-sm mt-1", children: event.note })] })] }, event.id)))) })] }), _jsxs("div", { className: "flex gap-2 pt-4 border-t", children: [_jsxs(Button, { onClick: () => navigate(`/app/orders/${selectedOrder.id}`), children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "Zum Auftrag"] }), _jsxs(Button, { variant: "destructive", onClick: () => {
                                                if (confirm('Möchten Sie diesen Auftrag wirklich löschen?')) {
                                                    deleteOrderMutation.mutate(selectedOrder.id);
                                                }
                                            }, children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Auftrag l\u00F6schen"] })] })] }))] }) }), _jsx(Dialog, { open: isEventOpen, onOpenChange: setIsEventOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Verlaufseintrag hinzuf\u00FCgen" }) }), _jsxs("form", { onSubmit: handleAddEvent, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Typ" }), _jsxs(Select, { value: newEvent.type, onValueChange: (value) => setNewEvent({ ...newEvent, type: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: EVENT_TYPES.map((type) => (_jsx(SelectItem, { value: type, children: getEventTypeLabel(type) }, type))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Notiz" }), _jsx("textarea", { className: "w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm", value: newEvent.note, onChange: (e) => setNewEvent({ ...newEvent, note: e.target.value }), placeholder: "Notiz eingeben...", required: true })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEventOpen(false), className: "flex-1", children: "Abbrechen" }), _jsx(Button, { type: "submit", className: "flex-1", disabled: addOrderEventMutation.isPending, children: addOrderEventMutation.isPending ? 'Hinzufügen...' : 'Hinzufügen' })] })] })] }) }), _jsx(Dialog, { open: isEditOpen, onOpenChange: setIsEditOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Kunde bearbeiten" }) }), _jsxs("form", { onSubmit: handleUpdate, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name *" }), _jsx(Input, { value: editData.name, onChange: (e) => setEditData({ ...editData, name: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "E-Mail" }), _jsx(Input, { type: "email", value: editData.email, onChange: (e) => setEditData({ ...editData, email: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Telefon" }), _jsx(Input, { value: editData.phone, onChange: (e) => setEditData({ ...editData, phone: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Adresse" }), _jsx(Input, { value: editData.address, onChange: (e) => setEditData({ ...editData, address: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Notizen" }), _jsx("textarea", { className: "w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm", value: editData.notes, onChange: (e) => setEditData({ ...editData, notes: e.target.value }) })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: updateMutation.isPending, children: updateMutation.isPending ? 'Speichern...' : 'Speichern' })] })] }) })] }));
}
