import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { UserRole } from "@/lib/auth";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
}

// Caché en memoria para evitar consultas repetidas durante la sesión
let cachedAuthState: AuthState | null = null;
let authPromise: Promise<AuthState> | null = null;

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(
    cachedAuthState || { user: null, role: null, loading: true },
  );

  const loadAuthState = useCallback(async (): Promise<AuthState> => {
    // Si ya hay una consulta en progreso, retornarla
    if (authPromise) {
      return authPromise;
    }

    // Si ya tenemos datos en caché, retornarlos inmediatamente
    if (cachedAuthState && cachedAuthState.user) {
      return cachedAuthState;
    }

    // Crear nueva consulta
    authPromise = (async () => {
      try {
        // Obtener usuario de la sesión local (no hace request al servidor)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const newState = { user: null, role: null, loading: false };
          cachedAuthState = newState;
          return newState;
        }

        // Solo consultar el rol si no lo tenemos en caché
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const newState = {
          user,
          role: (profile?.role as UserRole) || null,
          loading: false,
        };

        cachedAuthState = newState;
        return newState;
      } catch (error) {
        console.error("Error loading auth state:", error);
        const errorState = { user: null, role: null, loading: false };
        cachedAuthState = errorState;
        return errorState;
      } finally {
        authPromise = null;
      }
    })();

    return authPromise;
  }, []);

  useEffect(() => {
    // Cargar estado inicial
    loadAuthState().then(setAuthState);

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Invalidar caché al hacer login
        cachedAuthState = null;
        authPromise = null;
        const newState = await loadAuthState();
        setAuthState(newState);
      } else if (event === "SIGNED_OUT") {
        // Limpiar caché al hacer logout
        cachedAuthState = null;
        authPromise = null;
        setAuthState({ user: null, role: null, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAuthState]);

  const refreshAuth = useCallback(async () => {
    cachedAuthState = null;
    authPromise = null;
    const newState = await loadAuthState();
    setAuthState(newState);
  }, [loadAuthState]);

  return {
    ...authState,
    refreshAuth,
  };
}

// Función para invalidar el caché manualmente (útil después de actualizaciones de perfil)
export function invalidateAuthCache() {
  cachedAuthState = null;
  authPromise = null;
}
