'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { config } from '@/lib/config';

// Create the context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(config.theme.default);
  const [mounted, setMounted] = useState(false);

  // On initial load, check for saved theme preference
  useEffect(() => {
    setMounted(true);
    
    // Get saved theme from localStorage or use default
    const savedTheme = localStorage.getItem('storyteller-theme');
    if (savedTheme && config.theme.options.some(option => option.id === savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Check if user prefers dark mode
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    }
    
    // Add listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('storyteller-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to DOM when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    // Save theme preference
    localStorage.setItem('storyteller-theme', theme);
    
    // Apply theme class to document
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Apply theme colors as CSS variables
    const themeConfig = config.theme.options.find(option => option.id === theme);
    if (themeConfig) {
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    // Cycle through available themes
    const themeOptions = config.theme.options.map(option => option.id);
    const currentIndex = themeOptions.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex]);
  };

  // If not mounted, don't render anything to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for easy theme access
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
