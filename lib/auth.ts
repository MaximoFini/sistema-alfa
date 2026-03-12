import { supabase } from "@/lib/supabase";

export type UserRole = 'Administrador' | 'Recepcionista' | 'Alumno';

export async function getUserRole(): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role || null;
}

export interface UserProfile {
  id: string;
  email: string | undefined;
  role: UserRole;
  full_name: string | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    full_name: profile.full_name,
  };
}
