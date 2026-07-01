"use client";

import { AppNav } from "../nav";
import { api, applyBrandVariables, defaultBrandSettings, showToast, t, type BrandSettings } from "../lib";
import { Image as ImageIcon, ImageUp, LogIn, Menu, MousePointer2, Palette, RotateCcw, Save, Type, X } from "lucide-react";
import { useEffect, useState } from "react";

type BrandCategory = "textos" | "colores" | "botones" | "tipografia" | "cabecera" | "logo" | "login";

const categoryMeta: Array<{ id: BrandCategory; title: string; description: string; icon: typeof Type }> = [
  { id: "textos", title: "Textos", description: "Título y subtítulo institucional.", icon: Type },
  { id: "colores", title: "Colores", description: "Paleta visual de la aplicación.", icon: Palette },
  { id: "botones", title: "Botones", description: "Colores de acciones y estados.", icon: MousePointer2 },
  { id: "tipografia", title: "Tipografía", description: "Fuente principal del sistema.", icon: Type },
  { id: "cabecera", title: "Cabecera y menú", description: "Alineación, menú y plegado.", icon: Menu },
  { id: "logo", title: "Logo e imágenes", description: "Logo principal e icono del robot.", icon: ImageIcon },
  { id: "login", title: "Login público", description: "Formulario externo y robot Puma.", icon: LogIn }
];

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandSettings>(defaultBrandSettings);
  const [message, setMessage] = useState("Seleccione una categoría para configurar la marca.");
  const [activeCategory, setActiveCategory] = useState<BrandCategory | "">("");

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function load() {
    const brand = await api<BrandSettings>("/api/identity/brand-settings");
    const initial = { ...defaultBrandSettings, ...brand };
    setSettings(initial);
    applyBrandVariables(initial);
  }

  async function saveSettings() {
    const saved = await api<BrandSettings>("/api/identity/brand-settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });
    setSettings({ ...defaultBrandSettings, ...saved });
    applyBrandVariables(saved);
    window.dispatchEvent(new Event("brand-settings-changed"));
    setMessage(`${categoryTitle(activeCategory)} guardado correctamente.`);
    showToast("Marca global guardada correctamente.");
    setActiveCategory("");
  }

  async function restore() {
    const saved = await api<BrandSettings>("/api/identity/brand-settings", {
      method: "PUT",
      body: JSON.stringify(defaultBrandSettings)
    });
    setSettings({ ...defaultBrandSettings, ...saved });
    applyBrandVariables(saved);
    window.dispatchEvent(new Event("brand-settings-changed"));
    setMessage("Marca restaurada a valores Indoamérica.");
    showToast("Marca restaurada.");
  }

  function loadImage(field: "logo" | "chatbotIcon", file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettings((current) => ({ ...current, [field]: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        <section className="panel">
          <div className="card-head">
            <div>
              <h2>Manejo Marca</h2>
              <p>Configure cada grupo desde su popup. La pantalla principal muestra el resumen de parametrización.</p>
            </div>
            <div className="actions">
              <button className="button secondary" type="button" title="Restaurar marca base de Indoamérica" onClick={restore}><RotateCcw size={16} /> Restaurar</button>
            </div>
          </div>
          <span className="badge top-space">{message}</span>

          <div className="brand-settings-grid top-space">
            {categoryMeta.map((category) => {
              const Icon = category.icon;
              return (
                <button className="brand-category-card" type="button" key={category.id} onClick={() => setActiveCategory(category.id)} title={`Configurar ${category.title}`}>
                  <Icon size={20} />
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                  <em>{categorySummary(category.id, settings)}</em>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel preview-section top-space">
          <div className="card-head">
            <h2>{t("Vista previa")}</h2>
            <span className="badge"><ImageUp size={14} /> Logo, colores, textos y botones</span>
          </div>
          <article className="brand-preview top-space" style={{ borderColor: settings.accent, background: settings.primary }}>
            <img src={settings.logo} alt="Logo institucional" />
            <div>
              <h3>{settings.title}</h3>
              <p>{settings.subtitle}</p>
            </div>
          </article>
          <article className="card top-space">
            <div className="card-head">
              <div>
                <h3>Controles</h3>
                <p>Vista de botones, campos y textos con la parametrización actual.</p>
              </div>
              <span className="badge">Look & feel</span>
            </div>
            <div className="actions">
              <button className="button" type="button">Principal</button>
              <button className="button secondary" type="button">Secundario</button>
              <button className="button success" type="button">Aprobado</button>
              <button className="button warning" type="button">Alerta</button>
              <button className="button danger" type="button">Error</button>
            </div>
          </article>
        </section>

        {activeCategory && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <div>
                  <h2>{categoryTitle(activeCategory)}</h2>
                  <p>{categoryDescription(activeCategory)}</p>
                </div>
                <button className="icon-button" type="button" title="Cerrar parametrización" onClick={() => setActiveCategory("")}><X size={16} /></button>
              </div>
              <div className="form top-space">
                {activeCategory === "textos" && (
                  <>
                    <label className="field"><span>{t("Título")}</span><input required maxLength={120} value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} /></label>
                    <label className="field"><span>{t("Subtítulo")}</span><input required maxLength={180} value={settings.subtitle} onChange={(event) => setSettings({ ...settings, subtitle: event.target.value })} /></label>
                  </>
                )}
                {activeCategory === "colores" && (
                  <>
                    <ColorField label="Color principal" value={settings.primary} onChange={(primary) => setSettings({ ...settings, primary })} />
                    <ColorField label="Color principal oscuro" value={settings.primaryDark} onChange={(primaryDark) => setSettings({ ...settings, primaryDark })} />
                    <ColorField label="Amarillo acento" value={settings.accent} onChange={(accent) => setSettings({ ...settings, accent })} />
                    <ColorField label="Fondo aplicación" value={settings.background} onChange={(background) => setSettings({ ...settings, background })} />
                    <ColorField label="Paneles y tarjetas" value={settings.surface} onChange={(surface) => setSettings({ ...settings, surface })} />
                    <ColorField label="Texto principal" value={settings.foreground} onChange={(foreground) => setSettings({ ...settings, foreground })} />
                    <ColorField label="Texto secundario" value={settings.muted} onChange={(muted) => setSettings({ ...settings, muted })} />
                    <ColorField label="Bordes" value={settings.line} onChange={(line) => setSettings({ ...settings, line })} />
                    <ColorField label="Texto barra superior" value={settings.topbarText} onChange={(topbarText) => setSettings({ ...settings, topbarText })} />
                  </>
                )}
                {activeCategory === "botones" && (
                  <>
                    <ColorField label="Texto botones" value={settings.buttonText} onChange={(buttonText) => setSettings({ ...settings, buttonText })} />
                    <ColorField label="Botón secundario" value={settings.secondary} onChange={(secondary) => setSettings({ ...settings, secondary })} />
                    <ColorField label="Texto botón secundario" value={settings.secondaryText} onChange={(secondaryText) => setSettings({ ...settings, secondaryText })} />
                    <ColorField label="Éxito" value={settings.success} onChange={(success) => setSettings({ ...settings, success })} />
                    <ColorField label="Advertencia" value={settings.warning} onChange={(warning) => setSettings({ ...settings, warning })} />
                    <ColorField label="Error / peligro" value={settings.danger} onChange={(danger) => setSettings({ ...settings, danger })} />
                  </>
                )}
                {activeCategory === "tipografia" && (
                  <label className="field field-wide">
                    <span>Tipografía</span>
                    <select value={settings.fontFamily} onChange={(event) => setSettings({ ...settings, fontFamily: event.target.value })}>
                      <option value="Segoe UI, Arial, Helvetica, sans-serif">Segoe UI</option>
                      <option value="Arial, Helvetica, sans-serif">Arial</option>
                      <option value="Tahoma, Arial, sans-serif">Tahoma</option>
                      <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                    </select>
                  </label>
                )}
                {activeCategory === "cabecera" && (
                  <>
                    <label className="field"><span>Modo de menú</span><select value={settings.menuMode} onChange={(event) => setSettings({ ...settings, menuMode: event.target.value as BrandSettings["menuMode"] })}><option value="horizontal">Horizontal bajo cabecera</option><option value="vertical">Vertical lateral</option></select></label>
                    <label className="field"><span>Alineación texto cabecera</span><select value={settings.headerTextAlign} onChange={(event) => setSettings({ ...settings, headerTextAlign: event.target.value as BrandSettings["headerTextAlign"] })}><option value="center">Centrado</option><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>
                    <label className="field"><span>Ubicación vertical texto</span><select value={settings.headerTextPosition} onChange={(event) => setSettings({ ...settings, headerTextPosition: event.target.value as BrandSettings["headerTextPosition"] })}><option value="middle">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option></select></label>
                    {settings.menuMode === "vertical" && <label className="check-field"><input type="checkbox" checked={settings.menuCollapsed} onChange={(event) => setSettings({ ...settings, menuCollapsed: event.target.checked })} /> Menú vertical plegado</label>}
                    <label className="check-field"><input type="checkbox" checked={settings.mobileMenuCollapsed} onChange={(event) => setSettings({ ...settings, mobileMenuCollapsed: event.target.checked })} /> Menú móvil lateral plegado por defecto</label>
                  </>
                )}
                {activeCategory === "logo" && (
                  <>
                    <label className="field"><span>URL del logo</span><input value={settings.logo.startsWith("data:") ? "Logo cargado desde archivo" : settings.logo} onChange={(event) => setSettings({ ...settings, logo: event.target.value })} /></label>
                    <label className="field"><span>Icono Puma chatbot</span><input value={settings.chatbotIcon?.startsWith("data:") ? "Icono cargado desde archivo" : settings.chatbotIcon} onChange={(event) => setSettings({ ...settings, chatbotIcon: event.target.value })} /></label>
                    <label className="field"><span>Cargar logo</span><input type="file" accept="image/*" onChange={(event) => loadImage("logo", event.target.files?.[0])} /></label>
                    <label className="field"><span>Cargar icono robot</span><input type="file" accept="image/*" onChange={(event) => loadImage("chatbotIcon", event.target.files?.[0])} /></label>
                  </>
                )}
                {activeCategory === "login" && (
                  <>
                    <label className="check-field"><input type="checkbox" checked={settings.showPublicRequirementForm} onChange={(event) => setSettings({ ...settings, showPublicRequirementForm: event.target.checked })} /> Mostrar botón Crear requerimiento sin login</label>
                    <label className="check-field"><input type="checkbox" checked={settings.showPublicRequirementFullPage} onChange={(event) => setSettings({ ...settings, showPublicRequirementFullPage: event.target.checked })} /> Mostrar botón Abrir formulario completo</label>
                    <label className="check-field"><input type="checkbox" checked={settings.showLoginChatbot} onChange={(event) => setSettings({ ...settings, showLoginChatbot: event.target.checked })} /> Mostrar robot Puma en login</label>
                    <label className="check-field"><input type="checkbox" checked={settings.showDemoCredentials} onChange={(event) => setSettings({ ...settings, showDemoCredentials: event.target.checked })} /> Mostrar credenciales de prueba en login</label>
                    <label className="check-field"><input type="checkbox" checked={settings.showOffice365Login} onChange={(event) => setSettings({ ...settings, showOffice365Login: event.target.checked })} /> Mostrar ingreso con Office 365</label>
                  </>
                )}
                <div className="form-actions">
                  <button className="button" type="button" onClick={saveSettings}><Save size={16} /> Guardar</button>
                  <button className="button secondary" type="button" onClick={() => setActiveCategory("")}>Cancelar</button>
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function categoryTitle(category: BrandCategory | "") {
  return categoryMeta.find((item) => item.id === category)?.title ?? "Marca";
}

function categoryDescription(category: BrandCategory) {
  return categoryMeta.find((item) => item.id === category)?.description ?? "";
}

function categorySummary(category: BrandCategory, settings: BrandSettings) {
  const summaries: Record<BrandCategory, string> = {
    textos: settings.title,
    colores: `${settings.primary} | ${settings.accent}`,
    botones: `Principal ${settings.primary} | Éxito ${settings.success}`,
    tipografia: settings.fontFamily.split(",")[0],
    cabecera: `${settings.menuMode} | ${settings.headerTextAlign} | móvil ${settings.mobileMenuCollapsed ? "plegado" : "abierto"}`,
    logo: settings.logo.startsWith("data:") ? "Logo cargado" : "URL configurada",
    login: [
      settings.showPublicRequirementForm ? "Popup" : "",
      settings.showPublicRequirementFullPage ? "Formulario" : "",
      settings.showLoginChatbot ? "Robot" : "",
      settings.showDemoCredentials ? "Credenciales" : "",
      settings.showOffice365Login ? "Office 365" : ""
    ].filter(Boolean).join(" | ") || "Oculto"
  };
  return summaries[category];
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
