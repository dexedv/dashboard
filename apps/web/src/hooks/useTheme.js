import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
const STORAGE_KEY = 'dashboard_theme';
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        // Check localStorage first
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        // Default to system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);
    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme, setTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
