import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        await register(email, password, name);
        toast({ title: 'Konto erstellt! Willkommen im Dashboard.' });
      } else {
        await login(email, password);
      }
      navigate('/app');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isRegisterMode ? 'Registrierung fehlgeschlagen' : 'Anmeldung fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Ungültige Anmeldedaten',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Dashboard Suite</CardTitle>
          <CardDescription>
            {isRegisterMode ? 'Erstellen Sie ein neues Konto' : 'Geben Sie Ihre Zugangsdaten ein'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ihr Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegisterMode}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isRegisterMode ? 10 : 1}
              />
              {isRegisterMode && (
                <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? (isRegisterMode ? 'Konto wird erstellt...' : 'Anmelden...')
                : (isRegisterMode ? 'Konto erstellen' : 'Anmelden')
              }
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-sm"
            >
              {isRegisterMode
                ? 'Bereits ein Konto? Anmelden'
                : 'Noch kein Konto? Registrieren'
              }
            </Button>
          </div>

          {!isRegisterMode && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Admin-Zugang: admin@dashboard.local / admin123456</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
