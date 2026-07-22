import type { Metadata } from "next";
import "./globals.css";
import { ToastViewport } from "./toast";

export const metadata: Metadata = {
  title: "Requerimientos MKT-UTI",
  description: "Gestión de requerimientos, productos, evidencias y aprobaciones"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#app-content">Saltar al contenido principal</a>
        <div id="app-content" tabIndex={-1}>{children}</div>
        <ToastViewport />
      </body>
    </html>
  );
}
