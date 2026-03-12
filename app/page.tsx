"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    router.push("/inicio")
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel - logo & dark background */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative bg-white">
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
              <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 bg-white focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-orange-100 transition-all">
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
                  className="text-xs font-medium text-[#f97316] hover:brightness-110 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 bg-white focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-orange-100 transition-all">
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

            {/* Submit */}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-white text-sm transition-all hover:brightness-110 active:scale-[0.98] mt-1"
              style={{ backgroundColor: "#f97316" }}
            >
              Iniciar Sesión
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{" "}
            <button className="font-semibold text-[#f97316] hover:brightness-110 transition-colors">
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
