import React from 'react';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const themes = [
  { value: 'light', label: 'Ljust' },
  { value: 'dark', label: 'Mörkt' },
  { value: 'system', label: 'System' },
  // Lägg till fler teman/färger här om du vill
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div>
      <label className="block font-medium mb-1">Tema</label>
      <select
        value={currentTheme}
        onChange={e => onThemeChange(e.target.value)}
        className="border rounded px-2 py-1"
      >
        {themes.map(theme => (
          <option key={theme.value} value={theme.value}>{theme.label}</option>
        ))}
      </select>
    </div>
  );
}; 