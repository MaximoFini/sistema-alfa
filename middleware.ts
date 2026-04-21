import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Obtener sesión y refrescarla si es necesario
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage = pathname === "/";
  const isAppRoute =
    pathname.startsWith("/inicio") ||
    pathname.startsWith("/administracion") ||
    pathname.startsWith("/finanzas") ||
    pathname.startsWith("/biblioteca") ||
    pathname.startsWith("/comunicacion") ||
    pathname.startsWith("/estadisticas") ||
    pathname.startsWith("/planificacion") ||
    pathname.startsWith("/planificador") ||
    pathname.startsWith("/productos-ventas");

  // Debug logging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware]', {
      pathname,
      hasSession: !!session,
      isAuthPage,
      isAppRoute,
    });
  }

  // Si no hay sesión y está intentando acceder a rutas protegidas, redirigir a login
  if (!session && isAppRoute) {
    console.log('[Middleware] Redirecting to login - no session');
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión y está en la página de login, redirigir a inicio
  if (session && isAuthPage) {
    console.log('[Middleware] Redirecting to /inicio - has session');
    const redirectUrl = new URL("/inicio", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
