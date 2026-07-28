CREATE TABLE IF NOT EXISTS public.post_views (
    slug TEXT PRIMARY KEY,
    count BIGINT DEFAULT 0
);

-- Function to increment views
CREATE OR REPLACE FUNCTION public.increment_view(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.post_views (slug, count)
    VALUES (post_slug, 1)
    ON CONFLICT (slug)
    DO UPDATE SET count = public.post_views.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions just in case
GRANT ALL ON TABLE public.post_views TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_view(TEXT) TO postgres, service_role;
