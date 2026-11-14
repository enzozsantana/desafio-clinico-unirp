import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { load, save } from '../lib/storage';

type Tema = 'auto' | 'claro' | 'escuro';

type ThemeCtx = {
  tema: Tema;
  efetivo: 'claro' | 'escuro';
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function efetivoOf(tema: Tema): 'claro' | 'escuro' {
  if (tema === 'claro' || tema === 'escuro') return tema;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => load<Tema>('dc_tema', 'auto'));
  const [efetivo, setEfetivo] = useState<'claro' | 'escuro'>(() => efetivoOf(load('dc_tema', 'auto')));

  useEffect(() => {
    const e = efetivoOf(tema);
    setEfetivo(e);
    if (tema === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', e === 'escuro' ? 'dark' : 'light');
  }, [tema]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (tema === 'auto') setEfetivo(mq.matches ? 'escuro' : 'claro');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [tema]);

  const value = useMemo(
    () => ({
      tema,
      efetivo,
      toggle: () => {
        const next = efetivo === 'claro' ? 'escuro' : 'claro';
        setTema(next);
        save('dc_tema', next);
      },
    }),
    [tema, efetivo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}
