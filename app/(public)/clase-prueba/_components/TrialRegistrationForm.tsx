"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const ACTIVIDADES = ["Boxeo", "MMA", "Kick-boxing", "Jiu-Jitsu", "Lucha"];

interface FormData {
  nombre: string;
  dni: string;
  telefono: string;
  fecha_nacimiento: string;
  direccion: string;
  genero: string;
  actividad: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function TrialRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    dni: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
    genero: "",
    actividad: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setErrorMessage("");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido";
    } else if (!/^\d{7,8}$/.test(formData.dni.trim())) {
      newErrors.dni = "El DNI debe tener 7 u 8 dígitos";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = "La fecha de nacimiento es requerida";
    } else {
      const fecha = new Date(formData.fecha_nacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      if (edad < 5 || edad > 120) {
        newErrors.fecha_nacimiento = "Por favor, verifica la fecha";
      }
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es requerida";
    }

    if (!formData.genero) {
      newErrors.genero = "El género es requerido";
    }

    if (!formData.actividad) {
      newErrors.actividad = "Debes seleccionar una actividad";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/trial-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "TRIAL_ALREADY_REGISTERED") {
          setErrorMessage(
            "Ya existe un registro de clase de prueba con este DNI. Por favor, contactá al gimnasio."
          );
        } else if (data.code === "ALREADY_MEMBER") {
          setErrorMessage(
            "Este DNI ya está registrado como alumno del gimnasio."
          );
        } else {
          setErrorMessage(
            data.error || "Ocurrió un error. Por favor, intentá nuevamente."
          );
        }
        return;
      }

      // Éxito
      setSuccess(true);
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setErrorMessage(
        "Error de conexión. Por favor, verificá tu conexión a internet e intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  return (
    <>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/Mejor logo.png"
            alt="Alfa Club Logo"
            width={150}
            height={150}
            className="w-[120px] h-auto"
            priority
          />
        </div>
        {!success && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Clase de Prueba
            </h1>
            <p className="text-gray-600 text-base">
              Completá el formulario para reservar tu clase gratuita
            </p>
          </div>
        )}
      </div>

      {success ? (
        <Card className="shadow-lg border-0 animate-in zoom-in-95 duration-500">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500 delay-200 fill-green-50" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Registro Exitoso!
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Tu clase de prueba de <strong>{formData.actividad}</strong> ha sido
              confirmada.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-orange-900 mb-3 text-center">
                Próximos Pasos:
              </h3>
              <ul className="space-y-2 text-orange-800 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Ingresá tu DNI en el sistema cuando llegues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>¡Disfrutá tu clase de prueba!</span>
                </li>
              </ul>
            </div>
            <div className="text-sm text-gray-500 mb-6">
              <p className="font-medium text-gray-700 mb-1">
                Alfa Club
              </p>
              <p>Tus datos ya están registrados en el sistema</p>
            </div>
            <Button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  nombre: "",
                  dni: "",
                  telefono: "",
                  fecha_nacimiento: "",
                  direccion: "",
                  genero: "",
                  actividad: "",
                });
              }}
              variant="outline"
              className="w-full"
            >
              Registrar otra persona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-5">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* Nombre Completo */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Juan Pérez"
                  aria-invalid={!!errors.nombre}
                  className={errors.nombre ? "border-red-500" : ""}
                />
                {errors.nombre && (
                  <p className="text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              {/* DNI */}
              <div className="space-y-2">
                <Label htmlFor="dni">
                  DNI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={formData.dni}
                  onChange={(e) => handleChange("dni", e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678"
                  aria-invalid={!!errors.dni}
                  className={errors.dni ? "border-red-500" : ""}
                />
                {errors.dni && <p className="text-sm text-red-600">{errors.dni}</p>}
              </div>

              {/* Fecha de Nacimiento */}
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  aria-invalid={!!errors.fecha_nacimiento}
                  className={errors.fecha_nacimiento ? "border-red-500" : ""}
                />
                {errors.fecha_nacimiento && (
                  <p className="text-sm text-red-600">{errors.fecha_nacimiento}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="2233445566"
                  aria-invalid={!!errors.telefono}
                  className={errors.telefono ? "border-red-500" : ""}
                />
                {errors.telefono && (
                  <p className="text-sm text-red-600">{errors.telefono}</p>
                )}
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <Label htmlFor="direccion">
                  Dirección <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="direccion"
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Calle 123, Ciudad"
                  aria-invalid={!!errors.direccion}
                  className={errors.direccion ? "border-red-500" : ""}
                />
                {errors.direccion && (
                  <p className="text-sm text-red-600">{errors.direccion}</p>
                )}
              </div>

              {/* Género */}
              <div className="space-y-2">
                <Label htmlFor="genero">
                  Género <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.genero} onValueChange={(value) => handleChange("genero", value)}>
                  <SelectTrigger
                    id="genero"
                    className={`w-full ${errors.genero ? "border-red-500" : ""}`}
                    aria-invalid={!!errors.genero}
                  >
                    <SelectValue placeholder="Seleccioná tu género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.genero && (
                  <p className="text-sm text-red-600">{errors.genero}</p>
                )}
              </div>

              {/* Actividad */}
              <div className="space-y-2">
                <Label htmlFor="actividad">
                  ¿Qué actividad querés probar? <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.actividad}
                  onValueChange={(value) => handleChange("actividad", value)}
                >
                  <SelectTrigger
                    id="actividad"
                    className={`w-full ${errors.actividad ? "border-red-500" : ""}`}
                    aria-invalid={!!errors.actividad}
                  >
                    <SelectValue placeholder="Seleccioná una actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVIDADES.map((act) => (
                      <SelectItem key={act} value={act}>
                        {act}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.actividad && (
                  <p className="text-sm text-red-600">{errors.actividad}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pb-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Confirmar Registro"
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                Al registrarte, aceptás que tus datos sean utilizados para
                gestionar tu clase de prueba
              </p>
            </CardFooter>
          </form>
        </Card>
      )}
    </>
  );
}
