DROP POLICY IF EXISTS contact_messages_recipient_read ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_sender_read ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_recipient_update ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_recipient_delete ON public.contact_messages;

CREATE POLICY contact_messages_recipient_read
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid()::text);

CREATE POLICY contact_messages_sender_read
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (sender_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

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

REVOKE SELECT ON public.spatial_ref_sys FROM anon, authenticated;
GRANT SELECT ON public.spatial_ref_sys TO service_role;
