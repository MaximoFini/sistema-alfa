import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const SALT_ROUNDS = 10;

// Cliente con privilegios de admin para crear usuarios en Supabase Auth
// IMPORTANTE: Necesitas agregar SUPABASE_SERVICE_ROLE_KEY en tus variables de entorno
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn(
      "⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada. Los usuarios creados NO podrán hacer login.",
    );
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// POST - Crear nuevo usuario
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { username, email, password, isAdmin } = await request.json();

    // Validaciones
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El formato del email no es válido" },
        { status: 400 },
      );
    }

    // Verificar si el usuario o email ya existe en system_users
    const { data: existingUser } = await supabase
      .from("system_users")
      .select("username, email")
      .or(`username.eq.${username.trim()},email.eq.${email.trim()}`)
      .maybeSingle();

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        return NextResponse.json(
          { error: "El nombre de usuario ya está en uso" },
          { status: 409 },
        );
      }
      if (existingUser.email === email.trim()) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 409 },
        );
      }
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Cliente admin para crear usuario en Supabase Auth
    const adminClient = getAdminClient();
    let authUserId: string | null = null;

    // 1. Crear usuario en Supabase Auth (para que pueda hacer login)
    if (adminClient) {
      try {
        const { data: authData, error: authError } =
          await adminClient.auth.admin.createUser({
            email: email.trim(),
            password: password,
            email_confirm: true, // Auto-confirmar email
            user_metadata: {
              username: username.trim(),
            },
          });

        if (authError) {
          console.error("Error al crear usuario en Auth:", authError);
          return NextResponse.json(
            {
              error:
                "Error al crear el usuario en el sistema de autenticación: " +
                authError.message,
            },
            { status: 500 },
          );
        }

        authUserId = authData.user.id;
      } catch (authError) {
        console.error("Excepción al crear usuario en Auth:", authError);
        return NextResponse.json(
          { error: "Error al crear el usuario en el sistema de autenticación" },
          { status: 500 },
        );
      }
    }

    // 2. Insertar en system_users (tabla de gestión)
    const { data: systemUserData, error: systemUserError } = await supabase
      .from("system_users")
      .insert({
        id: authUserId || undefined, // Usar el ID de Auth si está disponible
        username: username.trim(),
        email: email.trim(),
        password_hash: passwordHash,
        is_admin: isAdmin || false,
        is_active: true,
      })
      .select()
      .single();

    if (systemUserError) {
      console.error("Error al crear usuario en system_users:", systemUserError);
      
      // Si falló, intentar eliminar el usuario de Auth para mantener consistencia
      if (authUserId && adminClient) {
        await adminClient.auth.admin.deleteUser(authUserId);
      }
      
      return NextResponse.json(
        { error: "Error al crear el usuario en la base de datos" },
        { status: 500 },
      );
    }

    // 3. Crear perfil en la tabla profiles (para el sistema de roles)
    if (authUserId) {
      const role = isAdmin ? "Administrador" : "Recepcionista";
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authUserId,
        email: email.trim(),
        role: role,
        full_name: username.trim(),
      });

      if (profileError) {
        console.error("Error al crear perfil:", profileError);
        // No fallar si solo falla el perfil, se puede crear manualmente después
      }
    }

    // No retornar el hash en la respuesta
    const { password_hash, ...userData } = systemUserData;
    return NextResponse.json(
      {
        ...userData,
        canLogin: !!authUserId,
        message: authUserId
          ? "Usuario creado correctamente. Puede hacer login."
          : "Usuario creado en la tabla de gestión. Configure SUPABASE_SERVICE_ROLE_KEY para habilitar login.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en POST /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// PATCH - Actualizar contraseña de usuario
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, newPassword } = await request.json();

    // Validaciones
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizar en la BD
    const { error } = await supabase
      .from("system_users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (error) {
      console.error("Error al actualizar contraseña:", error);
      return NextResponse.json(
        { error: "Error al actualizar la contraseña" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Contraseña actualizada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en PATCH /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar datos de usuario (username, email)
export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, username, email } = await request.json();

    // Validaciones
    if (!userId || !username || !email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El formato del email no es válido" },
        { status: 400 },
      );
    }

    // Verificar si el username o email ya están en uso por otro usuario
    const { data: existingUser } = await supabase
      .from("system_users")
      .select("id, username, email")
      .or(`username.eq.${username.trim()},email.eq.${email.trim()}`)
      .neq("id", userId)
      .maybeSingle();

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        return NextResponse.json(
          { error: "El nombre de usuario ya está en uso" },
          { status: 409 },
        );
      }
      if (existingUser.email === email.trim()) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 409 },
        );
      }
    }

    // Actualizar en la BD
    const { data, error } = await supabase
      .from("system_users")
      .update({
        username: username.trim(),
        email: email.trim(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar usuario:", error);
      return NextResponse.json(
        { error: "Error al actualizar el usuario" },
        { status: 500 },
      );
    }

    const { password_hash, ...userData } = data;
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("Error en PUT /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
