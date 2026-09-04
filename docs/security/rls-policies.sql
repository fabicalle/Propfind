-- ContactMessages: permitir acceso limitado
CREATE POLICY contact_messages_recipient_read
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid()::text);

CREATE POLICY contact_messages_recipient_update
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid()::text);

CREATE POLICY contact_messages_recipient_delete
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid()::text);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Spatial ref sys: acceso restringido
REVOKE SELECT ON public.spatial_ref_sys FROM anon, authenticated;
GRANT SELECT ON public.spatial_ref_sys TO service_role;
