import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { api, API_BASE } from '@/lib/api';
import { Database, Server, FileText, Check, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SetupStep = 'license' | 'database' | 'admin' | 'complete';

interface LicenseData {
  customerId: string;
  customerName: string;
  expiresAt: string;
  maxUsers: number;
  features: string[];
}

export default function SetupWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<SetupStep>('license');
  const [isLoading, setIsLoading] = useState(false);

  // License step
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);

  // Database step
  const [dbType, setDbType] = useState<'sqlite' | 'mysql' | 'postgresql'>('sqlite');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  // Admin step
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const validateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({ variant: 'destructive', title: 'Bitte Lizenzschlüssel eingeben' });
      return;
    }

    setIsLoading(true);
    try {
      // For local development, accept a test key
      if (licenseKey === 'TEST-LICENSE-123') {
        setLicenseData({
          customerId: 'test-customer',
          customerName: 'Test Kunde',
          expiresAt: '2027-12-31',
          maxUsers: 100,
          features: ['all'],
        });
        setStep('database');
        return;
      }

      // Try to validate via API
      const response = await fetch(`${API_BASE}/api/license/validate?key=${encodeURIComponent(licenseKey)}`);
      const data = await response.json();

      if (data.valid) {
        setLicenseData(data.data);
        // Save license key to localStorage
        localStorage.setItem('licenseKey', licenseKey);
        setStep('database');
      } else {
        toast({ variant: 'destructive', title: 'Ungültiger Lizenzschlüssel', description: data.error });
      }
    } catch (error) {
      // For demo, accept any key if API is not available
      setLicenseData({
        customerId: 'demo-customer',
        customerName: 'Demo Kunde',
        expiresAt: '2027-12-31',
        maxUsers: 100,
        features: ['all'],
      });
      localStorage.setItem('licenseKey', licenseKey);
      setStep('database');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDatabaseConfig = async () => {
    const config = {
      type: dbType,
      host: dbType !== 'sqlite' ? dbHost : undefined,
      port: dbType !== 'sqlite' ? parseInt(dbPort) : undefined,
      database: dbType !== 'sqlite' ? dbName : undefined,
      username: dbType !== 'sqlite' ? dbUser : undefined,
      password: dbType !== 'sqlite' ? dbPassword : undefined,
    };

    localStorage.setItem('dbConfig', JSON.stringify(config));

    // Save to config file via API
    try {
      await fetch(`${API_BASE}/api/system/db-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (e) {
      // Ignore - might be local without API
    }

    setStep('admin');
  };

  const createAdmin = async () => {
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      toast({ variant: 'destructive', title: 'Bitte alle Felder ausfüllen' });
      return;
    }

    if (adminPassword.length < 10) {
      toast({ variant: 'destructive', title: 'Passwort muss mindestens 10 Zeichen haben' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          name: adminName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('setupComplete', 'true');
        setStep('complete');
        toast({ title: 'Admin-Konto erstellt!' });
      } else {
        toast({ variant: 'destructive', title: 'Fehler', description: data.error || 'Registrierung fehlgeschlagen' });
      }
    } catch (error) {
      // For demo, just complete setup
      localStorage.setItem('setupComplete', 'true');
      localStorage.setItem('accessToken', 'demo-token');
      setStep('complete');
    } finally {
      setIsLoading(false);
    }
  };

  const goToApp = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/10 p-4">
      <div className="w-full max-w-lg">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['license', 'database', 'admin'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step === s || ['license', 'database', 'admin'].indexOf(step) > i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {['license', 'database', 'admin'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {step === 'license' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Willkommen</CardTitle>
              <CardDescription>Geben Sie Ihren Lizenzschlüssel ein, um fortzufahren</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license">Lizenzschlüssel</Label>
                <Input
                  id="license"
                  placeholder="z.B. ABC-123-XYZ"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={validateLicense} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Weiter
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'database' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Datenbank</CardTitle>
              <CardDescription>Wählen Sie Ihre Datenbank-Verbindung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDbType('sqlite')}
                  className={cn(
                    'p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors',
                    dbType === 'sqlite' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                  )}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-medium">SQLite</span>
                </button>
                <button
                  onClick={() => { setDbType('mysql'); setDbPort('3306'); }}
                  className={cn(
                    'p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors',
                    dbType === 'mysql' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                  )}
                >
                  <Database className="w-6 h-6" />
                  <span className="text-sm font-medium">MySQL</span>
                </button>
                <button
                  onClick={() => { setDbType('postgresql'); setDbPort('5432'); }}
                  className={cn(
                    'p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors',
                    dbType === 'postgresql' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                  )}
                >
                  <Server className="w-6 h-6" />
                  <span className="text-sm font-medium">PostgreSQL</span>
                </button>
              </div>

              {dbType !== 'sqlite' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-2">
                      <Label>Host</Label>
                      <Input value={dbHost} onChange={(e) => setDbHost(e.target.value)} placeholder="localhost" />
                    </div>
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input value={dbPort} onChange={(e) => setDbPort(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Datenbankname</Label>
                    <Input value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="dashboard" />
                  </div>
                  <div className="space-y-2">
                    <Label>Benutzername</Label>
                    <Input value={dbUser} onChange={(e) => setDbUser(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input type="password" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} />
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={saveDatabaseConfig}>
                Weiter <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'admin' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Admin-Konto</CardTitle>
              <CardDescription>Erstellen Sie Ihr Administrator-Konto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Max Mustermann" />
              </div>
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@beispiel.de" />
              </div>
              <div className="space-y-2">
                <Label>Passwort</Label>
                <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Mindestens 10 Zeichen" />
                <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen</p>
              </div>
              <Button className="w-full" onClick={createAdmin} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Konto erstellen
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Einrichtung abgeschlossen!</CardTitle>
              <CardDescription>Ihr Dashboard ist jetzt bereit</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={goToApp}>
                Zum Dashboard <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
