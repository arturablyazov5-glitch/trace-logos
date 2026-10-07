import { t } from './i18n.js';

const service = document.getElementById('partner-service');
const badge = document.getElementById('partner-badge');
const image = badge.querySelector('img');
const code = document.getElementById('partner-code');
const link = document.getElementById('partner-url');
const copy = document.getElementById('partner-copy');
const status = document.getElementById('partner-copy-status');
const imageUrl = new URL(image.getAttribute('src'), 'https://trace-logos.ru/partnership/').href;

function updateEmbed() {
  const source = service.value.trim() || 'your-service';
  const url = `https://trace-logos.ru/?utm_source=${encodeURIComponent(source)}`;
  badge.href = url;
  document.querySelectorAll('[data-partner-link]').forEach(element => { element.href = url; });
  document.querySelectorAll('[data-partner-name]').forEach(element => {
    element.textContent = source === 'your-service' ? t('partnershipYourService') : source;
  });
  link.href = url;
  link.textContent = url;
  const alt = image.alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  code.value = `<a href="${url}">\n  <img src="${imageUrl}" alt="${alt}" width="199" height="63">\n</a>`;
  status.textContent = '';
}

service.addEventListener('input', updateEmbed);
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(code.value);
    status.textContent = t('partnershipCopied');
  } catch {
    code.focus();
    code.select();
    status.textContent = t('partnershipCopyFallback');
  }
});
updateEmbed();
