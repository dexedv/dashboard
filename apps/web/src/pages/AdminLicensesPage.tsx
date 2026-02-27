import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Key, Copy, Calendar, Users, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminLicensesPage() {
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLicense, setNewLicense] = useState({
    customerId: '',
    customerName: '',
    expiresAt: '',
    maxUsers: 10,
    features: 'all',
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: licenseStatus, isLoading } = useQuery({
    queryKey: ['licenseStatus'],
    queryFn: () => api.getLicenseStatus(),
    enabled: currentUser?.role === 'ADMIN',
  });

  const generateMutation = useMutation({
    mutationFn: (data: typeof newLicense) => api.generateLicense({
      customerId: data.customerId,
      customerName: data.customerName,
      expiresAt: data.expiresAt,
      maxUsers: data.maxUsers,
      features: data.features === 'all' ? ['all'] : data.features.split(',').map(f => f.trim()),
    }),
    onSuccess: (data) => {
      setGeneratedKey(data.licenseKey);
      queryClient.invalidateQueries({ queryKey: ['licenseStatus'] });
      toast({ title: 'Lizenzschlüssel generiert und gespeichert' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler bei der Generierung' });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(newLicense);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'In die Zwischenablage kopiert' });
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
        <h1 className="text-3xl font-bold">Lizenzverwaltung</h1>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Alle Lizenzen</TabsTrigger>
          <TabsTrigger value="generate">Neue Lizenz erstellen</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Alle Lizenzen</CardTitle>
              <CardDescription>Übersicht aller erstellten Lizenzen</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Laden...</p>
              ) : licenseStatus?.licenses && licenseStatus.licenses.length > 0 ? (
                <div className="space-y-4">
                  {licenseStatus.licenses.map((license) => (
                    <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{license.customerName}</span>
                          {license.active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ID: {license.customerId} • Ablauf: {formatDate(license.expiresAt)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {license.key.substring(0, 50)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(license.key)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Kopieren
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Keine Lizenzen vorhanden</p>
              )}

              {licenseStatus?.activeLicense && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800">Aktive Lizenz</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Kunde:</span>{' '}
                      <span className="font-medium">{licenseStatus.activeLicense.customerName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Benutzer:</span>{' '}
                      <span className="font-medium">{licenseStatus.currentUsers} / {licenseStatus.activeLicense.maxUsers}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ablauf:</span>{' '}
                      <span className="font-medium">{formatDate(licenseStatus.activeLicense.expiresAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Neue Lizenz erstellen</CardTitle>
              <CardDescription>Generieren Sie einen neuen Lizenzschlüssel für einen Kunden</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Lizenzschlüssel generieren
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Lizenz erstellen</DialogTitle>
                  </DialogHeader>
                  {generatedKey ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <Label className="text-muted-foreground">Lizenzschlüssel</Label>
                        <p className="font-mono text-sm break-all mt-1">{generatedKey}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => copyToClipboard(generatedKey)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Kopieren
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => {
                            setGeneratedKey(null);
                            setIsCreateOpen(false);
                            setNewLicense({
                              customerId: '',
                              customerName: '',
                              expiresAt: '',
                              maxUsers: 10,
                              features: 'all',
                            });
                          }}
                        >
                          Schließen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleGenerate} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Kunden-ID *</Label>
                        <Input
                          value={newLicense.customerId}
                          onChange={(e) => setNewLicense({ ...newLicense, customerId: e.target.value })}
                          placeholder="z.B. kunde-001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kundenname *</Label>
                        <Input
                          value={newLicense.customerName}
                          onChange={(e) => setNewLicense({ ...newLicense, customerName: e.target.value })}
                          placeholder="z.B. Firma XYZ GmbH"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ablaufdatum *</Label>
                        <Input
                          type="date"
                          value={newLicense.expiresAt}
                          onChange={(e) => setNewLicense({ ...newLicense, expiresAt: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max. Benutzer</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          value={newLicense.maxUsers}
                          onChange={(e) => setNewLicense({ ...newLicense, maxUsers: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Features</Label>
                        <Input
                          value={newLicense.features}
                          onChange={(e) => setNewLicense({ ...newLicense, features: e.target.value })}
                          placeholder="all oder comma-getrennt: feature1,feature2"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                        {generateMutation.isPending ? 'Generiere...' : 'Lizenzschlüssel generieren'}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Wie funktioniert das?
                </h4>
                <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
                  <li>Erstellen Sie einen Lizenzschlüssel für Ihren Kunden</li>
                  <li>Der Schlüssel wird automatisch in der Datenbank gespeichert</li>
                  <li>Kopieren Sie den Schlüssel für Ihren Kunden</li>
                  <li>Der Kunde gibt den Schlüssel im Setup-Wizard ein</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
