import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { load, save } from '../../lib/storage';
import { sb } from '../../lib/supabase';
import { Modal } from './components/Modal';
import { mapAvaliacao, type AvaliacaoRec } from './types';

type DialogState = {
  open: boolean;
  title: string;
  message: string;
  mode: 'alert' | 'confirm';
  danger?: boolean;
};

type DesafioCtx = {
  hist: AvaliacaoRec[];
  fetchHist: () => Promise<void>;
  prependHist: (rec: AvaliacaoRec) => void;
  patchHist: (id: string, patch: Partial<AvaliacaoRec>) => void;
  removeHistById: (id: string) => void;
  replaceSavedRec: (match: (r: AvaliacaoRec) => boolean, next: AvaliacaoRec) => void;
  used: number[];
  markUsed: (n: number) => void;
  clearUsed: () => void;
  durMin: number;
  setDurMin: (m: number) => void;
  toast: (msg: string) => void;
  confirm: (message: string, opts?: { title?: string; danger?: boolean }) => Promise<boolean>;
  alert: (message: string, opts?: { title?: string }) => Promise<void>;
  lastRec: AvaliacaoRec | null;
  setLastRec: (r: AvaliacaoRec | null) => void;
  evalActive: boolean;
  setEvalActive: (v: boolean) => void;
};

const Ctx = createContext<DesafioCtx | null>(null);

export function DesafioProvider({ children }: { children: ReactNode }) {
  const { user, meProf } = useAuth();
  const [hist, setHist] = useState<AvaliacaoRec[]>([]);
  const [used, setUsedState] = useState<number[]>(() => load<number[]>('dc_used', []));
  const [durMin, setDurMinState] = useState(() => load<number>('dc_dur', 15));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lastRec, setLastRec] = useState<AvaliacaoRec | null>(null);
  const [evalActive, setEvalActive] = useState(false);
  const [dlg, setDlg] = useState<DialogState>({
    open: false,
    title: 'Atenção',
    message: '',
    mode: 'alert',
  });
  const dlgResolve = useRef<((v: boolean) => void) | null>(null);

  const profNome = meProf?.nome_completo || user?.email || 'Professor';

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 1800);
  }, []);

  const openDialog = useCallback(
    (state: Omit<DialogState, 'open'>) =>
      new Promise<boolean>((resolve) => {
        if (dlgResolve.current) {
          dlgResolve.current(false);
        }
        dlgResolve.current = resolve;
        setDlg({ ...state, open: true });
      }),
    [],
  );

  const confirm = useCallback(
    (message: string, opts?: { title?: string; danger?: boolean }) =>
      openDialog({
        title: opts?.title || 'Confirmar',
        message,
        mode: 'confirm',
        danger: opts?.danger,
      }),
    [openDialog],
  );

  const alert = useCallback(
    async (message: string, opts?: { title?: string }) => {
      await openDialog({
        title: opts?.title || 'Atenção',
        message,
        mode: 'alert',
        danger: false,
      });
    },
    [openDialog],
  );

  const onDialogClose = useCallback((ok: boolean) => {
    setDlg((d) => ({ ...d, open: false }));
    const r = dlgResolve.current;
    dlgResolve.current = null;
    r?.(ok);
  }, []);

  const fetchHist = useCallback(async () => {
    if (!user) {
      setHist([]);
      return;
    }
    const { data, error } = await sb
      .from('avaliacoes')
      .select('*,professores(nome_completo)')
      .eq('professor_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast('Erro ao carregar histórico');
      setHist([]);
      return;
    }
    setHist(
      (data || []).map((row) =>
        mapAvaliacao(row as Parameters<typeof mapAvaliacao>[0], {
          userId: user.id,
          profNome,
        }),
      ),
    );
  }, [user, profNome, toast]);

  const prependHist = useCallback((rec: AvaliacaoRec) => {
    setHist((h) => [rec, ...h]);
  }, []);

  const patchHist = useCallback((id: string, patch: Partial<AvaliacaoRec>) => {
    setHist((h) => h.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const removeHistById = useCallback((id: string) => {
    setHist((h) => h.filter((x) => x.id !== id));
  }, []);

  const replaceSavedRec = useCallback((match: (r: AvaliacaoRec) => boolean, next: AvaliacaoRec) => {
    setHist((h) => {
      const i = h.findIndex(match);
      if (i < 0) return [next, ...h];
      const copy = [...h];
      copy[i] = next;
      return copy;
    });
  }, []);

  const markUsed = useCallback((n: number) => {
    setUsedState((u) => {
      const next = u.includes(n) ? u : [...u, n];
      save('dc_used', next);
      return next;
    });
  }, []);

  const clearUsed = useCallback(() => {
    setUsedState([]);
    save('dc_used', []);
  }, []);

  const setDurMin = useCallback((m: number) => {
    setDurMinState(m);
    save('dc_dur', m);
  }, []);

  const value = useMemo(
    () => ({
      hist,
      fetchHist,
      prependHist,
      patchHist,
      removeHistById,
      replaceSavedRec,
      used,
      markUsed,
      clearUsed,
      durMin,
      setDurMin,
      toast,
      confirm,
      alert,
      lastRec,
      setLastRec,
      evalActive,
      setEvalActive,
    }),
    [
      hist,
      fetchHist,
      prependHist,
      patchHist,
      removeHistById,
      replaceSavedRec,
      used,
      markUsed,
      clearUsed,
      durMin,
      setDurMin,
      toast,
      confirm,
      alert,
      lastRec,
      evalActive,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast${toastMsg ? ' show' : ''}`} aria-live="polite">
        {toastMsg || ''}
      </div>
      <Modal
        open={dlg.open}
        title={dlg.title}
        message={dlg.message}
        mode={dlg.mode}
        danger={dlg.danger}
        onClose={onDialogClose}
      />
    </Ctx.Provider>
  );
}

export function useDesafio(): DesafioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDesafio fora de DesafioProvider');
  return ctx;
}