import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Clock, History, User } from 'lucide-react';
import { cn, formatDate, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';

const ORDER_STATUSES = ['NEW', 'IN_PROGRESS', 'WAITING_MATERIAL', 'DONE', 'SHIPPED', 'CANCELED'];
const EVENT_TYPES = ['STATUS_CHANGE', 'NOTE', 'FILE_ADDED', 'CONTACT'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({ type: 'NOTE', note: '' });
  const [isEventOpen, setIsEventOpen] = useState(false);

  const { data: orderResponse, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id!),
    enabled: !!id,
  });

  const order = orderResponse;

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.updateOrder>[1]) =>
      api.updateOrder(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ title: 'Order updated' });
    },
  });

  const addEventMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.addOrderEvent>[1]) =>
      api.addOrderEvent(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setIsEventOpen(false);
      setNewEvent({ type: 'NOTE', note: '' });
      toast({ title: 'Event added' });
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (!order?.success || !order.data) {
    return <div className="text-center py-8">Order not found</div>;
  }

  const data = order.data;

  const handleStatusChange = (status: string) => {
    updateMutation.mutate({ status });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEventMutation.mutate(newEvent);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{data.title}</h1>
        <Select value={data.status} onValueChange={handleStatusChange}>
          <SelectTrigger className={cn('w-48', getStatusColor(data.status))}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{data.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erstellt von</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{data.userName}</span>
                <span className="text-xs text-muted-foreground">(#{data.userEmployeeNumber})</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate(`/app/employees/${data.userId}`)}
                >
                  Profil anzeigen
                </Button>
              </div>
            </div>
            {data.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{data.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {data.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(data.dueDate)}</p>
                </div>
              )}
              {data.promisedDeliveryDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Promised Delivery</p>
                  <p className="font-medium">{formatDate(data.promisedDeliveryDate)}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(data.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>History</CardTitle>
            <Button size="sm" onClick={() => setIsEventOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.events.length === 0 ? (
                <p className="text-muted-foreground text-sm">No history yet</p>
              ) : (
                data.events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-1">
                      <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase">{event.type.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(event.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.note}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isEventOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Add Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newEvent.note}
                    onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEventOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Add</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
