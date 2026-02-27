import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { API_BASE } from '@/lib/api';

interface SystemStatus {
  api: string;
  database: string;
  version: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    // Fetch system status on mount
    fetchSystemStatus();
  }, []);

  // Fetch system status
  const fetchSystemStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      setSystemStatus(data);
    } catch {
      setSystemStatus({ api: 'error', database: 'error', version: '1.0.0' });
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleSystemStatus = () => {
    if (!systemStatusOpen) {
      fetchSystemStatus();
    }
    setSystemStatusOpen(!systemStatusOpen);
  };

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

      // Remember email if checkbox is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
      <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent rotate-12" />

      <div className="relative z-10 w-full max-w-md p-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/25 mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">Dashboard Suite</h1>
          <p className="text-muted-foreground mt-2">
            {isRegisterMode ? 'Erstellen Sie ein neues Konto' : 'Willkommen zurück'}
          </p>
        </div>

        <Card className="shadow-2xl shadow-black/5 border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="h-11"
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
                  className="h-11"
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
                  className="h-11"
                />
                {isRegisterMode && (
                  <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen</p>
                )}
              </div>

              {!isRegisterMode && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Angemeldet bleiben
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading
                  ? (isRegisterMode ? 'Konto wird erstellt...' : 'Anmelden...')
                  : (isRegisterMode ? 'Konto erstellen' : 'Anmelden')
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {isRegisterMode
                  ? 'Bereits ein Konto? Anmelden'
                  : 'Noch kein Konto? Registrieren'
                }
              </Button>
            </div>

            {!isRegisterMode && (
              <div className="mt-4">
                {/* System Status Dropdown */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSystemStatus}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="text-sm">Systemstatus</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${systemStatus?.services?.api === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`w-2 h-2 rounded-full ${systemStatus?.services?.database === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <svg
                        className={`w-4 h-4 transition-transform ${systemStatusOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </Button>

                  {systemStatusOpen && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-card border rounded-lg shadow-lg p-3 z-50">
                      {statusLoading ? (
                        <div className="text-xs text-muted-foreground">Lädt...</div>
                      ) : systemStatus ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">API</span>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${systemStatus.services?.api === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-xs">{systemStatus.services?.api === 'ok' ? 'Verbunden' : 'Fehler'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Datenbank</span>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${systemStatus.services?.database === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-xs">{systemStatus.services?.database === 'ok' ? 'Verbunden' : 'Fehler'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Version</span>
                            <span className="text-xs">{systemStatus.version || '1.0.0'}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Updates</span>
                            <span className="text-xs text-green-500">Aktuell</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-red-500">Keine Verbindung</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
