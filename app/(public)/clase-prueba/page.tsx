import TrialRegistrationForm from "./_components/TrialRegistrationForm";
import Image from "next/image";

export const metadata = {
  title: "Clase de Prueba - Alfa Club",
  description: "Registrate para tu clase de prueba gratuita en Alfa Club",
};

export default function ClasePruebaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/Mejor logo.png"
              alt="Alfa Club Logo"
              width={200}
              height={200}
              className="w-40 h-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clase de Prueba
          </h1>
          <p className="text-gray-600 text-base">
            Completá el formulario para reservar tu clase gratuita
          </p>
        </div>

        {/* Formulario */}
        <TrialRegistrationForm />
      </div>
    </div>
  );
}
