import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

const SALT_ROUNDS = 10;

// Cliente con privilegios de admin para crear usuarios en Supabase Auth
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error(
      "❌ SUPABASE_SERVICE_ROLE_KEY no está configurada. Los usuarios creados NO podrán hacer login.",
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

// GET - Obtener todos los usuarios del sistema
export async function GET() {
  try {
    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Servicio de autenticación no disponible" },
        { status: 503 },
      );
    }

    const { data, error } = await adminClient
      .from("system_users")
      .select("id, username, email, is_admin, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return NextResponse.json(
        { error: "Error al obtener los usuarios" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// POST - Crear nuevo usuario
export async function POST(request: Request) {
  try {
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

    // Obtener cliente admin — es OBLIGATORIO para que el usuario pueda hacer login
    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        {
          error:
            "El servidor no puede crear usuarios en este momento. Contacte al soporte técnico.",
        },
        { status: 503 },
      );
    }

    // Verificar si el usuario o email ya existe en system_users
    const { data: existingUser } = await adminClient
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

    // Hash de la contraseña (para system_users)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 1. Crear usuario en Supabase Auth (para que pueda hacer login)
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true, // Auto-confirmar email para que pueda loguear de inmediato
        user_metadata: {
          username: username.trim(),
        },
      });

    if (authError) {
      console.error("Error al crear usuario en Auth:", authError);
      // Si el email ya existe en Auth, darlo como error claro
      if (authError.message?.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "El email ya está registrado en el sistema de autenticación" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error:
            "Error al crear el usuario en el sistema de autenticación: " +
            authError.message,
        },
        { status: 500 },
      );
    }

    const authUserId = authData.user.id;

    // 2. Insertar en system_users usando el MISMO ID que Auth
    const { data: systemUserData, error: systemUserError } = await adminClient
      .from("system_users")
      .insert({
        id: authUserId, // ← CRÍTICO: debe coincidir con auth.users para que funcione el login
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

      // Revertir: eliminar el usuario de Auth para mantener consistencia
      await adminClient.auth.admin.deleteUser(authUserId);

      return NextResponse.json(
        { error: "Error al crear el usuario en la base de datos" },
        { status: 500 },
      );
    }

    // 3. Crear perfil en la tabla profiles (para el sistema de roles)
    const role = isAdmin ? "Administrador" : "Recepcionista";
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authUserId,
        role: role,
        full_name: username.trim(),
      });

    if (profileError) {
      console.error("Error al crear perfil:", profileError);
      // No es fatal, pero lo registramos
    }

    // No retornar el hash en la respuesta
    const { password_hash, ...userData } = systemUserData;
    return NextResponse.json(
      {
        ...userData,
        canLogin: true,
        message: "Usuario creado correctamente. Puede hacer login.",
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

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Servicio de autenticación no disponible" },
        { status: 503 },
      );
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 1. Actualizar en Supabase Auth (para que el login funcione con la nueva contraseña)
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword },
    );

    if (authError) {
      console.error("Error al actualizar contraseña en Auth:", authError);
      return NextResponse.json(
        { error: "Error al actualizar la contraseña en el sistema de autenticación" },
        { status: 500 },
      );
    }

    // 2. Actualizar en system_users
    const { error: dbError } = await adminClient
      .from("system_users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (dbError) {
      console.error("Error al actualizar contraseña en system_users:", dbError);
      return NextResponse.json(
        { error: "Error al actualizar la contraseña en la base de datos" },
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

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Servicio de autenticación no disponible" },
        { status: 503 },
      );
    }

    // Verificar si el username o email ya están en uso por otro usuario
    const { data: existingUser } = await adminClient
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

    // Actualizar en system_users
    const { data, error } = await adminClient
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

// DELETE - Eliminar usuario
export async function DELETE(request: Request) {
  try {
    const { userIdToDelete, adminEmail, adminPassword } = await request.json();

    if (!userIdToDelete || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Faltan datos requeridos para la eliminación" },
        { status: 400 },
      );
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Servicio de autenticación no disponible" },
        { status: 503 },
      );
    }

    // Verificar contraseña intentando hacer login con Supabase Auth
    // Esto asegura que probamos la contraseña real con la que ingresó sin depender de la tabla system_users
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: authData, error: signInError } = await tempClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError || !authData.user) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    // Verificar si el usuario que validó la contraseña es Administrador
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "Administrador") {
      // Fallback: revisar en la tabla system_users por si el rol solo está allí
      const { data: adminUser } = await adminClient
        .from("system_users")
        .select("is_admin")
        .eq("email", adminEmail)
        .maybeSingle();

      if (!adminUser?.is_admin) {
        return NextResponse.json(
          { error: "No tienes permisos de administrador para borrar usuarios" },
          { status: 403 },
        );
      }
    }

    // Eliminar de Supabase Auth
    const { error: authError } =
      await adminClient.auth.admin.deleteUser(userIdToDelete);
    if (authError) {
      console.error("Error al eliminar en Auth:", authError);
      // Continuar aunque falle Auth (puede que no exista)
    }

    // Eliminar de system_users
    const { error: dbError } = await adminClient
      .from("system_users")
      .delete()
      .eq("id", userIdToDelete);

    if (dbError) {
      return NextResponse.json(
        { error: "Error al eliminar el usuario de la base de datos" },
        { status: 500 },
      );
    }

    // Eliminar profile si existe
    await adminClient.from("profiles").delete().eq("id", userIdToDelete);

    return NextResponse.json(
      { success: true, message: "Usuario eliminado" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en DELETE /api/users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
