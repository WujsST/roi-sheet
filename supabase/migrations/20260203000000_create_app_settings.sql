CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.app_settings (key, value)
VALUES ('api_key', 'roi_live_default_key')
ON CONFLICT (key) DO NOTHING;
