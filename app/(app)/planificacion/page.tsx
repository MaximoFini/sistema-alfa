"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Dumbbell, Library, Plus } from "lucide-react";

export default function PlanificacionPage() {
  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Planificación</h1>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/planificacion/planificador">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <Plus className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-gray-900">Nuevo Plan</CardTitle>
                <CardDescription className="text-gray-600">
                  Crea un plan de entrenamiento personalizado
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/planificacion/planes">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <Library className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-gray-900">
                  Biblioteca de Planes
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Gestiona y organiza tus planes guardados
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/planificacion/base-ejercicios">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <Dumbbell className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-gray-900">
                  Base de Ejercicios
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Administra tu biblioteca de ejercicios
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
