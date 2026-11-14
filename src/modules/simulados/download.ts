export async function downloadBlob(opts: { filename: string; data: Blob | string }): Promise<void> {
  const blob =
    opts.data instanceof Blob ? opts.data : new Blob([opts.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}