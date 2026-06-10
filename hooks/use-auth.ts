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

    // Si ya tenemos datos en caché en memoria y tiene un usuario válido, retornarla
    if (cachedAuthState && cachedAuthState.user) {
      return cachedAuthState;
    }

    // Crear nueva consulta
    authPromise = (async () => {
      try {
        // Obtener usuario validado contra el servidor (no confía solo en localStorage)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const newState = { user: null, role: null, loading: false };
          cachedAuthState = newState;
          return newState;
        }

        // --- SISTEMA SWR Y PERSISTENCIA DE ROL ---
        // Intentar obtener rol de localStorage si existe
        let cachedRole: UserRole | null = null;
        const isClient = typeof window !== "undefined";
        const storageKey = `auth-role-${user.id}`;
        
        if (isClient) {
          cachedRole = localStorage.getItem(storageKey) as UserRole | null;
        }

        // Si tenemos un rol persistido localmente, aceleramos el estado reactivo
        // para evitar parpadeos en la UI mientras revalidamos con la base de datos
        if (cachedRole) {
          cachedAuthState = {
            user,
            role: cachedRole,
            loading: false,
          };
        }

        // Consultar el rol en vivo de la base de datos para revalidación
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        let activeRole = cachedRole;

        if (!profileError && profile?.role) {
          activeRole = profile.role as UserRole;
          // Actualizar localStorage con el rol fresco
          if (isClient) {
            localStorage.setItem(storageKey, activeRole);
          }
        } else if (profileError) {
          console.warn("Could not revalidate user role from database, falling back to cache:", profileError);
        }

        const newState = {
          user,
          role: activeRole,
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
      const currentUserId = cachedAuthState?.user?.id;
      const newUserId = session?.user?.id;

      if (event === "SIGNED_IN" && session?.user) {
        // De-duplicación: Solo invalidar y re-consultar si el usuario cambió
        if (currentUserId !== newUserId) {
          cachedAuthState = null;
          authPromise = null;
          const newState = await loadAuthState();
          setAuthState(newState);
        }
      } else if (event === "SIGNED_OUT") {
        // Limpiar caché en memoria al hacer logout
        cachedAuthState = null;
        authPromise = null;
        
        // Limpiar todo el localStorage relacionado con roles por seguridad
        if (typeof window !== "undefined") {
          if (currentUserId) {
            localStorage.removeItem(`auth-role-${currentUserId}`);
          }
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("auth-role-")) {
                localStorage.removeItem(key);
                i--;
              }
            }
          } catch (e) {
            console.error("Error clearing local storage:", e);
          }
        }
        
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

