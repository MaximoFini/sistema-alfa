import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente Supabase para uso en Server Components / Route Handlers.
 * Lee la sesión desde las cookies del request (solo lectura, sin mutación).
 * Optimizado para minimizar overhead.
 */
export async function createSupabaseServerClient(options?: {
  admin?: boolean;
  skipAuth?: boolean;
}) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // En Server Components, setAll puede fallar, lo ignoramos
          }
        },
      },
      auth: {
        // Optimizaciones para reducir latencia
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // No necesario en el servidor
      },
    },
  );
}
