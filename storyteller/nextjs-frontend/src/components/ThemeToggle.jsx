'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/lib/config';
import { HiMoon, HiSun, HiBookOpen } from 'react-icons/hi';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  
  // Get theme options from config
  const themeOptions = config.theme.options;
  const currentTheme = themeOptions.find(option => option.id === theme);
  
  // Helper function to render the appropriate icon
  const renderIcon = () => {
    switch (currentTheme.icon) {
      case 'moon':
        return <HiMoon className="w-5 h-5" />;
      case 'book':
        return <HiBookOpen className="w-5 h-5" />;
      case 'sun':
      default:
        return <HiSun className="w-5 h-5" />;
    }
  };
  
  // If dark mode is disabled, don't render the toggle
  if (!config.features.darkMode) {
    return null;
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors ${className}`}
      title={`Switch to ${getNextThemeName()}`}
      aria-label={`Switch to ${getNextThemeName()}`}
    >
      {renderIcon()}
    </button>
  );
  
  // Helper function to get the name of the next theme
  function getNextThemeName() {
    const themeIds = themeOptions.map(option => option.id);
    const currentIndex = themeIds.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    return themeOptions[nextIndex].name;
  }
};

export default ThemeToggle;
