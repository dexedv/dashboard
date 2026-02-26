import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Pin, Trash2, FileText } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notesResponse, isLoading } = useQuery({
    queryKey: ['notes', search],
    queryFn: () => api.getNotes({ q: search || undefined }),
  });

  const notes = notesResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; tags: string[] }) =>
      api.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsCreateOpen(false);
      setNewNote({ title: '', content: '', tags: '' });
      toast({ title: 'Notiz erstellt' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Fehler beim Erstellen' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> }) =>
      api.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (selectedNote) {
        api.getNote(selectedNote.id).then((res) => {
          if (res.success) setSelectedNote(res.data);
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNote(null);
      toast({ title: 'Notiz gelöscht' });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: (id: string) => api.togglePinNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleSave = () => {
    if (selectedNote) {
      updateMutation.mutate({
        id: selectedNote.id,
        data: { content: selectedNote.content, title: selectedNote.title },
      });
    }
  };

  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Notes List */}
      <div className="w-80 flex flex-col border-r pr-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Notizen durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notiz erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Notiz-Titel"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inhalt</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Notiz-Inhalt..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (kommagetrennt)</Label>
                  <Input
                    value={newNote.tags}
                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                    placeholder="tag1, tag2"
                  />
                </div>
                <Button type="submit" className="w-full">Erstellen</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Noch keine Notizen</p>
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Angepinnt</p>
                  {pinnedNotes.map((note: Note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      isSelected={selectedNote?.id === note.id}
                      onClick={() => setSelectedNote(note)}
                      onTogglePin={() => togglePinMutation.mutate(note.id)}
                    />
                  ))}
                </>
              )}
              {unpinnedNotes.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mb-1 mt-2">Notizen</p>
                  {unpinnedNotes.map((note: Note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      isSelected={selectedNote?.id === note.id}
                      onClick={() => setSelectedNote(note)}
                      onTogglePin={() => togglePinMutation.mutate(note.id)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1">
        {selectedNote ? (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <Input
                value={selectedNote.title}
                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                onBlur={handleSave}
                className="text-xl font-bold border-0 px-0 focus-visible:ring-0"
                placeholder="Notiz-Titel"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePinMutation.mutate(selectedNote.id)}
              >
                <Pin className={cn('h-4 w-4', selectedNote.pinned && 'fill-current')} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm('Diese Notiz löschen?')) {
                    deleteMutation.mutate(selectedNote.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-[calc(100%-2rem)] min-h-[300px] resize-none border-0 focus-visible:ring-0 bg-transparent"
                value={selectedNote.content}
                onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                onBlur={handleSave}
                placeholder="Beginne zu schreiben..."
              />
              <div className="flex gap-2 mt-2">
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-secondary px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Aktualisiert {formatDate(selectedNote.updatedAt)}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Wähle eine Notiz zum Anzeigen oder Bearbeiten</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteItem({
  note,
  isSelected,
  onClick,
  onTogglePin,
}: {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-accent'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{note.title || 'Ohne Titel'}</p>
          <p className="text-sm text-muted-foreground truncate">
            {note.content.slice(0, 50) || 'Kein Inhalt'}
          </p>
        </div>
        {note.pinned && (
          <Pin className="h-4 w-4 fill-current flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
