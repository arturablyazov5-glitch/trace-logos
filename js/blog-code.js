// ─────────────────────────────────────────────────────────────────────────────
// blog-code.js — «Копировать» на fenced code blocks в статьях блога
// (.blog-code, разметка из build-blog.js). Читает соседний <code> и пишет его
// textContent в буфер обмена; на странице без блоков кода ничего не делает.
// ─────────────────────────────────────────────────────────────────────────────

const buttons = document.querySelectorAll('.blog-code-copy');

buttons.forEach(btn => {
  const code = btn.closest('.blog-code')?.querySelector('code');
  if (!code) return;

  const label = btn.querySelector('span');
  const copyLabel = btn.dataset.copyLabel || label?.textContent || '';
  const copiedLabel = btn.dataset.copiedLabel || copyLabel;
  let resetTimer = null;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
    } catch {
      return;
    }
    btn.classList.add('is-copied');
    if (label) label.textContent = copiedLabel;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      btn.classList.remove('is-copied');
      if (label) label.textContent = copyLabel;
    }, 2000);
  });
});
