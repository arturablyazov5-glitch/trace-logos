// ─────────────────────────────────────────────────────────────────────────────
// thanks.js — страница /thanks/?t=<token>. Единственное место, где выдаётся файл
// продукта: сам объект лежит в приватном бакете Supabase Storage, и подписанную
// ссылку на него отдаёт функция checkout — по токену заказа, а не по факту того,
// что браузер сюда пришёл.
//
// Сюда попадают оба сценария из js/pwyw.js: и «взял бесплатно» (заказ сразу free),
// и «вернулся после оплаты» (заказ pending, пока не придёт вебхук payment.success
// от lava.top). Поэтому pending — не ошибка, а нормальное промежуточное состояние,
// которое доопрашивается.
// ─────────────────────────────────────────────────────────────────────────────
import { t } from './i18n.js';

const ENDPOINT = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/checkout';

// Вебхук приходит за секунды, но платёжная система может задержаться. Опрашиваем
// с запасом, потом останавливаемся и оставляем человеку кнопку «обновить».
const POLL_INTERVAL_MS = 5000;
const POLL_LIMIT = 24;            // 24 × 5 с = 2 минуты

const $ = (sel) => document.querySelector(sel);
let polls = 0;

function show({ heading, text, downloadUrl, spinner }) {
  $('#thanks-heading').textContent = heading;
  $('#thanks-text').textContent = text;
  $('#thanks-state').classList.toggle('is-waiting', Boolean(spinner));

  const action = $('#thanks-action');
  if (downloadUrl) {
    action.innerHTML = '';
    const a = document.createElement('a');
    a.className = 'thanks-btn';
    a.href = downloadUrl;
    a.textContent = t('thanksDownload');
    a.setAttribute('download', '');
    action.appendChild(a);
    action.hidden = false;
  } else {
    action.hidden = true;
    action.innerHTML = '';
  }
}

async function load(token) {
  let res, data;
  try {
    res = await fetch(`${ENDPOINT}?token=${encodeURIComponent(token)}`);
    data = await res.json().catch(() => ({}));
  } catch (_) {
    show({ heading: t('thanksHeadingProblem'), text: t('pwywErrorNetwork') });
    return;
  }

  if (res.status === 410 || data.status === 'expired') {
    show({ heading: t('thanksHeadingProblem'), text: t('thanksExpired') });
    return;
  }
  if (!res.ok && !data.status) {
    show({ heading: t('thanksHeadingProblem'), text: t('thanksUnknown') });
    return;
  }

  if (data.status === 'free' || data.status === 'paid') {
    const paid = data.status === 'paid';
    show({
      heading: paid ? t('thanksHeadingPaid') : t('thanksHeadingFree'),
      text: paid ? t('thanksTextPaid') : t('thanksTextFree'),
      downloadUrl: data.downloadUrl,
    });
    // Файл не должен требовать второго клика — но и не должен подменять кнопку:
    // если браузер заблокирует автозагрузку, кнопка остаётся на месте.
    if (data.downloadUrl) setTimeout(() => { location.href = data.downloadUrl; }, 400);
    return;
  }

  if (data.status === 'failed') {
    show({ heading: t('thanksHeadingProblem'), text: t('thanksFailed') });
    return;
  }

  // pending
  show({ heading: t('thanksHeadingPaid'), text: t('thanksPending'), spinner: true });
  if (++polls < POLL_LIMIT) setTimeout(() => load(token), POLL_INTERVAL_MS);
}

const token = new URLSearchParams(location.search).get('t') || '';
if (!token) {
  show({ heading: t('thanksHeadingProblem'), text: t('thanksUnknown') });
} else {
  show({ heading: t('thanksHeadingLoading'), text: t('thanksLoading'), spinner: true });
  load(token);
}
