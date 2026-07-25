-- Fix 1-3: Mutable search_path on all flagged functions
-- Fix 4-7: Revoke public/authenticated EXECUTE on SECURITY DEFINER functions

-- update_updated_at_column: fix search_path + revoke RPC access (trigger-only function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- update_ai_memory: fix search_path + revoke RPC access (service-role-only function)
CREATE OR REPLACE FUNCTION public.update_ai_memory(
  project_id_param uuid,
  memory_path text[],
  memory_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.projects
  SET
    ai_memory = jsonb_set(
      COALESCE(ai_memory, '{}'::jsonb),
      memory_path,
      memory_value,
      true
    ),
    updated_at = now()
  WHERE id = project_id_param;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_ai_memory(uuid, text[], jsonb) FROM anon, authenticated;

-- update_business_context_timestamp: fix search_path
CREATE OR REPLACE FUNCTION public.update_business_context_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- log_context_change: fix search_path + qualify table references
CREATE OR REPLACE FUNCTION public.log_context_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.business_stage IS DISTINCT FROM NEW.business_stage THEN
      INSERT INTO public.business_context_updates (user_id, context_id, field_changed, old_value, new_value, impact_level)
      VALUES (NEW.user_id, NEW.id, 'business_stage', to_jsonb(OLD.business_stage), to_jsonb(NEW.business_stage), 'high');
    END IF;

    IF OLD.current_metrics IS DISTINCT FROM NEW.current_metrics THEN
      INSERT INTO public.business_context_updates (user_id, context_id, field_changed, old_value, new_value, impact_level)
      VALUES (NEW.user_id, NEW.id, 'current_metrics', OLD.current_metrics, NEW.current_metrics, 'medium');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
