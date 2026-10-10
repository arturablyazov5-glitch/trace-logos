// Use the site's code-copy component with labels from the current language.
import { t } from './i18n.js';
document.querySelectorAll('.home-developers .blog-code-copy').forEach(button => {
  button.dataset.copyLabel = t('developersCopy');
  button.dataset.copiedLabel = t('developersCopied');
  button.querySelector('span')?.setAttribute('aria-live', 'polite');
});
await import('./blog-code.js');
