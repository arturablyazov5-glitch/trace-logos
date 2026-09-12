-- Checkout «плати сколько хочешь» (см. supabase/functions/checkout/index.ts).
--
-- Две таблицы:
--   products — зеркало products.json из репозитория, заливается scripts/sync-products.js.
--              Нужно потому, что Edge Function не читает файлы репозитория.
--   orders   — одна строка на каждое нажатие «Скачать», включая бесплатные (amount = 0).
--              Отдельной таблицы-счётчика нет: и число скачиваний, и суммы — агрегаты
--              по этой таблице (см. GET /checkout для админки).

CREATE TABLE IF NOT EXISTS public.products (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    -- Путь объекта в приватном бакете Storage. Файл НЕ лежит в репозитории и не
    -- отдаётся по публичному URL — только по короткоживущей подписанной ссылке.
    storage_object TEXT NOT NULL,
    download_name  TEXT NOT NULL,
    -- id оффера lava.top с признаком «Цена по запросу через API».
    -- Пусто/NULL = платёжка для продукта ещё не подключена: бесплатное скачивание
    -- работает, попытка заплатить возвращает 503 payments_disabled.
    lava_offer_id TEXT,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    -- Сумма в валюте currency. 0 = взяли бесплатно.
    amount        NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'RUB',
    -- Спрашивается только у платящих: lava.top требует email для invoice.
    -- У бесплатных скачиваний NULL — почту за файл мы не берём.
    email         TEXT,
    -- free    — amount = 0, файл доступен сразу
    -- pending — invoice создан, ждём вебхук
    -- paid    — пришёл payment.success, файл доступен
    -- failed  — пришёл payment.failed
    status        TEXT NOT NULL DEFAULT 'free',
    lava_invoice_id TEXT,
    -- Секрет из URL страницы /thanks/. Именно он, а не факт возврата браузером
    -- с lava.top, открывает доступ к файлу — возврат подделывается тривиально.
    token         TEXT NOT NULL UNIQUE,
    token_expires_at TIMESTAMPTZ NOT NULL,
    download_count INT NOT NULL DEFAULT 0,
    first_download_at TIMESTAMPTZ,
    last_download_at  TIMESTAMPTZ,
    lang          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at       TIMESTAMPTZ,
    -- errorMessage из вебхука payment.failed (например, отказ банка) — без неё
    -- "оплата не прошла" ничем не отличается от любой другой причины failed,
    -- и приходится лезть в логи Edge Function вместо одного SELECT.
    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS orders_product_created_idx ON public.orders (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx          ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_lava_invoice_idx    ON public.orders (lava_invoice_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.products TO postgres, service_role;
GRANT ALL ON TABLE public.orders   TO postgres, service_role;

-- Инкремент счётчика скачиваний одним запросом (без read-modify-write гонки,
-- тот же приём, что у public.increment_banner_click).
CREATE OR REPLACE FUNCTION public.register_download(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.orders
       SET download_count    = download_count + 1,
           first_download_at = COALESCE(first_download_at, now()),
           last_download_at  = now()
     WHERE token = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_download(TEXT) TO postgres, service_role;
