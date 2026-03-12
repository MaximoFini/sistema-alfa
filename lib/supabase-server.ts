import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente Supabase para uso en Server Components / Route Handlers.
 * Lee la sesión desde las cookies del request (solo lectura, sin mutación).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // En Server Components solo lectura; setAll es no-op
        setAll() {},
      },
    },
  );
}
