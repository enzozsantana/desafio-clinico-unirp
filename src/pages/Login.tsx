import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const LOGO = 'https://aplicacoes2.unirp.edu.br/Documentos/Imagens/LogoVermelha.png';

export function LoginPage() {
  const { user, ready, signIn, signUp } = useAuth();
  const [cad, setCad] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});

  if (ready && user) return <Navigate to="/" replace />;

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const fd = new FormData(e.target as HTMLFormElement);
    const r = await signIn(String(fd.get('email') || '').trim(), String(fd.get('senha') || ''));
    if (r.error) setErr(r.error);
    setBusy(false);
  }

  async function onCad(e: FormEvent) {
    e.preventDefault();
    setErr('');
    const fd = new FormData(e.target as HTMLFormElement);
    const nome = String(fd.get('nome') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const senha = String(fd.get('senha') || '');
    const senha2 = String(fd.get('senha2') || '');
    if (!nome) return setErr('Informe o nome completo.');
    if (senha.length < 6) return setErr('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== senha2) return setErr('As senhas não coincidem.');
    setBusy(true);
    const r = await signUp(nome, email, senha);
    if (r.error) setErr(r.error);
    else if (r.needsConfirm) {
      setCad(false);
      setErr('Conta criada. Confirme o e-mail e entre.');
    }
    setBusy(false);
  }

  function Eye({ id }: { id: string }) {
    const on = !!showPw[id];
    return (
      <button
        type="button"
        className="eye"
        aria-label={on ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={on}
        onClick={() => setShowPw((s) => ({ ...s, [id]: !on }))}
      >
        {on ? '🙈' : '👁'}
      </button>
    );
  }

  return (
    <section id="vAuth" className="enter-in">
      <div className="logo">
        <img src={LOGO} alt="UNIRP — Centro Universitário de Rio Preto" width={180} height={49} />
      </div>
      <h1>{cad ? 'Cadastrar professor' : 'Entrar'}</h1>
      <p className="lead">{cad ? 'Nome completo, e-mail e senha.' : 'Acesso exclusivo para professores avaliadores.'}</p>

      {!cad ? (
        <form className="card" onSubmit={onLogin}>
          <label className="f" htmlFor="inEmail">E-mail</label>
          <input id="inEmail" name="email" type="email" autoComplete="username" inputMode="email" placeholder="seu@email.com" />
          <div style={{ height: 12 }} />
          <label className="f" htmlFor="inSenha">Senha</label>
          <div className="pw">
            <input id="inSenha" name="senha" type={showPw.inSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="Senha" />
            <Eye id="inSenha" />
          </div>
          <p className="auth-err">{err}</p>
          <div style={{ height: 12 }} />
          <button className="btn teal" type="submit" disabled={busy}>Entrar</button>
          <div className="auth-switch">
            Não tem conta?{' '}
            <button type="button" onClick={() => { setCad(true); setErr(''); }}>Cadastrar professor</button>
          </div>
        </form>
      ) : (
        <form className="card" onSubmit={onCad}>
          <label className="f" htmlFor="inNomeProf">Nome completo</label>
          <input id="inNomeProf" name="nome" type="text" autoComplete="name" placeholder="Nome completo" />
          <div style={{ height: 12 }} />
          <label className="f" htmlFor="inEmailCad">E-mail</label>
          <input id="inEmailCad" name="email" type="email" autoComplete="username" inputMode="email" placeholder="seu@email.com" />
          <div style={{ height: 12 }} />
          <label className="f" htmlFor="inSenhaCad">Senha</label>
          <div className="pw">
            <input id="inSenhaCad" name="senha" type={showPw.inSenhaCad ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
            <Eye id="inSenhaCad" />
          </div>
          <div style={{ height: 12 }} />
          <label className="f" htmlFor="inSenhaCad2">Confirmar senha</label>
          <div className="pw">
            <input id="inSenhaCad2" name="senha2" type={showPw.inSenhaCad2 ? 'text' : 'password'} autoComplete="new-password" placeholder="Repita a senha" />
            <Eye id="inSenhaCad2" />
          </div>
          <p className="auth-err">{err}</p>
          <div style={{ height: 12 }} />
          <button className="btn teal" type="submit" disabled={busy}>Criar conta</button>
          <div className="auth-switch">
            Já tem conta?{' '}
            <button type="button" onClick={() => { setCad(false); setErr(''); }}>Entrar</button>
          </div>
        </form>
      )}
    </section>
  );
}
