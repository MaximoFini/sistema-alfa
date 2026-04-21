"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { validateUserForLogin } from "@/lib/auth";
import { triggerHapticFeedback, HapticPresets } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Timeout de seguridad para evitar loading infinito
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setErrorMsg("Tiempo de espera agotado. Intenta nuevamente.");
    }, 10000); // 10 segundos

    try {
      triggerHapticFeedback(HapticPresets.light);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        clearTimeout(loadingTimeout);
        triggerHapticFeedback(HapticPresets.error);
        console.error("Login error:", error);
        setErrorMsg("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      // Validación optimizada en una sola consulta
      const userId = data.user?.id;
      if (!userId) {
        clearTimeout(loadingTimeout);
        triggerHapticFeedback(HapticPresets.error);
        setErrorMsg("Error al obtener datos del usuario.");
        setLoading(false);
        return;
      }

      console.log("User ID:", userId);
      const validation = await validateUserForLogin(userId);
      console.log("Validation result:", validation);

      if (!validation.isValid) {
        clearTimeout(loadingTimeout);
        triggerHapticFeedback(HapticPresets.error);
        await supabase.auth.signOut();
        setErrorMsg(validation.errorMessage || "Error de validación.");
        setLoading(false);
        return;
      }

      // Login exitoso
      triggerHapticFeedback(HapticPresets.success);
      
      // Esperar un momento para que las cookies se sincronicen
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      clearTimeout(loadingTimeout);
      
      // Usar router.push que funciona mejor con las cookies
      router.push("/inicio");
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error("Unexpected error during login:", error);
      setErrorMsg("Error inesperado. Intenta nuevamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel - logo & dark background */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative bg-[#fb923c]">
        {/* Subtle texture overlay */}

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Mejor logo.png"
            alt="Alfa Club Logo"
            width={320}
            style={{ height: "auto" }}
            className="drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Mejor logo.png"
              alt="Alfa Club Logo"
              width={120}
              style={{ height: "auto" }}
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Bienvenido de nuevo
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 bg-white focus-within:border-[#fb923c] focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-[#fb923c] hover:brightness-110 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 bg-white focus-within:border-[#fb923c] focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <Lock size={16} className="text-gray-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm font-medium text-red-600">{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110 active:scale-[0.98] mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#fb923c" }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{" "}
            <button className="font-semibold text-[#fb923c] hover:brightness-110 transition-colors">
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
