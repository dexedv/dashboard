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
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  reminderMinutes: number | null;
  orderId: string | null;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
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
    queryFn: () =>
      api.getEvents({
        start: calendarStart.toISOString(),
        end: calendarEnd.toISOString(),
      }),
  });

  const events = eventsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      location?: string;
      startAt: string;
      endAt: string;
      reminderMinutes?: number;
    }) => api.createEvent(data),
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
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Termin gelöscht' });
    },
  });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter((event: CalendarEvent) =>
      isSameDay(parseISO(event.startAt), date)
    );
  };

  const handleCreate = (e: React.FormEvent) => {
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

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Calendar Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Heute
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'bg-background p-2 min-h-[100px] cursor-pointer hover:bg-accent/50 transition-colors',
                  !isSameMonth(day, currentDate) && 'text-muted-foreground/50'
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isSelected && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center',
                  isToday && !isSelected && 'text-primary'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                    <div
                      key={event.id}
                      className="text-xs truncate px-1 py-0.5 bg-primary/10 rounded"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail */}
      <div className="w-80">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedDate ? format(selectedDate, 'EEEE, d. MMMM', { locale: de }) : 'Wähle einen Tag'}
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Termin erstellen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Startdatum</Label>
                      <Input
                        type="date"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Startzeit</Label>
                      <Input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Enddatum</Label>
                      <Input
                        type="date"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Endzeit</Label>
                      <Input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ort</Label>
                    <Input
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Erinnerung</Label>
                    <Select
                      value={newEvent.reminder}
                      onValueChange={(value) => setNewEvent({ ...newEvent, reminder: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Keine Erinnerung</SelectItem>
                        <SelectItem value="15">15 Minuten vorher</SelectItem>
                        <SelectItem value="30">30 Minuten vorher</SelectItem>
                        <SelectItem value="60">1 Stunde vorher</SelectItem>
                        <SelectItem value="1440">1 Tag vorher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Erstellen</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDayEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Termine</p>
              ) : (
                selectedDayEvents.map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{event.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(event.startAt)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.orderId && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-500 mt-1"
                            onClick={() => navigate(`/app/orders/${event.orderId}`)}
                          >
                            Zum Auftrag
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Diesen Termin löschen?')) {
                            deleteMutation.mutate(event.id);
                          }
                        }}
                      >
                        <span className="text-destructive text-xs">Löschen</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
