"use client";

import { ClipboardList, KeyRound, Mail, PawPrint, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import accessStyles from "../../../shared/styles/PublicAccess.module.css";
import { PublicRequirementForm } from "../../public-requirement/components/PublicRequirementForm";
import { useLoginExperience } from "../hooks/useLoginExperience";
import { ChatRequirementForm } from "./ChatRequirementForm";
import { LoginForm } from "./LoginForm";

export function LoginExperience() {
  const value = useLoginExperience();
  return <main className={accessStyles.page}>
    <section className={accessStyles.panel}>
      <div className={`brand ${accessStyles.brand}`}><strong>Requerimientos MKT-UTI</strong><span>Acceso seguro por cuenta local o Microsoft</span></div>
      <LoginForm />
      {value.brand.showOffice365Login && <button className="button secondary full" type="button" title="Iniciar flujo de autenticación Microsoft Entra ID" onClick={() => void value.microsoftLogin()}><Mail size={16} /> Ingresar con Office 365</button>}
      <Link className="button secondary full" href="/forgot-password" title="Recuperar contraseña con clave temporal"><KeyRound size={16} /> Recuperar contraseña</Link>
      {(value.showPublicPopup || value.showPublicFullPage) && <div className={accessStyles.actions}>
        {value.showPublicPopup && <button className="button secondary full" type="button" onClick={() => value.setIsPublicFormOpen(true)}><ClipboardList size={16} /> Crear requerimiento sin login</button>}
        {value.showPublicFullPage && <Link className="button secondary full" href="/public-requirement"><ClipboardList size={16} /> Abrir formulario completo</Link>}
      </div>}
      {(value.message || value.brand.showDemoCredentials) && <p className="hint"><KeyRound size={14} /> {value.message || "Usa admin@local.test / Admin123!"}</p>}
    </section>
    {value.isPublicFormOpen && <AccessibleDialog labelledBy="public-requirement-title" onClose={() => value.setIsPublicFormOpen(false)} panelClassName={accessStyles.publicDialog}>
      <div className="card-head"><div><h2 id="public-requirement-title">Crear requerimiento</h2><p>Formulario público sin inicio de sesión</p></div><button autoFocus className="icon-button" type="button" aria-label="Cerrar formulario público" onClick={() => value.setIsPublicFormOpen(false)}><X size={16} /></button></div>
      <PublicRequirementForm availability={value.availability.popup} onCancel={() => value.setIsPublicFormOpen(false)} />
    </AccessibleDialog>}
    {value.showChatbot && <button className={accessStyles.chatbotLauncher} type="button" aria-label="Abrir asistente Puma" onClick={() => value.setIsChatOpen(true)}>{value.brand.chatbotIcon ? <Image src={value.brand.chatbotIcon} alt="" width={24} height={24} unoptimized /> : <PawPrint size={24} />}</button>}
    {value.showChatbot && value.isChatOpen && <AccessibleDialog labelledBy="chatbot-title" onClose={() => value.setIsChatOpen(false)} panelClassName={accessStyles.chatbotPanel}>
      <div className="card-head"><div><h2 id="chatbot-title">Asistente Puma</h2><p>Crear requerimiento rápido</p></div><button autoFocus className="icon-button" type="button" aria-label="Cerrar asistente" onClick={() => value.setIsChatOpen(false)}><X size={16} /></button></div>
      <ChatRequirementForm onSubmit={value.submitChat} message={value.chatMessage} />
    </AccessibleDialog>}
  </main>;
}
