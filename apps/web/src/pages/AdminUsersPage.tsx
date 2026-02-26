import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, User, Mail, Shield, Trash2, Pencil } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  const users = usersResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: typeof newUser) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
      setNewUser({ email: '', password: '', name: '', role: 'USER' });
      toast({ title: 'Benutzer erstellt' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; active?: boolean; name?: string; email?: string } }) =>
      api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast({ title: 'Benutzer aktualisiert' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Aktualisieren' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Benutzer gelöscht' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Löschen' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newUser);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          name: editForm.name,
          email: editForm.email,
        },
      });
    }
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email });
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
        <p className="text-muted-foreground mt-2">Sie müssen Admin sein, um diese Seite anzuzeigen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Benutzer hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzer erstellen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>E-Mail *</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Passwort * (min. 10 Zeichen)</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  minLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUEST">Gast</SelectItem>
                    <SelectItem value="USER">Benutzer</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Benutzer erstellen</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keine Benutzer gefunden</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: UserData) => (
            <Card key={user.id} className={cn(!user.active && 'opacity-60')}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                {user.role === 'ADMIN' && (
                  <Shield className="h-5 w-5 text-primary" />
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'GUEST' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    )}>
                      {user.role === 'ADMIN' ? 'Administrator' :
                       user.role === 'MANAGER' ? 'Manager' :
                       user.role === 'GUEST' ? 'Gast' : 'Benutzer'}
                    </span>
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    )}>
                      {user.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Erstellt am {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Select
                    value={user.role}
                    onValueChange={(value) => {
                      updateMutation.mutate({ id: user.id, data: { role: value } });
                    }}
                    disabled={user.id === currentUser?.id}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUEST">Gast</SelectItem>
                      <SelectItem value="USER">Benutzer</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateMutation.mutate({ id: user.id, data: { active: !user.active } });
                    }}
                    disabled={user.id === currentUser?.id}
                  >
                    {user.active ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Möchten Sie ${user.name} wirklich löschen?`)) {
                        deleteMutation.mutate(user.id);
                      }
                    }}
                    disabled={user.id === currentUser?.id}
                    title={user.id === currentUser?.id ? 'Sie können sich selbst nicht löschen' : 'Löschen'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Speichern</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
