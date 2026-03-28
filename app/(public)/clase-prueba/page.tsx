import TrialRegistrationForm from "./_components/TrialRegistrationForm";
import Image from "next/image";

export const metadata = {
  title: "Clase de Prueba - Alfa Club",
  description: "Registrate para tu clase de prueba gratuita en Alfa Club",
};

export default function ClasePruebaPage() {
  return (
    <div className="h-[100dvh] w-full overflow-y-auto flex flex-col items-center px-4 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-md my-auto shrink-0">
        <TrialRegistrationForm />
      </div>
    </div>
  );
}
