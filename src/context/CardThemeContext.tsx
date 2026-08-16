import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Card } from '../types';

export interface CardThemeInfo {
  id: string;
  name: string;
  ext: string;
}

export interface CardThemeValue {
  themes: CardThemeInfo[];
  theme: CardThemeInfo | null;
  setThemeId: (id: string) => void;
  getCardImageUrl: (card: Card) => string | null;
}

const LOCAL_STORAGE_THEME_KEY = 'bigtwo_card_theme';

const FALLBACK_THEMES: CardThemeInfo[] = [{ id: 'default', name: 'Classic', ext: 'svg' }];

const CardThemeContext = createContext<CardThemeValue | null>(null);

export const CardThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<CardThemeInfo[]>(FALLBACK_THEMES);
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'default';
    } catch {
      return 'default';
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/cards/themes.json')
      .then(res => {
        if (!res.ok) throw new Error('no manifest');
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        const list: CardThemeInfo[] = Array.isArray(data?.themes)
          ? data.themes.filter((t: CardThemeInfo) => t && t.id && t.ext)
          : FALLBACK_THEMES;
        if (list.length > 0) {
          setThemes(list);
          setThemeIdState(prev => (list.some(t => t.id === prev) ? prev : list[0].id));
        }
      })
      .catch(() => {
        // Manifest missing: default theme only.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useMemo(() => themes.find(t => t.id === themeId) || themes[0] || null, [themes, themeId]);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, id);
    } catch {}
  }, []);

  const getCardImageUrl = useCallback(
    (card: Card) => {
      if (!theme) return null;
      return `/cards/${theme.id}/${card.rank}_of_${card.suit}.${theme.ext}`;
    },
    [theme],
  );

  const value = useMemo(
    () => ({ themes, theme, setThemeId, getCardImageUrl }),
    [themes, theme, setThemeId, getCardImageUrl],
  );

  return <CardThemeContext.Provider value={value}>{children}</CardThemeContext.Provider>;
};

export function useCardTheme(): CardThemeValue {
  const ctx = useContext(CardThemeContext);
  if (!ctx) {
    throw new Error('useCardTheme must be used within a CardThemeProvider');
  }
  return ctx;
}
