import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Play, Pause, Music, User, LogOut } from 'lucide-react';

export default function SpotifyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: spotifyMeResponse } = useQuery({
    queryKey: ['spotify-me'],
    queryFn: () => api.getSpotifyMe(),
  });

  const { data: playlistsResponse } = useQuery({
    queryKey: ['spotify-playlists'],
    queryFn: () => api.getSpotifyPlaylists(),
    enabled: spotifyMeResponse?.data?.connected === true,
  });

  const playlists = playlistsResponse?.data || [];

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.getSpotifyAuthUrl();
      window.location.href = data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.disconnectSpotify(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotify-me'] });
      queryClient.invalidateQueries({ queryKey: ['spotify-playlists'] });
      toast({ title: 'Spotify disconnected' });
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data } = await api.spotifySearch(searchQuery);
      setSearchResults(data.tracks?.items || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlay = (uri: string) => {
    // Open in Spotify web player or desktop app
    window.open(`https://open.spotify.com/track/${uri.split(':')[2]}`, '_blank');
    setIsPlaying(true);
  };

  const isConnected = spotifyMeResponse?.data?.connected;

  if (isConnected === undefined) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-8 bg-[#1DB954] rounded-full">
          <Music className="h-16 w-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Connect Spotify</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Connect your Spotify account to search for music and view your playlists.
        </p>
        <Button
          size="lg"
          className="bg-[#1DB954] hover:bg-[#1ed760]"
          onClick={() => connectMutation.mutate()}
        >
          Connect Spotify
        </Button>
      </div>
    );
  }

  const user = spotifyMeResponse?.data?.user;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1DB954] rounded-full">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Spotify</h1>
            {user && (
              <p className="text-muted-foreground">{user.display_name}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => disconnectMutation.mutate()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search for tracks, artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <img
                    src={track.album.images[2]?.url || track.album.images[0]?.url}
                    alt={track.album.name}
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artists.map((a: any) => a.name).join(', ')}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handlePlay(track.uri)}>
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Playlists</CardTitle>
        </CardHeader>
        <CardContent>
          {playlists.length === 0 ? (
            <p className="text-muted-foreground">No playlists found</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.map((playlist: any) => (
                <div
                  key={playlist.id}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  {playlist.images[0] && (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-full aspect-square object-cover rounded-md mb-3"
                    />
                  )}
                  <p className="font-medium truncate">{playlist.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {playlist.tracks.total} tracks
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
