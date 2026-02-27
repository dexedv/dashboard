import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, History, User } from 'lucide-react';
import { cn, formatDate, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';
const ORDER_STATUSES = ['NEW', 'IN_PROGRESS', 'WAITING_MATERIAL', 'DONE', 'SHIPPED', 'CANCELED'];
const EVENT_TYPES = ['STATUS_CHANGE', 'NOTE', 'FILE_ADDED', 'CONTACT'];
export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newEvent, setNewEvent] = useState({ type: 'NOTE', note: '' });
    const [isEventOpen, setIsEventOpen] = useState(false);
    const { data: orderResponse, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => api.getOrder(id),
        enabled: !!id,
    });
    const order = orderResponse;
    const updateMutation = useMutation({
        mutationFn: (data) => api.updateOrder(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            toast({ title: 'Order updated' });
        },
    });
    const addEventMutation = useMutation({
        mutationFn: (data) => api.addOrderEvent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            setIsEventOpen(false);
            setNewEvent({ type: 'NOTE', note: '' });
            toast({ title: 'Event added' });
        },
    });
    if (isLoading)
        return _jsx("div", { className: "text-center py-8", children: "Loading..." });
    if (!order?.success || !order.data) {
        return _jsx("div", { className: "text-center py-8", children: "Order not found" });
    }
    const data = order.data;
    const handleStatusChange = (status) => {
        updateMutation.mutate({ status });
    };
    const handleAddEvent = (e) => {
        e.preventDefault();
        addEventMutation.mutate(newEvent);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate(-1), children: _jsx(ArrowLeft, { className: "h-4 w-4" }) }), _jsx("h1", { className: "text-3xl font-bold", children: data.title }), _jsxs(Select, { value: data.status, onValueChange: handleStatusChange, children: [_jsx(SelectTrigger, { className: cn('w-48', getStatusColor(data.status)), children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: ORDER_STATUSES.map((status) => (_jsx(SelectItem, { value: status, children: getStatusLabel(status) }, status))) })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Order Details" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Customer" }), _jsx("p", { className: "font-medium", children: data.customerName })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Erstellt von" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: data.userName }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(#", data.userEmployeeNumber, ")"] }), _jsx(Button, { variant: "link", size: "sm", className: "h-auto p-0 text-xs", onClick: () => navigate(`/app/employees/${data.userId}`), children: "Profil anzeigen" })] })] }), data.description && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Description" }), _jsx("p", { children: data.description })] })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [data.dueDate && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Due Date" }), _jsx("p", { className: "font-medium", children: formatDate(data.dueDate) })] })), data.promisedDeliveryDate && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Promised Delivery" }), _jsx("p", { className: "font-medium", children: formatDate(data.promisedDeliveryDate) })] }))] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Created ", formatDate(data.createdAt)] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { children: "History" }), _jsxs(Button, { size: "sm", onClick: () => setIsEventOpen(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Note"] })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: data.events.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "No history yet" })) : (data.events.map((event) => (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx(History, { className: "h-4 w-4 text-muted-foreground" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium uppercase", children: event.type.replace('_', ' ') }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDateTime(event.createdAt) })] }), _jsx("p", { className: "text-sm mt-1", children: event.note })] })] }, event.id)))) }) })] })] }), isEventOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs(Card, { className: "w-full max-w-md m-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Add Note" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleAddEvent, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: newEvent.type, onValueChange: (value) => setNewEvent({ ...newEvent, type: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: EVENT_TYPES.map((type) => (_jsx(SelectItem, { value: type, children: type.replace('_', ' ') }, type))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Note" }), _jsx("textarea", { className: "w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm", value: newEvent.note, onChange: (e) => setNewEvent({ ...newEvent, note: e.target.value }), required: true })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEventOpen(false), className: "flex-1", children: "Cancel" }), _jsx(Button, { type: "submit", className: "flex-1", children: "Add" })] })] }) })] }) }))] }));
}
