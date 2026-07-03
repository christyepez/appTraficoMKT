"use client";

import { AppNav } from "../nav";
import { api, applyBrandVariables, defaultBrandSettings, showToast, t, type BrandSettings } from "../lib";
import { Bold, ClipboardList, Image as ImageIcon, ImageUp, Italic, ListOrdered, LogIn, Menu, MousePointer2, Palette, RotateCcw, Save, Type, Underline, X } from "lucide-react";
import { useEffect, useState } from "react";

type BrandCategory = "textos" | "colores" | "botones" | "tipografia" | "cabecera" | "menu" | "formularios" | "logo" | "login";

const categoryMeta: Array<{ id: BrandCategory; title: string; description: string; icon: typeof Type }> = [
  { id: "textos", title: "Textos", description: "Título y subtítulo institucional.", icon: Type },
  { id: "colores", title: "Colores", description: "Paleta visual de la aplicación.", icon: Palette },
  { id: "botones", title: "Botones", description: "Colores de acciones y estados.", icon: MousePointer2 },
  { id: "tipografia", title: "Tipografía", description: "Fuente principal del sistema.", icon: Type },
  { id: "cabecera", title: "Cabecera", description: "Alineación y ubicación del texto.", icon: Menu },
  { id: "menu", title: "Administrar menú", description: "Presentación y orden de las opciones.", icon: ListOrdered },
  { id: "formularios", title: "Formularios", description: "Visibilidad de campos administrados por el sistema.", icon: ClipboardList },
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
    try {
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
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo guardar la configuración de marca.", "error");
    }
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
    if (!file.type.startsWith("image/")) {
      showToast("Seleccione un archivo de imagen válido.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("La imagen no puede superar 2 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings((current) => ({ ...current, [field]: String(reader.result) }));
      showToast(field === "logo" ? "Logo listo para guardar." : "Icono listo para guardar.");
    };
    reader.onerror = () => showToast("No se pudo leer la imagen seleccionada.", "error");
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
          <article className="brand-preview top-space" style={{ borderColor: settings.accent, background: settings.headerUseGradient ? `linear-gradient(${settings.headerGradientDirection}, ${settings.headerColor}, ${settings.headerGradientColor})` : settings.headerColor }}>
            <img src={settings.logo} alt="Logo institucional" />
            <div>
              {settings.showHeaderTitle && <h3 style={{ color: settings.headerTitleColor, fontSize: settings.headerTitleSize, fontWeight: settings.headerTitleWeight, fontStyle: settings.headerTitleItalic ? "italic" : "normal", textDecoration: settings.headerTitleUnderline ? "underline" : "none" }}>{settings.title}</h3>}
              {settings.showHeaderSubtitle && <p style={{ color: settings.headerSubtitleColor, fontSize: settings.headerSubtitleSize, fontWeight: settings.headerSubtitleWeight, fontStyle: settings.headerSubtitleItalic ? "italic" : "normal", textDecoration: settings.headerSubtitleUnderline ? "underline" : "none" }}>{settings.subtitle}</p>}
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
                    <h3 className="field-wide settings-group-title">{t("Título")}</h3>
                    <label className="field field-wide"><span>Contenido del título</span><input required maxLength={120} value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} /></label>
                    <label className="check-field"><input type="checkbox" checked={settings.showHeaderTitle} onChange={(event) => setSettings({ ...settings, showHeaderTitle: event.target.checked })} /> Mostrar título en cabecera</label>
                    <label className="field"><span>Tamaño del título</span><input type="number" min={14} max={32} value={settings.headerTitleSize} onChange={(event) => setSettings({ ...settings, headerTitleSize: Number(event.target.value) })} /></label>
                    <ColorField label="Color del título" value={settings.headerTitleColor} onChange={(headerTitleColor) => setSettings({ ...settings, headerTitleColor })} />
                    <RichTextToolbar bold={settings.headerTitleWeight === "700"} italic={settings.headerTitleItalic} underline={settings.headerTitleUnderline} onBold={() => setSettings({ ...settings, headerTitleWeight: settings.headerTitleWeight === "700" ? "400" : "700" })} onItalic={() => setSettings({ ...settings, headerTitleItalic: !settings.headerTitleItalic })} onUnderline={() => setSettings({ ...settings, headerTitleUnderline: !settings.headerTitleUnderline })} />
                    <h3 className="field-wide settings-group-title">{t("Subtítulo")}</h3>
                    <label className="field field-wide"><span>Contenido del subtítulo</span><input required maxLength={180} value={settings.subtitle} onChange={(event) => setSettings({ ...settings, subtitle: event.target.value })} /></label>
                    <label className="check-field"><input type="checkbox" checked={settings.showHeaderSubtitle} onChange={(event) => setSettings({ ...settings, showHeaderSubtitle: event.target.checked })} /> Mostrar subtítulo en cabecera</label>
                    <label className="field"><span>Tamaño del subtítulo</span><input type="number" min={10} max={24} value={settings.headerSubtitleSize} onChange={(event) => setSettings({ ...settings, headerSubtitleSize: Number(event.target.value) })} /></label>
                    <ColorField label="Color del subtítulo" value={settings.headerSubtitleColor} onChange={(headerSubtitleColor) => setSettings({ ...settings, headerSubtitleColor })} />
                    <RichTextToolbar bold={settings.headerSubtitleWeight === "700"} italic={settings.headerSubtitleItalic} underline={settings.headerSubtitleUnderline} onBold={() => setSettings({ ...settings, headerSubtitleWeight: settings.headerSubtitleWeight === "700" ? "400" : "700" })} onItalic={() => setSettings({ ...settings, headerSubtitleItalic: !settings.headerSubtitleItalic })} onUnderline={() => setSettings({ ...settings, headerSubtitleUnderline: !settings.headerSubtitleUnderline })} />
                  </>
                )}
                {activeCategory === "colores" && (
                  <>
                    <ColorField label="Amarillo acento" value={settings.accent} onChange={(accent) => setSettings({ ...settings, accent })} />
                    <ColorField label="Fondo aplicación" value={settings.background} onChange={(background) => setSettings({ ...settings, background })} />
                    <ColorField label="Paneles y tarjetas" value={settings.surface} onChange={(surface) => setSettings({ ...settings, surface })} />
                    <ColorField label="Texto principal" value={settings.foreground} onChange={(foreground) => setSettings({ ...settings, foreground })} />
                    <ColorField label="Texto secundario" value={settings.muted} onChange={(muted) => setSettings({ ...settings, muted })} />
                    <ColorField label="Bordes" value={settings.line} onChange={(line) => setSettings({ ...settings, line })} />
                    <ColorField label="Texto barra superior" value={settings.topbarText} onChange={(topbarText) => setSettings({ ...settings, topbarText })} />
                    <h3 className="field-wide settings-group-title">Cabecera</h3>
                    <ColorField label="Color de cabecera" value={settings.headerColor} onChange={(headerColor) => setSettings({ ...settings, headerColor })} />
                    <label className="check-field"><input type="checkbox" checked={settings.headerUseGradient} onChange={(event) => setSettings({ ...settings, headerUseGradient: event.target.checked })} /> Usar degradado en cabecera</label>
                    {settings.headerUseGradient && <>
                      <ColorField label="Color final cabecera" value={settings.headerGradientColor} onChange={(headerGradientColor) => setSettings({ ...settings, headerGradientColor })} />
                      <GradientDirectionField label="Dirección cabecera" value={settings.headerGradientDirection} onChange={(headerGradientDirection) => setSettings({ ...settings, headerGradientDirection })} />
                      <div className="gradient-preview field-wide" style={{ background: `linear-gradient(${settings.headerGradientDirection}, ${settings.headerColor}, ${settings.headerGradientColor})` }}>Vista previa de cabecera</div>
                    </>}
                    <h3 className="field-wide settings-group-title">Menú</h3>
                    <ColorField label="Color del menú" value={settings.menuColor} onChange={(menuColor) => setSettings({ ...settings, menuColor })} />
                    <label className="check-field"><input type="checkbox" checked={settings.menuUseGradient} onChange={(event) => setSettings({ ...settings, menuUseGradient: event.target.checked })} /> Usar degradado en menú</label>
                    {settings.menuUseGradient && <>
                      <ColorField label="Color final menú" value={settings.menuGradientColor} onChange={(menuGradientColor) => setSettings({ ...settings, menuGradientColor })} />
                      <GradientDirectionField label="Dirección menú" value={settings.menuGradientDirection} onChange={(menuGradientDirection) => setSettings({ ...settings, menuGradientDirection })} />
                      <div className="gradient-preview field-wide" style={{ background: `linear-gradient(${settings.menuGradientDirection}, ${settings.menuColor}, ${settings.menuGradientColor})` }}>Vista previa del menú</div>
                    </>}
                  </>
                )}
                {activeCategory === "botones" && (
                  <>
                    <ColorField label="Botón principal" value={settings.primary} onChange={(primary) => setSettings({ ...settings, primary })} />
                    <ColorField label="Botón principal al pasar el cursor" value={settings.primaryDark} onChange={(primaryDark) => setSettings({ ...settings, primaryDark })} />
                    <ColorField label="Texto botones" value={settings.buttonText} onChange={(buttonText) => setSettings({ ...settings, buttonText })} />
                    <label className="check-field"><input type="checkbox" checked={settings.useGradient} onChange={(event) => setSettings({ ...settings, useGradient: event.target.checked })} /> Usar degradado en botón principal</label>
                    {settings.useGradient && <>
                      <ColorField label="Color final botón principal" value={settings.gradientColor} onChange={(gradientColor) => setSettings({ ...settings, gradientColor })} />
                      <GradientDirectionField label="Dirección botón principal" value={settings.gradientDirection} onChange={(gradientDirection) => setSettings({ ...settings, gradientDirection })} />
                      <div className="gradient-preview field-wide" style={{ background: `linear-gradient(${settings.gradientDirection}, ${settings.primary}, ${settings.gradientColor})` }}>Vista previa del botón principal</div>
                    </>}
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
                    <label className="field"><span>Alineación texto cabecera</span><select value={settings.headerTextAlign} onChange={(event) => setSettings({ ...settings, headerTextAlign: event.target.value as BrandSettings["headerTextAlign"] })}><option value="center">Centrado</option><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>
                    <label className="field"><span>Ubicación vertical texto</span><select value={settings.headerTextPosition} onChange={(event) => setSettings({ ...settings, headerTextPosition: event.target.value as BrandSettings["headerTextPosition"] })}><option value="middle">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option></select></label>
                  </>
                )}
                {activeCategory === "menu" && (
                  <>
                    <label className="field"><span>Modo de menú</span><select value={settings.menuMode} onChange={(event) => setSettings({ ...settings, menuMode: event.target.value as BrandSettings["menuMode"] })}><option value="horizontal">Horizontal bajo cabecera</option><option value="vertical">Vertical lateral</option></select></label>
                    {settings.menuMode === "vertical" && <label className="check-field"><input type="checkbox" checked={settings.menuCollapsed} onChange={(event) => setSettings({ ...settings, menuCollapsed: event.target.checked })} /> Menú vertical plegado</label>}
                    <label className="check-field"><input type="checkbox" checked={settings.mobileMenuCollapsed} onChange={(event) => setSettings({ ...settings, mobileMenuCollapsed: event.target.checked })} /> Menú móvil lateral plegado por defecto</label>
                    <div className="menu-order-grid field-wide">
                      <div className="menu-order-row menu-order-head"><strong>Opción</strong><strong>Ruta</strong><strong>Orden</strong></div>
                      {orderedMenuOptions(settings.menuOrder).map((item, index) => <div className="menu-order-row" key={item.key}><span>{item.label}</span><code>/{item.key}</code><input aria-label={`Orden de ${item.label}`} type="number" min={1} max={menuOptions.length} value={index + 1} onChange={(event) => setSettings({ ...settings, menuOrder: moveMenuOption(settings.menuOrder, item.key, Number(event.target.value) - 1) })} /></div>)}
                    </div>
                  </>
                )}
                {activeCategory === "formularios" && (
                  <label className="check-field"><input type="checkbox" checked={settings.showProductIdField} onChange={(event) => setSettings({ ...settings, showProductIdField: event.target.checked })} /> Mostrar Id producto al crear o editar productos</label>
                )}
                {activeCategory === "logo" && (
                  <>
                    <label className="field"><span>URL del logo</span><input value={settings.logo.startsWith("data:") ? "Logo cargado desde archivo" : settings.logo} onChange={(event) => setSettings({ ...settings, logo: event.target.value })} /></label>
                    <label className="field"><span>Icono Puma chatbot</span><input value={settings.chatbotIcon?.startsWith("data:") ? "Icono cargado desde archivo" : settings.chatbotIcon} onChange={(event) => setSettings({ ...settings, chatbotIcon: event.target.value })} /></label>
                    <label className="field"><span>Cargar logo (máximo 2 MB)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => loadImage("logo", event.target.files?.[0])} /></label>
                    <label className="field"><span>Cargar icono robot (máximo 2 MB)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => loadImage("chatbotIcon", event.target.files?.[0])} /></label>
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
    textos: `${settings.showHeaderTitle ? settings.title : "Título oculto"} | ${settings.showHeaderSubtitle ? settings.subtitle : "Subtítulo oculto"}`,
    colores: `Cabecera ${settings.headerUseGradient ? "degradado" : settings.headerColor} | Menú ${settings.menuUseGradient ? "degradado" : settings.menuColor}`,
    botones: `Principal ${settings.useGradient ? "degradado" : settings.primary} | Éxito ${settings.success}`,
    tipografia: settings.fontFamily.split(",")[0],
    cabecera: `${settings.headerTextAlign} | ${settings.headerTextPosition}`,
    menu: `${settings.menuMode} | ${menuOptions.length} opciones ordenadas`,
    formularios: settings.showProductIdField ? "Id producto visible" : "Id producto oculto",
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

const menuOptions = [
  ["dashboard", "Requerimientos"], ["activities", "Productos"], ["evidence", "Adjuntos"], ["approvals", "Aprobaciones"],
  ["metrics", "Métricas"], ["audit", "Auditorías"], ["admin", "Administración"], ["users", "Usuarios"],
  ["storage", "Archivos"], ["initial-import", "Carga inicial"], ["branding", "Manejo Marca"], ["notifications", "Notificaciones"],
  ["my-notifications", "Mis notificaciones"], ["notification-log", "Registro notificaciones"]
].map(([key, label]) => ({ key, label }));

function orderedMenuOptions(value: string) {
  const order = value.split(",").filter(Boolean);
  return [...menuOptions].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

function moveMenuOption(value: string, key: string, target: number) {
  const keys = orderedMenuOptions(value).map((item) => item.key).filter((item) => item !== key);
  keys.splice(Math.max(0, Math.min(target, keys.length)), 0, key);
  return keys.join(",");
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function GradientDirectionField({ label, value, onChange }: { label: string; value: BrandSettings["headerGradientDirection"]; onChange: (value: BrandSettings["headerGradientDirection"]) => void }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value as BrandSettings["headerGradientDirection"])}><option value="135deg">Diagonal</option><option value="to right">Horizontal</option><option value="to bottom">Vertical</option></select></label>;
}

function RichTextToolbar({ bold, italic, underline, onBold, onItalic, onUnderline }: { bold: boolean; italic: boolean; underline: boolean; onBold: () => void; onItalic: () => void; onUnderline: () => void }) {
  return <div className="field rich-text-field"><span>Formato enriquecido</span><div className="rich-text-toolbar"><button className={bold ? "icon-button active" : "icon-button"} type="button" title="Aplicar o quitar negrita" aria-pressed={bold} onClick={onBold}><Bold size={16} /></button><button className={italic ? "icon-button active" : "icon-button"} type="button" title="Aplicar o quitar cursiva" aria-pressed={italic} onClick={onItalic}><Italic size={16} /></button><button className={underline ? "icon-button active" : "icon-button"} type="button" title="Aplicar o quitar subrayado" aria-pressed={underline} onClick={onUnderline}><Underline size={16} /></button></div></div>;
}
