import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Clock, Calendar, CheckCircle2, Circle, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Cloudy, Plus, Trash2, ArrowRight, Search, MapPin, Loader2, FileText, Pin } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
const STORAGE_KEY = 'dashboard_todos';
function getWeatherIcon(condition, size = 'md') {
    const sizeClass = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
    const colorClass = condition.toLowerCase() === 'sunny' || condition.toLowerCase() === 'clear' ? 'text-yellow-500' :
        condition.toLowerCase() === 'rain' || condition.toLowerCase() === 'rainy' ? 'text-blue-500' :
            condition.toLowerCase() === 'snow' || condition.toLowerCase() === 'snowy' ? 'text-blue-300' :
                condition.toLowerCase() === 'storm' || condition.toLowerCase() === 'thunderstorm' ? 'text-purple-500' :
                    condition.toLowerCase() === 'partly_cloudy' ? 'text-yellow-400' : 'text-gray-400';
    switch (condition.toLowerCase()) {
        case 'sunny':
        case 'clear':
            return _jsx(Sun, { className: `${sizeClass} ${colorClass}` });
        case 'rain':
        case 'rainy':
            return _jsx(CloudRain, { className: `${sizeClass} ${colorClass}` });
        case 'snow':
        case 'snowy':
            return _jsx(CloudSnow, { className: `${sizeClass} ${colorClass}` });
        case 'thunderstorm':
        case 'storm':
            return _jsx(CloudLightning, { className: `${sizeClass} ${colorClass}` });
        case 'partly_cloudy':
            return _jsx(Cloudy, { className: `${sizeClass} ${colorClass}` });
        case 'cloudy':
        case 'overcast':
            return _jsx(Cloudy, { className: `${sizeClass} ${colorClass}` });
        default:
            return _jsx(Cloud, { className: `${sizeClass} ${colorClass}` });
    }
}
export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [newTodo, setNewTodo] = useState('');
    const [todos, setTodos] = useState([]);
    const [weather, setWeather] = useState({
        condition: 'cloudy',
        temp: 0,
        humidity: 0,
        location: 'Standort wird ermittelt...',
    });
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [searchResults, setSearchResults] = useState({
        customers: [],
        employees: [],
        orders: [],
    });
    const [isSearching, setIsSearching] = useState(false);
    // Geolocation for weather
    useEffect(() => {
        if (!navigator.geolocation) {
            setWeather({
                condition: 'cloudy',
                temp: 15,
                humidity: 50,
                location: 'Berlin (Standard)',
                forecast: [
                    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], tempMax: 17, tempMin: 8, condition: 'partly_cloudy' },
                    { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], tempMax: 15, tempMin: 6, condition: 'rain' },
                    { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], tempMax: 18, tempMin: 7, condition: 'sunny' },
                ],
            });
            setWeatherLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Use Open-Meteo API (free, no API key needed) - with daily forecast
                const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`);
                const weatherData = await weatherResponse.json();
                // Get city name from coordinates
                const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                const geoData = await geoResponse.json();
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown';
                // Map weather code to condition
                const weatherCode = weatherData.current.weather_code;
                let condition = 'cloudy';
                if (weatherCode === 0)
                    condition = 'sunny';
                else if (weatherCode <= 3)
                    condition = 'partly_cloudy';
                else if (weatherCode <= 48)
                    condition = 'cloudy';
                else if (weatherCode <= 67)
                    condition = 'rain';
                else if (weatherCode <= 77)
                    condition = 'snow';
                else if (weatherCode >= 95)
                    condition = 'storm';
                // Parse forecast for next 3 days (skip today)
                const forecast = [];
                for (let i = 1; i <= 3; i++) {
                    const dailyCode = weatherData.daily.weather_code[i];
                    let dailyCondition = 'cloudy';
                    if (dailyCode === 0)
                        dailyCondition = 'sunny';
                    else if (dailyCode <= 3)
                        dailyCondition = 'partly_cloudy';
                    else if (dailyCode <= 48)
                        dailyCondition = 'cloudy';
                    else if (dailyCode <= 67)
                        dailyCondition = 'rain';
                    else if (dailyCode <= 77)
                        dailyCondition = 'snow';
                    else if (dailyCode >= 95)
                        dailyCondition = 'storm';
                    forecast.push({
                        date: weatherData.daily.time[i],
                        tempMax: Math.round(weatherData.daily.temperature_2m_max[i]),
                        tempMin: Math.round(weatherData.daily.temperature_2m_min[i]),
                        condition: dailyCondition,
                    });
                }
                setWeather({
                    condition,
                    temp: Math.round(weatherData.current.temperature_2m),
                    humidity: weatherData.current.relative_humidity_2m,
                    location: city,
                    forecast,
                });
            }
            catch (error) {
                console.error('Weather fetch error:', error);
                setWeather({
                    condition: 'cloudy',
                    temp: 15,
                    humidity: 50,
                    location: 'Berlin (Fallback)',
                    forecast: [
                        { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], tempMax: 17, tempMin: 8, condition: 'partly_cloudy' },
                        { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], tempMax: 15, tempMin: 6, condition: 'rain' },
                        { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], tempMax: 18, tempMin: 7, condition: 'sunny' },
                    ],
                });
            }
            finally {
                setWeatherLoading(false);
            }
        }, (error) => {
            console.log('Geolocation error:', error.message);
            setWeather({
                condition: 'cloudy',
                temp: 15,
                humidity: 50,
                location: 'Berlin (Standard)',
                forecast: [
                    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], tempMax: 17, tempMin: 8, condition: 'partly_cloudy' },
                    { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], tempMax: 15, tempMin: 6, condition: 'rain' },
                    { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], tempMax: 18, tempMin: 7, condition: 'sunny' },
                ],
            });
            setWeatherLoading(false);
        });
    }, []);
    // Search functionality
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults({ customers: [], employees: [], orders: [] });
            return;
        }
        setIsSearching(true);
        try {
            const results = {
                customers: [],
                employees: [],
                orders: [],
            };
            if (searchType === 'all' || searchType === 'customers') {
                const custRes = await api.getCustomers({ q: searchQuery });
                results.customers = custRes.data || [];
            }
            if (searchType === 'all' || searchType === 'employees') {
                const empRes = await api.getEmployees({ q: searchQuery });
                results.employees = empRes.data || [];
            }
            if (searchType === 'all' || searchType === 'orders') {
                const ordRes = await api.getOrders({ q: searchQuery });
                results.orders = ordRes.data || [];
            }
            setSearchResults(results);
        }
        catch (error) {
            console.error('Search error:', error);
        }
        finally {
            setIsSearching(false);
        }
    }, [searchQuery, searchType]);
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [handleSearch]);
    // Load todos from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setTodos(parsed);
            }
            catch (e) {
                console.error('Failed to parse todos:', e);
            }
        }
    }, []);
    // Save todos to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);
    // Auto-delete completed todos at midnight
    useEffect(() => {
        const checkMidnight = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const msUntilMidnight = tomorrow.getTime() - now.getTime();
            // Delete completed todos
            setTimeout(() => {
                setTodos(prev => {
                    const incomplete = prev.filter(t => !t.completed);
                    if (incomplete.length !== prev.length) {
                        console.log('Midnight cleanup: removed completed todos');
                    }
                    return incomplete;
                });
            }, msUntilMidnight);
        };
        checkMidnight();
        // Check every hour
        const interval = setInterval(checkMidnight, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);
    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const { data: eventsResponse } = useQuery({
        queryKey: ['home-events'],
        queryFn: () => api.getEvents({
            start: weekStart.toISOString(),
            end: weekEnd.toISOString(),
        }),
    });
    // Get notes for homepage
    const { data: notesResponse } = useQuery({
        queryKey: ['notes'],
        queryFn: () => api.getNotes(),
    });
    const events = eventsResponse?.data || [];
    const notes = notesResponse?.data || [];
    const pinnedNotes = notes.filter((note) => note.pinned).slice(0, 5);
    const recentNotes = notes.filter((note) => !note.pinned).slice(0, 5 - pinnedNotes.length);
    const todayEvents = events.filter((event) => isSameDay(parseISO(event.startAt), today));
    const addTodo = useCallback(() => {
        if (newTodo.trim()) {
            const todo = {
                id: crypto.randomUUID(),
                title: newTodo.trim(),
                completed: false,
                createdAt: new Date().toISOString(),
            };
            setTodos(prev => [...prev, todo]);
            setNewTodo('');
        }
    }, [newTodo]);
    const toggleTodo = useCallback((id) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    }, []);
    const deleteTodo = useCallback((id) => {
        setTodos(prev => prev.filter(t => t.id !== id));
    }, []);
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    };
    const incompleteTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);
    return (_jsxs("div", { className: "space-y-6 p-4", children: [_jsxs("h1", { className: "text-3xl font-bold", children: ["Guten ", getGreeting(), ", ", user?.name.split(' ')[0], "!"] }), _jsxs(Card, { className: "card-hover", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Search, { className: "h-5 w-5" }), "Globale Suche"] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Kunden, Mitarbeiter oder Auftr\u00E4ge suchen...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" })] }), _jsxs(Select, { value: searchType, onValueChange: (v) => setSearchType(v), children: [_jsx(SelectTrigger, { className: "w-full sm:w-[180px]", children: _jsx(SelectValue, { placeholder: "Alle durchsuchen" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Alle" }), _jsx(SelectItem, { value: "customers", children: "Nur Kunden" }), _jsx(SelectItem, { value: "employees", children: "Nur Mitarbeiter" }), _jsx(SelectItem, { value: "orders", children: "Nur Auftr\u00E4ge" })] })] })] }), searchQuery && (_jsx("div", { className: "mt-4 space-y-4", children: isSearching ? (_jsxs("div", { className: "flex items-center justify-center py-4", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }), _jsx("span", { className: "ml-2 text-muted-foreground", children: "Suchen..." })] })) : (_jsxs(_Fragment, { children: [searchResults.customers.length > 0 && (_jsxs("div", { children: [_jsxs(Label, { className: "text-sm text-muted-foreground", children: ["Kunden (", searchResults.customers.length, ")"] }), _jsxs("div", { className: "mt-2 space-y-2", children: [searchResults.customers.slice(0, 3).map((customer) => (_jsxs("div", { onClick: () => navigate(`/app/customers/${customer.id}`), className: "flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium", children: customer.name.charAt(0) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: customer.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: customer.email })] }), _jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })] }, customer.id))), searchResults.customers.length > 3 && (_jsxs(Button, { variant: "link", size: "sm", onClick: () => navigate('/app/customers'), className: "text-xs", children: ["Alle ", searchResults.customers.length, " Kunden anzeigen"] }))] })] })), searchResults.employees.length > 0 && (_jsxs("div", { children: [_jsxs(Label, { className: "text-sm text-muted-foreground", children: ["Mitarbeiter (", searchResults.employees.length, ")"] }), _jsxs("div", { className: "mt-2 space-y-2", children: [searchResults.employees.slice(0, 3).map((employee) => (_jsxs("div", { onClick: () => navigate(`/app/employees/${employee.id}`), className: "flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium", children: employee.name.charAt(0) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: employee.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: employee.position || employee.role })] }), _jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })] }, employee.id))), searchResults.employees.length > 3 && (_jsxs(Button, { variant: "link", size: "sm", onClick: () => navigate('/app/employees'), className: "text-xs", children: ["Alle ", searchResults.employees.length, " Mitarbeiter anzeigen"] }))] })] })), searchResults.orders.length > 0 && (_jsxs("div", { children: [_jsxs(Label, { className: "text-sm text-muted-foreground", children: ["Auftr\u00E4ge (", searchResults.orders.length, ")"] }), _jsxs("div", { className: "mt-2 space-y-2", children: [searchResults.orders.slice(0, 3).map((order) => (_jsxs("div", { onClick: () => navigate(`/app/orders/${order.id}`), className: "flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-secondary flex items-center justify-center", children: _jsxs("span", { className: "text-xs font-medium", children: ["#", order.orderNumber || order.id.slice(0, 4)] }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: order.title || order.description || 'Auftrag' }), _jsx("p", { className: "text-xs text-muted-foreground", children: order.status })] }), _jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })] }, order.id))), searchResults.orders.length > 3 && (_jsxs(Button, { variant: "link", size: "sm", onClick: () => navigate('/app/orders'), className: "text-xs", children: ["Alle ", searchResults.orders.length, " Auftr\u00E4ge anzeigen"] }))] })] })), searchResults.customers.length === 0 &&
                                            searchResults.employees.length === 0 &&
                                            searchResults.orders.length === 0 && (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "Keine Ergebnisse gefunden" }))] })) }))] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/20", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" }), _jsx(CardHeader, { className: "relative pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4" }), "Aktuelle Uhrzeit"] }) }), _jsx(CardContent, { className: "relative", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center", children: _jsx(Clock, { className: "h-8 w-8" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-4xl font-bold tracking-tight", children: format(currentTime, 'HH:mm') }), _jsx("p", { className: "text-sm opacity-70", children: format(currentTime, 'EEEE, d. MMMM', { locale: de }) })] })] }) })] }), _jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-xl shadow-cyan-500/20", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" }), _jsx(CardHeader, { className: "relative pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(MapPin, { className: "h-4 w-4" }), weatherLoading ? 'Wetter' : weather.location] }) }), _jsx(CardContent, { className: "relative", children: weatherLoading ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Loader2, { className: "h-10 w-10 animate-spin" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold", children: "Wird geladen..." }), _jsx("p", { className: "text-sm opacity-70", children: "Standort ermitteln" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [getWeatherIcon(weather.condition, 'lg'), _jsxs("div", { children: [_jsxs("p", { className: "text-4xl font-bold", children: [weather.temp, "\u00B0C"] }), _jsxs("p", { className: "text-sm opacity-70", children: ["Luftfeuchtigkeit: ", weather.humidity, "%"] })] })] }), weather.forecast && weather.forecast.length > 0 && (_jsx("div", { className: "grid grid-cols-3 gap-2 pt-3 border-t border-white/20", children: weather.forecast.map((day, index) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs opacity-70", children: index === 0 ? 'Morgen' : index === 1 ? 'Übermorgen' : format(parseISO(day.date), 'EEE', { locale: de }) }), _jsx("div", { className: "flex justify-center my-1", children: getWeatherIcon(day.condition, 'sm') }), _jsxs("p", { className: "text-xs font-semibold", children: [day.tempMax, "\u00B0 / ", day.tempMin, "\u00B0"] })] }, index))) }))] })) })] }), _jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-600/20", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" }), _jsx(CardHeader, { className: "relative pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4" }), "Datum"] }) }), _jsx(CardContent, { className: "relative", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center", children: _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-2xl font-bold", children: format(today, 'd') }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold", children: format(today, 'MMMM yyyy', { locale: de }) }), _jsxs("p", { className: "text-sm opacity-70", children: ["KW ", getWeekNumber(today)] }), _jsx("p", { className: "text-xs opacity-60 mt-1", children: format(today, 'EEEE', { locale: de }) })] })] }) })] })] }), _jsxs(Card, { className: "card-hover", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "h-5 w-5 text-primary" }), _jsx(CardTitle, { children: "Notizen" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate('/app/notes'), children: [_jsx(ArrowRight, { className: "h-4 w-4 mr-2" }), "Alle Notizen"] })] }), _jsx(CardContent, { children: notes.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Noch keine Notizen" }), _jsx(Button, { variant: "link", onClick: () => navigate('/app/notes'), children: "Notiz erstellen" })] })) : (_jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", children: pinnedNotes.concat(recentNotes).slice(0, 5).map((note) => (_jsxs("div", { onClick: () => navigate('/app/notes'), className: "p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-all hover:shadow-md group", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [note.pinned && _jsx(Pin, { className: "h-3 w-3 text-primary flex-shrink-0" }), _jsx("h4", { className: "font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors", children: note.title })] }), note.content && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-3", children: note.content })), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: format(parseISO(note.createdAt), 'd. MMM', { locale: de }) })] }, note.id))) })) })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), _jsx(CardTitle, { children: "Heutige Termine" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "flex justify-end mb-2", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate('/app/calendar'), children: [_jsx(ArrowRight, { className: "h-4 w-4 mr-2" }), "Zum Kalender"] }) }), todayEvents.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(Calendar, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Keine Termine heute" })] })) : (_jsx("div", { className: "space-y-3", children: todayEvents.map((event) => (_jsxs("div", { onClick: () => navigate('/app/calendar'), className: "flex items-start gap-3 p-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors", children: [_jsx("div", { className: "min-w-[80px] text-sm font-medium", children: format(parseISO(event.startAt), 'HH:mm') }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium", children: event.title }), event.location && (_jsx("p", { className: "text-sm text-muted-foreground", children: event.location }))] })] }, event.id))) }))] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-primary" }), _jsx(CardTitle, { children: "Aufgaben f\u00FCr heute" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx(Input, { placeholder: "Neue Aufgabe...", value: newTodo, onChange: (e) => setNewTodo(e.target.value), onKeyPress: handleKeyPress, className: "flex-1" }), _jsx(Button, { size: "icon", onClick: addTodo, children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "space-y-2", children: incompleteTodos.length === 0 && completedTodos.length === 0 ? (_jsx("div", { className: "text-center py-4 text-muted-foreground", children: _jsx("p", { children: "Keine Aufgaben f\u00FCr heute" }) })) : (_jsxs(_Fragment, { children: [incompleteTodos.map((todo) => (_jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg bg-muted group", children: [_jsx("button", { onClick: () => toggleTodo(todo.id), className: "flex-shrink-0 mt-0.5", children: _jsx(Circle, { className: "h-5 w-5 text-muted-foreground hover:text-green-500 transition-colors" }) }), _jsx("span", { className: "flex-1", children: todo.title }), _jsx("button", { onClick: () => deleteTodo(todo.id), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] }, todo.id))), completedTodos.length > 0 && (_jsxs("div", { className: "mt-4 pt-4 border-t", children: [_jsxs("p", { className: "text-xs text-muted-foreground mb-2", children: ["Erledigt (", completedTodos.length, ") - Wird um Mitternacht gel\u00F6scht"] }), completedTodos.map((todo) => (_jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg bg-muted/50 group opacity-60", children: [_jsx("button", { onClick: () => toggleTodo(todo.id), className: "flex-shrink-0 mt-0.5", children: _jsx(CheckCircle2, { className: "h-5 w-5 text-green-500" }) }), _jsx("span", { className: "flex-1 line-through", children: todo.title }), _jsx("button", { onClick: () => deleteTodo(todo.id), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] }, todo.id)))] }))] })) })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), _jsx(CardTitle, { children: "Diese Woche" })] }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-7 gap-2", children: Array.from({ length: 7 }, (_, i) => {
                                const day = new Date(weekStart);
                                day.setDate(weekStart.getDate() + i);
                                const dayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), day));
                                const isToday = isSameDay(day, today);
                                return (_jsxs("div", { className: `p-3 rounded-lg text-center ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`, children: [_jsx("p", { className: "text-xs font-medium", children: format(day, 'EEE', { locale: de }) }), _jsx("p", { className: "text-lg font-bold", children: format(day, 'd') }), dayEvents.length > 0 && (_jsxs("p", { className: "text-xs mt-1", children: [dayEvents.length, " Termin", dayEvents.length !== 1 ? 'e' : ''] }))] }, i));
                            }) }) })] })] }));
}
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12)
        return 'Morgen';
    if (hour < 18)
        return 'Tag';
    return 'Abend';
}
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
