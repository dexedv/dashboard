import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, parseISO, } from 'date-fns';
import { de } from 'date-fns/locale';
export default function CalendarPage() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        location: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        reminder: '0',
    });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const { data: eventsResponse } = useQuery({
        queryKey: ['events', format(currentDate, 'yyyy-MM')],
        queryFn: () => api.getEvents({
            start: calendarStart.toISOString(),
            end: calendarEnd.toISOString(),
        }),
    });
    const events = eventsResponse?.data || [];
    const createMutation = useMutation({
        mutationFn: (data) => api.createEvent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsCreateOpen(false);
            setNewEvent({
                title: '',
                description: '',
                location: '',
                startDate: '',
                startTime: '',
                endDate: '',
                endTime: '',
                reminder: '0',
            });
            toast({ title: 'Termin erstellt' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast({ title: 'Termin gelöscht' });
        },
    });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const getEventsForDay = (date) => {
        return events.filter((event) => isSameDay(parseISO(event.startAt), date));
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const startAt = `${newEvent.startDate}T${newEvent.startTime || '00:00'}`;
        const endAt = `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || '23:59'}`;
        createMutation.mutate({
            title: newEvent.title,
            description: newEvent.description || undefined,
            location: newEvent.location || undefined,
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
            reminderMinutes: newEvent.reminder === '0' ? undefined : parseInt(newEvent.reminder),
        });
    };
    const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];
    return (_jsxs("div", { className: "flex gap-4 h-[calc(100vh-8rem)]", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-2xl font-bold", children: format(currentDate, 'MMMM yyyy', { locale: de }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: () => setCurrentDate(subMonths(currentDate, 1)), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", onClick: () => setCurrentDate(new Date()), children: "Heute" }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => setCurrentDate(addMonths(currentDate, 1)), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden", children: [['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (_jsx("div", { className: "bg-muted p-2 text-center text-sm font-medium", children: day }, day))), days.map((day) => {
                                const dayEvents = getEventsForDay(day);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isToday = isSameDay(day, new Date());
                                return (_jsxs("div", { className: cn('bg-background p-2 min-h-[100px] cursor-pointer hover:bg-accent/50 transition-colors', !isSameMonth(day, currentDate) && 'text-muted-foreground/50'), onClick: () => setSelectedDate(day), children: [_jsx("div", { className: cn('text-sm font-medium mb-1', isSelected && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center', isToday && !isSelected && 'text-primary'), children: format(day, 'd') }), _jsxs("div", { className: "space-y-1", children: [dayEvents.slice(0, 3).map((event) => (_jsx("div", { className: "text-xs truncate px-1 py-0.5 bg-primary/10 rounded", children: event.title }, event.id))), dayEvents.length > 3 && (_jsxs("div", { className: "text-xs text-muted-foreground", children: ["+", dayEvents.length - 3, " weitere"] }))] })] }, day.toISOString()));
                            })] })] }), _jsx("div", { className: "w-80", children: _jsxs(Card, { className: "h-full", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { children: selectedDate ? format(selectedDate, 'EEEE, d. MMMM', { locale: de }) : 'Wähle einen Tag' }), _jsxs(Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { size: "icon", children: _jsx(Plus, { className: "h-4 w-4" }) }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Termin erstellen" }) }), _jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Titel" }), _jsx(Input, { value: newEvent.title, onChange: (e) => setNewEvent({ ...newEvent, title: e.target.value }), required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Startdatum" }), _jsx(Input, { type: "date", value: newEvent.startDate, onChange: (e) => setNewEvent({ ...newEvent, startDate: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Startzeit" }), _jsx(Input, { type: "time", value: newEvent.startTime, onChange: (e) => setNewEvent({ ...newEvent, startTime: e.target.value }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Enddatum" }), _jsx(Input, { type: "date", value: newEvent.endDate, onChange: (e) => setNewEvent({ ...newEvent, endDate: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Endzeit" }), _jsx(Input, { type: "time", value: newEvent.endTime, onChange: (e) => setNewEvent({ ...newEvent, endTime: e.target.value }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Ort" }), _jsx(Input, { value: newEvent.location, onChange: (e) => setNewEvent({ ...newEvent, location: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Erinnerung" }), _jsxs(Select, { value: newEvent.reminder, onValueChange: (value) => setNewEvent({ ...newEvent, reminder: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0", children: "Keine Erinnerung" }), _jsx(SelectItem, { value: "15", children: "15 Minuten vorher" }), _jsx(SelectItem, { value: "30", children: "30 Minuten vorher" }), _jsx(SelectItem, { value: "60", children: "1 Stunde vorher" }), _jsx(SelectItem, { value: "1440", children: "1 Tag vorher" })] })] })] }), _jsx(Button, { type: "submit", className: "w-full", children: "Erstellen" })] })] })] })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: selectedDayEvents.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Keine Termine" })) : (selectedDayEvents.map((event) => (_jsx("div", { className: "p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-medium", children: event.title }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mt-1", children: [_jsx(Clock, { className: "h-3 w-3" }), formatDateTime(event.startAt)] }), event.location && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mt-1", children: [_jsx(MapPin, { className: "h-3 w-3" }), event.location] })), event.orderId && (_jsx(Button, { variant: "link", size: "sm", className: "h-auto p-0 text-xs text-blue-500 mt-1", onClick: () => navigate(`/app/orders/${event.orderId}`), children: "Zum Auftrag" }))] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
                                                    if (confirm('Diesen Termin löschen?')) {
                                                        deleteMutation.mutate(event.id);
                                                    }
                                                }, children: _jsx("span", { className: "text-destructive text-xs", children: "L\u00F6schen" }) })] }) }, event.id)))) }) })] }) })] }));
}
