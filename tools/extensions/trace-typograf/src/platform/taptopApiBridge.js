// ISOLATED-сторона моста к platformMain/taptopMainBridge.js (см. его
// комментарий про то, почему мост вообще нужен). Запрос/ответ гоняются
// через CustomEvent на document — общий канал для обоих миров. Действия
// сейчас — только 'enter-edit'/'exit-edit' (см. taptopMainBridge.js).
let taptopApiRequestSeq = 0;

function callTaptopApi(action, payload, timeout) {
  return new Promise((resolve) => {
    const requestId = `${Date.now()}_${taptopApiRequestSeq++}`;
    let settled = false;

    const onResult = (e) => {
      if (!e.detail || e.detail.requestId !== requestId || settled) return;
      settled = true;
      document.removeEventListener('trace-typograf:taptop-api-result', onResult);
      clearTimeout(timer);
      resolve(e.detail);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      document.removeEventListener('trace-typograf:taptop-api-result', onResult);
      resolve({ ok: false });
    }, timeout || 1500);

    document.addEventListener('trace-typograf:taptop-api-result', onResult);
    document.dispatchEvent(new CustomEvent('trace-typograf:taptop-api', {
      detail: { requestId, action, payload },
    }));
  });
}
