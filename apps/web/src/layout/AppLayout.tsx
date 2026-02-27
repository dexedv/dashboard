import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  LayoutDashboard,
  Home,
  FileText,
  Calendar,
  Users,
  Folder,
  Music,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Shield,
  Key,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Startseite', href: '/app', icon: Home },
  { name: 'Notizen', href: '/app/notes', icon: FileText },
  { name: 'Kalender', href: '/app/calendar', icon: Calendar },
  { name: 'Kunden', href: '/app/customers', icon: Users },
  { name: 'Mitarbeiter', href: '/app/employees', icon: User },
  { name: 'Dateien', href: '/app/files', icon: Folder },
  { name: 'E-Mail', href: '/app/email', icon: Mail },
  { name: 'Spotify', href: '/app/spotify', icon: Music },
  { name: 'WhatsApp', href: '/app/whatsapp', icon: MessageCircle },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', birthday: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => api.updateMe(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setIsProfileOpen(false);
      toast({ title: 'Profil aktualisiert' });
      // Update local user state
      if (response.data) {
        updateUser(response.data);
      }
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Aktualisieren' });
    },
  });

  const openProfile = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthday: user?.birthday ? user.birthday.split('T')[0] : ''
    });
    setIsProfileOpen(true);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-xl border-r shadow-2xl transform transition-transform lg:hidden gradient-mesh',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between p-5 border-b/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Dashboard</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-lg">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <nav className="p-4 space-y-1.5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <div className="pt-4 mt-4 border-t space-y-1.5">
                <Link
                  to="/app/admin/users"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    location.pathname === '/app/admin/users'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Benutzer
                </Link>
                <Link
                  to="/app/admin/permissions"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    location.pathname === '/app/admin/permissions'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  Berechtigungen
                </Link>
                <Link
                  to="/app/admin/licenses"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    location.pathname === '/app/admin/licenses'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Key className="h-5 w-5" />
                  Lizenzen
                </Link>
              </div>
            )}
          </nav>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:border-r lg:bg-card/80 lg:backdrop-blur-xl">
        <div className="flex h-20 items-center gap-3 border-b/50 px-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">Dashboard</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                location.pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t space-y-1.5">
              <Link
                to="/app/admin/users"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname === '/app/admin/users'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                )}
              >
                <Settings className="h-5 w-5" />
                Benutzer
              </Link>
              <Link
                to="/app/admin/permissions"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname === '/app/admin/permissions'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                )}
              >
                <Shield className="h-5 w-5" />
                Berechtigungen
              </Link>
              <Link
                to="/app/admin/licenses"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname === '/app/admin/licenses'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                )}
              >
                <Key className="h-5 w-5" />
                Lizenzen
              </Link>
            </div>
          )}
        </nav>
        <div className="border-t/50 p-4 space-y-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl" title="Design wechseln">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={openProfile} className="rounded-xl" title="Profil bearbeiten">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-xl justify-center" onClick={handleLogout} title="Abmelden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b/50 bg-background/80 backdrop-blur-xl px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="rounded-lg">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold">Dashboard</span>
          <div className="flex gap-1 ml-auto">
            <Button variant="ghost" size="icon" onClick={openProfile} className="rounded-lg">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Geburtstag</Label>
              <Input
                type="date"
                value={profileData.birthday}
                onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
