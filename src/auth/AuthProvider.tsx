import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { sb } from '../lib/supabase';

export type Professor = {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url?: string | null;
};

type AuthCtx = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  meProf: Professor | null;
  refreshProf: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (nome: string, email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function authMsg(err: { message?: string; status?: number } | null) {
  const m = (err?.message || '').toLowerCase();
  if (m.includes('rate') || err?.status === 429) return 'Muitas tentativas. Aguarde um minuto.';
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já está cadastrado.';
  if (m.includes('email not confirmed')) return 'Confirme o e-mail antes de entrar.';
  if (m.includes('password')) return 'Senha inválida (mínimo 6 caracteres).';
  return err?.message || 'Não foi possível autenticar.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [meProf, setMeProf] = useState<Professor | null>(null);

  const loadMeProf = useCallback(async (user: User | null) => {
    if (!user) {
      setMeProf(null);
      return;
    }
    const { data, error } = await sb
      .from('professores')
      .select('id,nome_completo,email,avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (error) console.error(error);
    setMeProf(
      data || {
        id: user.id,
        nome_completo: (user.user_metadata?.nome_completo as string) || user.email || 'Professor',
        email: user.email || '',
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
      },
    );
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      await loadMeProf(data.session?.user ?? null);
      if (alive) setReady(true);
    })();
    const { data: sub } = sb.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      await loadMeProf(sess?.user ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadMeProf]);

  const value = useMemo<AuthCtx>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      meProf,
      refreshProf: async () => loadMeProf(session?.user ?? null),
      signIn: async (email, password) => {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        return error ? { error: authMsg(error) } : {};
      },
      signUp: async (nome, email, password) => {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { nome_completo: nome } },
        });
        if (error) return { error: authMsg(error) };
        if (!data.session) return { needsConfirm: true };
        return {};
      },
      signOut: async () => {
        await sb.auth.signOut();
      },
    }),
    [ready, session, meProf, loadMeProf],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
