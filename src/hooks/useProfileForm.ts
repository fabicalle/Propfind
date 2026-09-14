import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { csrfFetch } from '@/lib/security/csrfClient';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface UseProfileFormOptions {
  userId: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialPhone?: string;
}

export function useProfileForm({ userId, initialFirstName, initialLastName, initialPhone }: UseProfileFormOptions) {
  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [lastName, setLastName] = useState(initialLastName || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(initialFirstName || '');
    setLastName(initialLastName || '');
    setPhone(initialPhone || '');
    setError(null);
  }, [initialFirstName, initialLastName, initialPhone]);

  const validatePhone = useCallback((value: string) => {
    const cleaned = value.replace(/[\s\-()]/g, '');
    if (!cleaned) return 'El teléfono es obligatorio';
    if (!/^\+?\d{7,15}$/.test(cleaned)) return 'Ingresá un número válido con código de área';
    return null;
  }, []);

  const handleSubmit = useCallback(async (): Promise<ProfileData | null> => {
    setError(null);

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return null;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son obligatorios');
      return null;
    }

    setIsSaving(true);

    try {
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const response = await csrfFetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }

      return { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, phone, validatePhone]);

  return {
    firstName,
    lastName,
    phone,
    isSaving,
    error,
    setFirstName,
    setLastName,
    setPhone,
    handleSubmit,
  };
}
