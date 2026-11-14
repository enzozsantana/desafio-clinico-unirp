import { useSimulados } from '../SimuladosContext';

export function JobBanner() {
  const { job, abortJob, endJobClose, busy } = useSimulados();
  if (!job.show) return null;
  return (
    <div id="job" className={`show${job.err ? ' err' : ''}`} role="status" aria-live="polite">
      {job.spinning ? <i className="spin" /> : null}
      <span>{job.msg}</span>
      <button type="button" onClick={busy ? abortJob : endJobClose}>
        {busy ? 'Parar' : 'Fechar'}
      </button>
    </div>
  );
}