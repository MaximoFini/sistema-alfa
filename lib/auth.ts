import { supabase } from "@/lib/supabase";

export type UserRole = "Administrador" | "Recepcionista" | "Alumno";

export async function getUserRole(userId?: string): Promise<UserRole | null> {
  let uid = userId;

  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    uid = user.id;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .single();

  return profile?.role || null;
}

export interface UserProfile {
  id: string;
  email: string | undefined;
  role: UserRole;
  full_name: string | null;
}

export async function getUserProfile(
  userId?: string,
  userEmail?: string,
): Promise<UserProfile | null> {
  let uid = userId;
  let email = userEmail;

  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    uid = user.id;
    email = user.email;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();

  if (!profile) return null;

  return {
    id: uid,
    email: email,
    role: profile.role,
    full_name: profile.full_name,
  };
}

// Nueva función optimizada para validar usuario en login
export interface LoginValidation {
  isValid: boolean;
  role: UserRole | null;
  errorMessage?: string;
}

export async function validateUserForLogin(
  userId: string,
): Promise<LoginValidation> {
  // Consulta simple solo a profiles - optimizada
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error validating user:", error);
    return {
      isValid: false,
      role: null,
      errorMessage: "Error al verificar el usuario.",
    };
  }

  if (!data) {
    return {
      isValid: false,
      role: null,
      errorMessage: "Usuario no encontrado en el sistema.",
    };
  }

  const role = data.role as UserRole;

  // Verificar permisos
  if (role !== "Administrador" && role !== "Recepcionista") {
    return {
      isValid: false,
      role: null,
      errorMessage: "No tienes permisos para acceder a este panel.",
    };
  }

  return {
    isValid: true,
    role,
  };
}
