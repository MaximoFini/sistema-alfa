import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      return document.cookie.split(';').map(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        return { name, value: rest.join('=') };
      }).filter(c => c.name);
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        let cookie = `${name}=${value}`;
        
        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`;
        }
        if (options?.path) {
          cookie += `; path=${options.path}`;
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`;
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`;
        }
        if (options?.secure) {
          cookie += '; secure';
        }
        
        document.cookie = cookie;
      });
    },
  },
  auth: {
    // Mantener la sesión persistente
    persistSession: true,
    // Detectar cambios de sesión automáticamente
    autoRefreshToken: true,
    // Configuración optimizada de detección de sesión
    detectSessionInUrl: true,
    flowType: "pkce",
    // Guardar en cookies además de localStorage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Configuración global para optimizar queries
  global: {
    headers: {
      "x-client-info": "alfa-club-web",
    },
  },
});
