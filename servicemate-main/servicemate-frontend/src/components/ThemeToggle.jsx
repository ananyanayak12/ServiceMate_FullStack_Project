import React from 'react';
import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <SunMedium size={16} /> : <Moon size={16} />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
};

export default ThemeToggle;
