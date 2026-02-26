import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  promisedDeliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  events: Array<{
    id: string;
    type: string;
    note: string;
    createdAt: string;
  }>;
}

interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
  const [orderFile, setOrderFile] = useState<File | null>(null);

  // Fetch customer data
  const { data: customerResponse, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.getCustomer(id!),
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
    mutationFn: (data: Parameters<typeof api.updateCustomer>[1]) =>
      api.updateCustomer(id!, data),
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
    mutationFn: async (data: Parameters<typeof api.createOrder>[0]) => {
      // Create order
      const orderResponse = await api.createOrder(data);
      if (!orderResponse.success) throw new Error(orderResponse.error);

      // Upload file if provided
      if (orderFile) {
        await api.uploadFile(orderFile, id!, orderResponse.data.id);
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
    mutationFn: ({ orderId, data }: { orderId: string; data: Parameters<typeof api.updateOrder>[1] }) =>
      api.updateOrder(orderId, data),
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
    mutationFn: (orderId: string) => api.deleteOrder(orderId),
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
    mutationFn: ({ orderId, data }: { orderId: string; data: Parameters<typeof api.addOrderEvent>[1] }) =>
      api.addOrderEvent(orderId, data),
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
    mutationFn: async (file: File) => {
      await api.uploadFile(file, id!, undefined);
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
    mutationFn: (fileId: string) => api.deleteFile(fileId),
    onSuccess: () => {
      refetchFiles();
      toast({ title: 'Datei gelöscht' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Löschen' });
    },
  });

  if (isLoading) return <div className="text-center py-8">Laden...</div>;
  if (!customer) {
    return <div className="text-center py-8">Kunde nicht gefunden</div>;
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

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: editData.name,
      email: editData.email || null,
      phone: editData.phone || null,
      address: editData.address || null,
      notes: editData.notes || null,
    });
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    createOrderMutation.mutate({
      customerId: id!,
      title: newOrder.title,
      description: newOrder.description || null,
      status: newOrder.status,
      dueDate: newOrder.dueDate ? new Date(newOrder.dueDate).toISOString() : null,
      promisedDeliveryDate: newOrder.promisedDeliveryDate ? new Date(newOrder.promisedDeliveryDate).toISOString() : null,
    });
    // Note: Calendar event and file upload are handled in the mutation
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
      e.target.value = '';
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      addOrderEventMutation.mutate({ orderId: selectedOrder.id, data: newEvent });
    }
  };

  const openOrderDetail = async (order: Order) => {
    const orderResponse = await api.getOrder(order.id);
    if (orderResponse?.success && orderResponse?.data) {
      setSelectedOrder(orderResponse.data);
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      STATUS_CHANGE: 'Statusänderung',
      NOTE: 'Notiz',
      FILE_ADDED: 'Datei hinzugefügt',
      CONTACT: 'Kontakt',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/customers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{customer.name}</h1>
        <Button variant="outline" onClick={handleEdit} className="ml-auto">
          <Pencil className="h-4 w-4 mr-2" />
          Bearbeiten
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Kontaktdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Erstellt am {formatDate(customer.createdAt)}</p>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aufträge ({orders.length})</CardTitle>
            <Dialog open={isOrderOpen} onOpenChange={setIsOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Auftrag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auftrag erstellen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titel *</Label>
                    <Input
                      value={newOrder.title}
                      onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
                      placeholder="z.B. Projekt XY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newOrder.description}
                      onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                      placeholder="Optionale Beschreibung..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newOrder.status}
                      onValueChange={(value) => setNewOrder({ ...newOrder, status: value })}
                    >
                      <SelectTrigger>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fälligkeitsdatum</Label>
                      <Input
                        type="date"
                        value={newOrder.dueDate}
                        onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lieferdatum</Label>
                      <Input
                        type="date"
                        value={newOrder.promisedDeliveryDate}
                        onChange={(e) => setNewOrder({ ...newOrder, promisedDeliveryDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Dokument hochladen</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        id="order-file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setOrderFile(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="order-file"
                        className="flex-1 cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      >
                        {orderFile ? orderFile.name : 'Datei auswählen'}
                      </label>
                      {orderFile && (
                        <Button variant="ghost" size="icon" onClick={() => setOrderFile(null)} type="button">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? 'Erstellen...' : 'Auftrag erstellen'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Noch keine Aufträge vorhanden</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => openOrderDetail(order)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.title}</span>
                        <span className={cn('text-xs px-2 py-1 rounded', getStatusColor(order.status))}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {order.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Fällig: {formatDate(order.dueDate)}
                          </span>
                        )}
                        {order.promisedDeliveryDate && (
                          <span>Lieferung: {formatDate(order.promisedDeliveryDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Files / Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumente & Rechnungen ({files.length})
          </CardTitle>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadFileMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadFileMutation.isPending ? 'Hochladen...' : 'Datei hochladen'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Dokumente hochgeladen</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteFileMutation.mutate(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrder?.title}
              {selectedOrder && (
                <span className={cn('text-sm px-2 py-1 rounded', getStatusColor(selectedOrder.status))}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status ändern</Label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderMutation.mutate({ orderId: selectedOrder.id, data: { status: value } })}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Fälligkeitsdatum</Label>
                  <Input
                    type="date"
                    value={selectedOrder.dueDate ? selectedOrder.dueDate.split('T')[0] : ''}
                    onChange={(e) => updateOrderMutation.mutate({
                      orderId: selectedOrder.id,
                      data: { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null }
                    })}
                  />
                </div>
              </div>

              {selectedOrder.description && (
                <div>
                  <Label>Beschreibung</Label>
                  <p className="mt-1 text-sm">{selectedOrder.description}</p>
                </div>
              )}

              {/* History / Events */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Verlauf</Label>
                  <Button size="sm" variant="outline" onClick={() => setIsEventOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Eintrag hinzufügen
                  </Button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedOrder.events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Noch kein Verlauf vorhanden</p>
                  ) : (
                    selectedOrder.events.map((event) => (
                      <div key={event.id} className="flex gap-3 p-3 rounded-lg bg-muted">
                        <History className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase">{getEventTypeLabel(event.type)}</span>
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
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => navigate(`/app/orders/${selectedOrder.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Zum Auftrag
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Möchten Sie diesen Auftrag wirklich löschen?')) {
                      deleteOrderMutation.mutate(selectedOrder.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Auftrag löschen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isEventOpen} onOpenChange={setIsEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verlaufseintrag hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="space-y-2">
              <Label>Typ</Label>
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
                      {getEventTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notiz</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newEvent.note}
                onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                placeholder="Notiz eingeben..."
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEventOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={addOrderEventMutation.isPending}>
                {addOrderEventMutation.isPending ? 'Hinzufügen...' : 'Hinzufügen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
