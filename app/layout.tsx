import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alfa Club",
  description: "Sistema de gestión para Alfa Club",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Previene zoom manual en iOS (opcional, puede afectar accesibilidad)
  userScalable: false, // Deshabilita zoom pinch (opcional, puede afectar accesibilidad)
  themeColor: "#DC2626", // Color de tema para la barra de estado en móviles
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
