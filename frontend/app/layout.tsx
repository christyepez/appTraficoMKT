import type { Metadata } from "next";
import "./globals.css";
import { ToastViewport } from "./toast";

export const metadata: Metadata = {
  title: "Requirements Platform",
  description: "Requirement intake, activity tracking, evidence and approvals"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
