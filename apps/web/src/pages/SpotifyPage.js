import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Play, Music, LogOut } from 'lucide-react';
export default function SpotifyPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
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
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim())
            return;
        setIsSearching(true);
        try {
            const { data } = await api.spotifySearch(searchQuery);
            setSearchResults(data.tracks?.items || []);
        }
        catch (error) {
            toast({ variant: 'destructive', title: 'Search failed' });
        }
        finally {
            setIsSearching(false);
        }
    };
    const handlePlay = (uri) => {
        // Open in Spotify web player or desktop app
        window.open(`https://open.spotify.com/track/${uri.split(':')[2]}`, '_blank');
        setIsPlaying(true);
    };
    const isConnected = spotifyMeResponse?.data?.connected;
    if (isConnected === undefined) {
        return _jsx("div", { className: "text-center py-8", children: "Loading..." });
    }
    if (!isConnected) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] space-y-6", children: [_jsx("div", { className: "p-8 bg-[#1DB954] rounded-full", children: _jsx(Music, { className: "h-16 w-16 text-white" }) }), _jsx("h1", { className: "text-3xl font-bold", children: "Connect Spotify" }), _jsx("p", { className: "text-muted-foreground text-center max-w-md", children: "Connect your Spotify account to search for music and view your playlists." }), _jsx(Button, { size: "lg", className: "bg-[#1DB954] hover:bg-[#1ed760]", onClick: () => connectMutation.mutate(), children: "Connect Spotify" })] }));
    }
    const user = spotifyMeResponse?.data?.user;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "p-3 bg-[#1DB954] rounded-full", children: _jsx(Music, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Spotify" }), user && (_jsx("p", { className: "text-muted-foreground", children: user.display_name }))] })] }), _jsxs(Button, { variant: "outline", onClick: () => disconnectMutation.mutate(), children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), "Disconnect"] })] }), _jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [_jsx(Input, { placeholder: "Search for tracks, artists...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "flex-1" }), _jsxs(Button, { type: "submit", disabled: isSearching, children: [_jsx(Search, { className: "h-4 w-4 mr-2" }), "Search"] })] }), searchResults.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Search Results" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: searchResults.map((track) => (_jsxs("div", { className: "flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors", children: [_jsx("img", { src: track.album.images[2]?.url || track.album.images[0]?.url, alt: track.album.name, className: "w-12 h-12 rounded" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium truncate", children: track.name }), _jsx("p", { className: "text-sm text-muted-foreground truncate", children: track.artists.map((a) => a.name).join(', ') })] }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => handlePlay(track.uri), children: _jsx(Play, { className: "h-4 w-4" }) })] }, track.id))) }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Your Playlists" }) }), _jsx(CardContent, { children: playlists.length === 0 ? (_jsx("p", { className: "text-muted-foreground", children: "No playlists found" })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: playlists.map((playlist) => (_jsxs("div", { className: "p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer", children: [playlist.images[0] && (_jsx("img", { src: playlist.images[0].url, alt: playlist.name, className: "w-full aspect-square object-cover rounded-md mb-3" })), _jsx("p", { className: "font-medium truncate", children: playlist.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [playlist.tracks.total, " tracks"] })] }, playlist.id))) })) })] })] }));
}
