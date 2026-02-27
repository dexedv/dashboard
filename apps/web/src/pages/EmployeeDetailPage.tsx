import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Phone, Cake, Hash } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  const user = usersResponse?.data.find(u => u.id === id);

  if (isLoading) {
    return <div className="p-8">Laden...</div>;
  }

  if (!user) {
    return (
      <div className="p-8">
        <p>Mitarbeiter nicht gefunden</p>
        <button onClick={() => navigate('/app/employees')} className="text-blue-500 hover:underline">
          Zurück zur Mitarbeiterliste
        </button>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    USER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/app/employees')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Mitarbeiterliste
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl">{user.name}</div>
              <span className={`text-sm px-2 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100'}`}>
                {user.role === 'ADMIN' ? 'Administrator' : 'Mitarbeiter'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">E-Mail</p>
              <p>{user.email}</p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p>{user.phone}</p>
              </div>
            </div>
          )}

          {user.birthday && (
            <div className="flex items-center gap-3">
              <Cake className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Geburtstag</p>
                <p>{formatDate(user.birthday)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mitarbeiternummer</p>
              <p>{user.employeeNumber}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Erstellt am: {user.createdAt ? formatDate(user.createdAt) : '-'}
            </p>
            <p className={`text-sm ${user.active ? 'text-green-600' : 'text-red-600'}`}>
              Status: {user.active ? 'Aktiv' : 'Inaktiv'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
