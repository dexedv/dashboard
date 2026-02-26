import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Mail, Inbox, Send, Trash2, Folder, FolderOpen, Settings,
  PenLine, Paperclip, ChevronRight, ChevronDown, RefreshCw,
  ArrowLeft, Search, User, Plus, Users
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Email {
  id: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  seen: boolean;
  hasAttachments: boolean;
}

interface Folder {
  name: string;
  path: string;
  children: Folder[];
}

interface EmailDetail {
  id: number;
  subject: string;
  from: string;
  to: string;
  cc: string[];
  bcc: string[];
  date: string;
  body: string;
  text: string;
  html: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export default function EmailPage() {
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: '',
  });
  const [settingsData, setSettingsData] = useState({
    email: '',
    imapHost: 'imap.example.com',
    imapPort: '993',
    imapSecure: true,
    smtpHost: 'smtp.example.com',
    smtpPort: '465',
    smtpSecure: true,
    username: '',
    password: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get email account
  const { data: accountResponse, isLoading: accountLoading } = useQuery({
    queryKey: ['email-account'],
    queryFn: () => api.getEmailAccount(),
  });

  const account = accountResponse?.data;

  // Get employees for CC
  const { data: employeesResponse } = useQuery({
    queryKey: ['users-with-email'],
    queryFn: () => api.getUsersWithEmail(),
    enabled: !!account,
  });

  const employees = employeesResponse?.data || [];

  // Get folders
  const { data: foldersResponse, isLoading: foldersLoading, refetch: refetchFolders } = useQuery({
    queryKey: ['email-folders'],
    queryFn: () => api.getEmailFolders(),
    enabled: !!account,
  });

  const folders = foldersResponse?.data || [];

  // Get emails
  const { data: emailsResponse, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: ['emails', currentFolder],
    queryFn: () => api.getEmails(currentFolder),
    enabled: !!account,
  });

  const emails = emailsResponse?.data?.emails || [];

  // Setup email account mutation
  const setupMutation = useMutation({
    mutationFn: () => api.setupEmailAccount({
      email: settingsData.email,
      imapHost: settingsData.imapHost,
      imapPort: parseInt(settingsData.imapPort),
      imapSecure: settingsData.imapSecure,
      smtpHost: settingsData.smtpHost,
      smtpPort: parseInt(settingsData.smtpPort),
      smtpSecure: settingsData.smtpSecure,
      username: settingsData.username,
      password: settingsData.password,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-account'] });
      queryClient.invalidateQueries({ queryKey: ['email-folders'] });
      setIsSettingsOpen(false);
      toast({ title: 'E-Mail-Konto eingerichtet' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Einrichtungsfehler', description: err.message });
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteEmailAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-account'] });
      toast({ title: 'E-Mail-Konto entfernt' });
    },
  });

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: () => api.sendEmail({
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      cc: composeData.cc || undefined,
      bcc: composeData.bcc || undefined,
    }),
    onSuccess: () => {
      setIsComposing(false);
      setComposeData({ to: '', subject: '', body: '', cc: '', bcc: '' });
      refetchFolders();
      toast({ title: 'E-Mail gesendet' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Sendefehler', description: err.message });
    },
  });

  const handleSelectEmail = async (email: Email) => {
    const response = await api.getEmail(currentFolder, email.id);
    setSelectedEmail(response.data);
  };

  // Render folder tree
  const renderFolders = (folders: Folder[], level = 0) => {
    return folders.map((folder) => (
      <div key={folder.path}>
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
            currentFolder === folder.path
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            setCurrentFolder(folder.path);
            setSelectedEmail(null);
          }}
        >
          {currentFolder === folder.path ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
          <span className="truncate">{folder.name}</span>
        </button>
        {folder.children && folder.children.length > 0 && renderFolders(folder.children, level + 1)}
      </div>
    ));
  };

  // No account - show setup
  if (!account && !accountLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Konto einrichten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Richten Sie Ihr E-Mail-Konto ein, um E-Mails abzurufen und zu senden.
            </p>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>E-Mail-Adresse</Label>
                  <Input
                    type="email"
                    placeholder="ihre@email.de"
                    value={settingsData.email}
                    onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Benutzername</Label>
                  <Input
                    placeholder="benutzer oder volle E-Mail"
                    value={settingsData.username}
                    onChange={(e) => setSettingsData({ ...settingsData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Passwort</Label>
                <Input
                  type="password"
                  placeholder="Passwort oder App-Passwort"
                  value={settingsData.password}
                  onChange={(e) => setSettingsData({ ...settingsData, password: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>IMAP-Server</Label>
                  <Input
                    placeholder="imap.example.com"
                    value={settingsData.imapHost}
                    onChange={(e) => setSettingsData({ ...settingsData, imapHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IMAP-Port</Label>
                  <Input
                    type="number"
                    placeholder="993"
                    value={settingsData.imapPort}
                    onChange={(e) => setSettingsData({ ...settingsData, imapPort: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="imapSecure"
                  checked={settingsData.imapSecure}
                  onChange={(e) => setSettingsData({ ...settingsData, imapSecure: e.target.checked })}
                />
                <Label htmlFor="imapSecure" className="font-normal">IMAP mit SSL/TLS (empfohlen)</Label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP-Server</Label>
                  <Input
                    placeholder="smtp.example.com"
                    value={settingsData.smtpHost}
                    onChange={(e) => setSettingsData({ ...settingsData, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP-Port</Label>
                  <Input
                    type="number"
                    placeholder="465"
                    value={settingsData.smtpPort}
                    onChange={(e) => setSettingsData({ ...settingsData, smtpPort: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={settingsData.smtpSecure}
                  onChange={(e) => setSettingsData({ ...settingsData, smtpSecure: e.target.checked })}
                />
                <Label htmlFor="smtpSecure" className="font-normal">SMTP mit SSL/TLS (empfohlen)</Label>
              </div>

              <Button
                className="w-full"
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending || !settingsData.email || !settingsData.username || !settingsData.password}
              >
                {setupMutation.isPending ? 'Einrichten...' : 'Konto einrichten'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (accountLoading || foldersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar - Folders */}
      <div className="w-64 flex-shrink-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mail
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  refetchFolders();
                  refetchEmails();
                }}
                title="Aktualisieren"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                title="Einstellungen"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <Button
              className="w-full mb-4"
              onClick={() => setIsComposing(true)}
            >
              <PenLine className="h-4 w-4 mr-2" />
              Verfassen
            </Button>

            <div className="space-y-1">
              {renderFolders(folders)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email List */}
      <div className="w-80 flex-shrink-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {currentFolder.split('/').pop() || currentFolder}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {emailsLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine E-Mails
              </div>
            ) : (
              <div className="divide-y">
                {emails.map((email) => (
                  <button
                    key={email.id}
                    className={cn(
                      'w-full text-left p-3 hover:bg-accent transition-colors',
                      selectedEmail?.id === email.id && 'bg-accent',
                      !email.seen && 'bg-blue-50 dark:bg-blue-950/30'
                    )}
                    onClick={() => handleSelectEmail(email)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn('truncate text-sm', !email.seen && 'font-semibold')}>
                          {email.from.split('<')[0] || email.from}
                        </p>
                        <p className={cn('truncate text-xs', !email.seen && 'font-medium')}>
                          {email.subject || '(Kein Betreff)'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {email.date ? formatDate(email.date) : ''}
                        </p>
                      </div>
                      {email.hasAttachments && (
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Detail */}
      <div className="flex-1">
        <Card className="h-full flex flex-col">
          {selectedEmail ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{selectedEmail.subject || '(Kein Betreff)'}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <User className="h-4 w-4" />
                      <span>{selectedEmail.from}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedEmail.date} an {selectedEmail.to}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setComposeData({
                          to: selectedEmail.from.split('<')[1]?.replace('>', '') || selectedEmail.from,
                          subject: selectedEmail.subject ? `Re: ${selectedEmail.subject}` : '',
                          body: '',
                          cc: '',
                          bcc: '',
                        });
                        setIsComposing(true);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Antworten
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setSelectedEmail(null)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {selectedEmail.html ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">{selectedEmail.text || selectedEmail.body}</pre>
                )}

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Anhänge</h4>
                    <div className="space-y-1">
                      {selectedEmail.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Paperclip className="h-4 w-4" />
                          <span>{att.filename}</span>
                          <span className="text-muted-foreground">({Math.round(att.size / 1024)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              E-Mail auswählen
            </div>
          )}
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue E-Mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>An</Label>
              <Input
                type="email"
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                placeholder="empfaenger@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CC</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={composeData.cc}
                    onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const employee = employees.find((e: any) => e.email === value);
                      if (employee) {
                        const currentCc = composeData.cc ? `${composeData.cc}, ${value}` : value;
                        setComposeData({ ...composeData, cc: currentCc });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[50px] h-10">
                      <Users className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.email}>
                          {employee.name || employee.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>BCC</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const employee = employees.find((e: any) => e.email === value);
                      if (employee) {
                        const currentBcc = composeData.bcc ? `${composeData.bcc}, ${value}` : value;
                        setComposeData({ ...composeData, bcc: currentBcc });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[50px] h-10">
                      <Users className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.email}>
                          {employee.name || employee.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Betreff</Label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nachricht</Label>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-md"
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsComposing(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending || !composeData.to || !composeData.subject}
              >
                {sendMutation.isPending ? 'Senden...' : 'Senden'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Mail-Konto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{account?.email}</p>
              <p className="text-sm text-muted-foreground">Verbunden mit {account?.imapHost}</p>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (confirm('Möchten Sie das E-Mail-Konto entfernen?')) {
                  deleteMutation.mutate();
                  setIsSettingsOpen(false);
                }
              }}
            >
              Konto entfernen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
