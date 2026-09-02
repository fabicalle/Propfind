import { NextRequest } from 'next/server';
import { getServerSession, createServerSupabaseClient } from '@/lib/supabase/server';

interface SessionUser {
  id: string;
  email?: string;
}

interface SessionResult {
  user: SessionUser;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionResult | Awaited<ReturnType<typeof getServerSession>> | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (token) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          return { user: { id: user.id, email: user.email } };
        }
      }
    } catch {
    }

    const decoded = decodeJwt(token);
    if (decoded?.sub) {
      return { user: { id: decoded.sub as string } };
    }
  }

  return getServerSession();
}
