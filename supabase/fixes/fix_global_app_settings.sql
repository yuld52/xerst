-- Corrige a linha de configuração global quando o schema já foi criado parcialmente.
ALTER TABLE public.global_app_settings
    ALTER COLUMN settings SET DEFAULT '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}';

UPDATE public.global_app_settings
SET settings = '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'
WHERE settings IS NULL;

ALTER TABLE public.global_app_settings
    ALTER COLUMN settings SET NOT NULL;

INSERT INTO public.global_app_settings (id, settings)
VALUES (1, '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}')
ON CONFLICT (id) DO NOTHING;
