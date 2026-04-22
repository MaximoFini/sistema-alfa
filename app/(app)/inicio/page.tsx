import { Suspense } from "react";
import AlumnosList from "./_components/AlumnosList";
import InicioLoading from "./loading";

export default function InicioPage() {
  return (
    <Suspense fallback={<InicioLoading />}>
      <AlumnosList />
    </Suspense>
  );
}
