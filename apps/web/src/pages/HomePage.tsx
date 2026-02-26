import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Calendar, CheckCircle2, Circle, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Cloudy, Plus, Trash2, ArrowRight } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  reminderMinutes: number | null;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'dashboard_todos';

function getWeatherIcon(condition: string) {
  switch (condition.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return <Sun className="h-8 w-8 text-yellow-500" />;
    case 'rain':
    case 'rainy':
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    case 'snow':
    case 'snowy':
      return <CloudSnow className="h-8 w-8 text-blue-300" />;
    case 'thunderstorm':
    case 'storm':
      return <CloudLightning className="h-8 w-8 text-purple-500" />;
    case 'cloudy':
    case 'overcast':
      return <Cloudy className="h-8 w-8 text-gray-400" />;
    default:
      return <Cloud className="h-8 w-8 text-gray-400" />;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newTodo, setNewTodo] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [weather] = useState({
    condition: 'partly_cloudy',
    temp: 12,
    humidity: 65,
    location: 'Berlin',
  });

  // Load todos from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTodos(parsed);
      } catch (e) {
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
    queryFn: () =>
      api.getEvents({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      }),
  });

  const events = eventsResponse?.data || [];
  const todayEvents = events.filter((event: CalendarEvent) =>
    isSameDay(parseISO(event.startAt), today)
  );

  const addTodo = useCallback(() => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: crypto.randomUUID(),
        title: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTodos(prev => [...prev, todo]);
      setNewTodo('');
    }
  }, [newTodo]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Guten {getGreeting()}, {user?.name.split(' ')[0]}!</h1>

      {/* Top Row: Clock, Weather, Date */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Clock Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Aktuelle Uhrzeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 opacity-90" />
              <div>
                <p className="text-3xl font-bold">{format(currentTime, 'HH:mm')}</p>
                <p className="text-sm opacity-80">{format(currentTime, 'ss')}</p>
              </div>
            </div>
            <p className="text-sm opacity-80 mt-2">{format(currentTime, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
          </CardContent>
        </Card>

        {/* Weather Card */}
        <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Wetter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getWeatherIcon(weather.condition)}
              <div>
                <p className="text-3xl font-bold">{weather.temp}°C</p>
                <p className="text-sm opacity-80">{weather.location}</p>
              </div>
            </div>
            <p className="text-sm opacity-80 mt-2">Luftfeuchtigkeit: {weather.humidity}%</p>
          </CardContent>
        </Card>

        {/* Date Card */}
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Datum</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{format(today, 'd')}</p>
            <p className="text-lg opacity-90">{format(today, 'MMMM yyyy', { locale: de })}</p>
            <p className="text-sm opacity-80 mt-2">KW {getWeekNumber(today)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Today's Events & Todos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Calendar Events */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Heutige Termine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/calendar')}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Zum Kalender
              </Button>
            </div>
            {todayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Termine heute</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    onClick={() => navigate('/app/calendar')}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="min-w-[80px] text-sm font-medium">
                      {format(parseISO(event.startAt), 'HH:mm')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Todos */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle>Aufgaben für heute</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add new todo */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Neue Aufgabe..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button size="icon" onClick={addTodo}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Incomplete todos */}
            <div className="space-y-2">
              {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Keine Aufgaben für heute</p>
                </div>
              ) : (
                <>
                  {incompleteTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted group"
                    >
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500 transition-colors" />
                      </button>
                      <span className="flex-1">{todo.title}</span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}

                  {/* Completed todos */}
                  {completedTodos.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        Erledigt ({completedTodos.length}) - Wird um Mitternacht gelöscht
                      </p>
                      {completedTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group opacity-60"
                        >
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </button>
                          <span className="flex-1 line-through">{todo.title}</span>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Diese Woche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const day = new Date(weekStart);
              day.setDate(weekStart.getDate() + i);
              const dayEvents = events.filter((e: CalendarEvent) =>
                isSameDay(parseISO(e.startAt), day)
              );
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-center ${
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <p className="text-xs font-medium">
                    {format(day, 'EEE', { locale: de })}
                  </p>
                  <p className="text-lg font-bold">{format(day, 'd')}</p>
                  {dayEvents.length > 0 && (
                    <p className="text-xs mt-1">
                      {dayEvents.length} Termin{dayEvents.length !== 1 ? 'e' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morgen';
  if (hour < 18) return 'Tag';
  return 'Abend';
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
