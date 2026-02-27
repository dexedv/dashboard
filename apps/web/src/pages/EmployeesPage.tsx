import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { userRoleColors } from '@dashboard/shared/zod';
import { Mail, Phone, Calendar, Shield, User, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  position?: string;
  active: boolean;
  phone: string | null;
  birthday: string | null;
  employeeNumber: number;
  createdAt?: string;
}

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => api.getEmployees({ q: search || undefined }),
  });

  const users = usersResponse?.data || [];

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'MANAGER') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
        <p className="text-muted-foreground mt-2">Sie müssen Manager oder Administrator sein, um diese Seite anzuzeigen.</p>
      </div>
    );
  }

  const getRoleInfo = (role: string) => {
    return userRoleColors[role as keyof typeof userRoleColors] || userRoleColors.USER;
  };

  const formatBirthday = (birthday: string | null) => {
    if (!birthday) return '-';
    try {
      return format(parseISO(birthday), 'd. MMMM yyyy', { locale: de });
    } catch {
      return birthday;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Teammitglieder</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Mitarbeiter suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keine Mitarbeiter gefunden</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: UserData) => {
            const roleInfo = getRoleInfo(user.role);
            return (
              <Card key={user.id} className={cn(!user.active && 'opacity-60')}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {user.name}
                        <span className="ml-2 text-muted-foreground font-normal">#{user.employeeNumber}</span>
                      </CardTitle>
                      <span className={cn('text-xs px-2 py-1 rounded', roleInfo.bg, roleInfo.text)}>
                        {roleInfo.label}
                      </span>
                    </div>
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
                    {user.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.birthday && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatBirthday(user.birthday)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {user.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Erstellt am {format(parseISO(user.createdAt), 'd. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
