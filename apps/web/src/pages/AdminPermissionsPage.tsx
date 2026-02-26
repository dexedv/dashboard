import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { User, Shield, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const categoryLabels: Record<string, string> = {
  orders: 'Aufträge',
  customers: 'Kunden',
  employees: 'Mitarbeiter',
  calendar: 'Kalender',
  notes: 'Notizen',
  files: 'Dateien',
  home: 'Startseite',
  spotify: 'Spotify',
  admin: 'Administration',
};

export default function AdminPermissionsPage() {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(categoryLabels)));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all permissions
  const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.getPermissions(),
  });

  // Get all users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  // Get selected user's permissions
  const { data: userPermissionsResponse, isLoading: userPermsLoading } = useQuery({
    queryKey: ['userPermissions', selectedUserId],
    queryFn: () => selectedUserId ? api.getUserPermissions(selectedUserId) : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedUserId,
  });

  const permissions = permissionsResponse?.data?.all || [];
  const permissionsGrouped = permissionsResponse?.data?.grouped || {};
  const users = usersResponse?.data || [];
  const userPermissions = userPermissionsResponse?.data || [];

  // Set selected permissions when user permissions load
  useState(() => {
    if (userPermissions.length > 0) {
      setSelectedPermissions(new Set(userPermissions.map((p: Permission) => p.name)));
    } else {
      setSelectedPermissions(new Set());
    }
  });

  // Update selected permissions when data changes
  if (userPermissionsResponse && selectedUserId) {
    const permSet = new Set(userPermissions.map((p: Permission) => p.name));
    if (JSON.stringify([...permSet]) !== JSON.stringify([...selectedPermissions])) {
      setSelectedPermissions(permSet);
    }
  }

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      api.setUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', selectedUserId] });
      toast({ title: 'Berechtigungen gespeichert' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Speichern' });
    },
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionName: string) => {
    const newPerms = new Set(selectedPermissions);
    if (newPerms.has(permissionName)) {
      newPerms.delete(permissionName);
    } else {
      newPerms.add(permissionName);
    }
    setSelectedPermissions(newPerms);
  };

  const selectAllInCategory = (category: string, granted: boolean) => {
    const categoryPerms = permissionsGrouped[category] || [];
    const newPerms = new Set(selectedPermissions);
    categoryPerms.forEach((p: Permission) => {
      if (granted) {
        newPerms.add(p.name);
      } else {
        newPerms.delete(p.name);
      }
    });
    setSelectedPermissions(newPerms);
  };

  const handleSave = () => {
    if (selectedUserId) {
      updatePermissionsMutation.mutate({
        userId: selectedUserId,
        permissions: [...selectedPermissions],
      });
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
        <p className="text-muted-foreground mt-2">Sie müssen Admin sein, um diese Seite anzuzeigen.</p>
      </div>
    );
  }

  if (permissionsLoading || usersLoading) {
    return <div className="text-center py-8 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Berechtigungen</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Mitarbeiter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((user: UserData) => (
              <Button
                key={user.id}
                variant={selectedUserId === user.id ? 'default' : 'ghost'}
                className="w-full justify-start text-left"
                onClick={() => {
                  setSelectedUserId(user.id);
                  // Reset permissions for new user
                  const userPerms = userPermissionsResponse?.data || [];
                  setSelectedPermissions(new Set(userPerms.map((p: Permission) => p.name)));
                }}
              >
                <span className="truncate">{user.name}</span>
                {user.role === 'ADMIN' && <Shield className="h-4 w-4 ml-auto" />}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Permissions Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Berechtigungen
              {selectedUserId && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {users.find((u: UserData) => u.id === selectedUserId)?.name}
                </span>
              )}
            </CardTitle>
            {selectedUserId && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updatePermissionsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedUserId ? (
              <div className="text-center py-8 text-muted-foreground">
                Wählen Sie einen Mitarbeiter aus, um dessen Berechtigungen zu verwalten.
              </div>
            ) : userPermsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laden...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(categoryLabels).map(([category, label]) => (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    <Button
                      variant="ghost"
                      className="w-full justify-between font-medium"
                      onClick={() => toggleCategory(category)}
                    >
                      <span>{label}</span>
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedCategories.has(category) && (
                      <div className="p-3 bg-muted/30 border-t">
                        <div className="flex gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllInCategory(category, true)}
                          >
                            Alle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllInCategory(category, false)}
                          >
                            Keine
                          </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {(permissionsGrouped[category] || []).map((perm: Permission) => (
                            <div
                              key={perm.id}
                              className="flex items-start gap-2 p-2 rounded hover:bg-muted/50"
                            >
                              <Checkbox
                                id={perm.name}
                                checked={selectedPermissions.has(perm.name)}
                                onCheckedChange={() => togglePermission(perm.name)}
                              />
                              <label
                                htmlFor={perm.name}
                                className="text-sm cursor-pointer flex-1"
                              >
                                <div className="font-medium">
                                  {perm.name.split('.')[1]}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {perm.description}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
