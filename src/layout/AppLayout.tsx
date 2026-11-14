import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { removeAvatar, uploadAvatar } from '../modules/desafio/avatar';
import { useTheme } from '../theme/ThemeProvider';

const LOGO = 'https://aplicacoes2.unirp.edu.br/Documentos/Imagens/LogoVermelha.png';

function initials(nome: string) {
  const p = (nome || '?').trim().split(/\s+/);
  return ((p[0]?.[0] || '?') + (p[1]?.[0] || '')).toUpperCase();
}

function Avatar({ url, nome, className }: { url: string; nome: string; className?: string }) {
  return (
    <span className={`av${url ? ' has-photo' : ''}${className ? ` ${className}` : ''}`} aria-hidden>
      {url ? <img src={url} alt="" /> : initials(nome)}
    </span>
  );
}

export function AppLayout() {
  const { user, meProf, signOut, refreshProf } = useAuth();
  const { toggle } = useTheme();
  const loc = useLocation();
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isAuth = loc.pathname === '/login';
  const inEval = loc.pathname.startsWith('/desafio/avaliar');
  const nome = meProf?.nome_completo || 'Professor';
  const avatar = meProf?.avatar_url || '';

  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [loc.pathname]);

  useEffect(() => {
    document.body.classList.toggle('is-auth', isAuth);
    return () => document.body.classList.remove('is-auth');
  }, [isAuth]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  function goHome() {
    if (inEval) {
      setToast('Finalize ou cancele a avaliação primeiro');
      return;
    }
    nav('/');
  }

  function goHist() {
    if (inEval) {
      setToast('Finalize ou cancele a avaliação primeiro');
      return;
    }
    nav('/desafio/historico');
  }

  function goSimulados() {
    if (inEval) {
      setToast('Finalize ou cancele a avaliação primeiro');
      return;
    }
    nav('/simulados');
  }

  async function onAvatar(file?: File | null) {
    if (!file || !user) return;
    try {
      await uploadAvatar(user.id, file);
      await refreshProf();
      setToast('Foto atualizada');
    } catch (e) {
      console.error(e);
      setToast((e as Error).message || 'Não foi possível enviar a foto');
    }
  }

  async function onRemoveAvatar() {
    if (!user || !avatar) return;
    if (!confirm('Remover foto de perfil?')) return;
    try {
      await removeAvatar(user.id);
      await refreshProf();
      setToast('Foto removida');
    } catch (e) {
      console.error(e);
      setToast((e as Error).message || 'Não foi possível remover');
    }
  }

  if (isAuth) {
    return (
      <>
        <main className="wrap" id="wrap">
          <Outlet />
        </main>
        {toast ? <div className="toast show">{toast}</div> : null}
      </>
    );
  }

  return (
    <>
      <header className="top">
        <div className="top-in">
          <button
            type="button"
            className="iconbtn icon-only btn-menu"
            aria-label="Abrir menu"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            ☰
          </button>
          <button type="button" className="brand" onClick={goHome} aria-label="Ir para o início">
            <img className="brand-logo" src={LOGO} alt="" width={147} height={40} />
            <div className="brand-text">
              <strong>Sistema de Avaliações</strong>
              <span>UNIRP</span>
            </div>
          </button>
          <nav className="top-nav" aria-label="Principal">
            <button type="button" className={`nav-link${loc.pathname === '/' ? ' is-active' : ''}`} onClick={goHome}>
              Início
            </button>
            <button
              type="button"
              className={`nav-link${loc.pathname.startsWith('/desafio/historico') ? ' is-active' : ''}`}
              onClick={goHist}
            >
              Histórico
            </button>
            <button
              type="button"
              className={`nav-link${loc.pathname.startsWith('/simulados') ? ' is-active' : ''}`}
              onClick={goSimulados}
            >
              Simulados
            </button>
          </nav>
          <div className="top-actions">
            <div className="user-menu">
              <button
                type="button"
                className="user-menu-btn"
                aria-haspopup="menu"
                aria-expanded={menu}
                onClick={() => setMenu((v) => !v)}
              >
                <Avatar url={avatar} nome={nome} />
                <span className="nm">{nome.split(/\s+/)[0]}</span>
                <span className="chev" aria-hidden>
                  ▾
                </span>
              </button>
              {menu ? (
                <div className="user-dd" role="menu">
                  <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}>
                    Alterar foto
                  </button>
                  {avatar ? (
                    <button type="button" role="menuitem" onClick={onRemoveAvatar}>
                      Remover foto
                    </button>
                  ) : null}
                  <button type="button" role="menuitem" onClick={toggle}>
                    Tema
                  </button>
                  <div className="sep" aria-hidden />
                  <button type="button" role="menuitem" className="danger" onClick={() => signOut()}>
                    Sair
                  </button>
                </div>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                tabIndex={-1}
                onChange={(e) => onAvatar(e.target.files?.[0])}
              />
            </div>
          </div>
        </div>
      </header>

      {drawer ? (
        <>
          <div className="drawer-backdrop open" onClick={() => setDrawer(false)} />
          <aside className="drawer open" aria-hidden={false}>
            <div className="drawer-top">
              <div className="drawer-user">
                <Avatar url={avatar} nome={nome} />
                <div className="meta">
                  <strong>{nome}</strong>
                  <span>{meProf?.email || user?.email}</span>
                </div>
              </div>
              <button type="button" className="drawer-close" aria-label="Fechar menu" onClick={() => setDrawer(false)}>
                ×
              </button>
            </div>
            <nav className="drawer-nav" aria-label="Menu principal">
              <button
                type="button"
                className={`nav-link${loc.pathname === '/' ? ' is-active' : ''}`}
                onClick={goHome}
              >
                Início
              </button>
              <button
                type="button"
                className={`nav-link${loc.pathname.startsWith('/desafio/historico') ? ' is-active' : ''}`}
                onClick={goHist}
              >
                Histórico
              </button>
              <button
                type="button"
                className={`nav-link${loc.pathname.startsWith('/simulados') ? ' is-active' : ''}`}
                onClick={() => {
                  setDrawer(false);
                  goSimulados();
                }}
              >
                Simulados
              </button>
            </nav>
            <div className="drawer-foot">
              <button type="button" className="nav-link" onClick={toggle}>
                Tema
              </button>
              <button type="button" className="nav-link danger" onClick={() => signOut()}>
                Sair
              </button>
            </div>
          </aside>
        </>
      ) : null}

      <main className="wrap" id="wrap">
        <Outlet />
      </main>
      {toast ? <div className="toast show">{toast}</div> : null}
    </>
  );
}
