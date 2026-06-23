"use client";

import { AppNav } from "../nav";
import { api, applyBrandVariables, defaultBrandSettings, showToast, t, type BrandSettings } from "../lib";
import { ImageUp, RotateCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandSettings>(defaultBrandSettings);
  const [message, setMessage] = useState("Parametrización visual institucional.");

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function load() {
    const brand = await api<BrandSettings>("/api/identity/brand-settings");
    const initial = { ...defaultBrandSettings, ...brand };
    setSettings(initial);
    applyBrandVariables(initial);
  }

  async function loadLogo(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettings((current) => ({ ...current, logo: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await api<BrandSettings>("/api/identity/brand-settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });
    setSettings({ ...defaultBrandSettings, ...saved });
    applyBrandVariables(saved);
    window.dispatchEvent(new Event("brand-settings-changed"));
    setMessage("Marca global guardada. Se aplicará a todos los usuarios.");
    showToast("Marca global guardada correctamente.");
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

  return (
    <main className="app-shell">
      <AppNav />
      <section className="main-grid">
        <aside className="panel">
          <h2>Manejo Marca</h2>
          <form className="form" onSubmit={save}>
            <div className="form-section-title field-wide"><h3>Textos</h3><button className="button compact" title="Guardar textos de marca"><Save size={14} /> Guardar textos</button></div>
            <label className="field">
              <span>{t("Título")}</span>
              <input required maxLength={80} value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} />
            </label>
            <label className="field">
              <span>{t("Subtítulo")}</span>
              <input required maxLength={180} value={settings.subtitle} onChange={(event) => setSettings({ ...settings, subtitle: event.target.value })} />
            </label>
            <div className="form-section-title field-wide"><h3>Colores</h3><button className="button compact" title="Guardar colores"><Save size={14} /> Guardar colores</button></div>
            <label className="field">
              <span>Color principal</span>
              <input type="color" value={settings.primary} onChange={(event) => setSettings({ ...settings, primary: event.target.value })} />
            </label>
            <label className="field">
              <span>Color principal oscuro</span>
              <input type="color" value={settings.primaryDark} onChange={(event) => setSettings({ ...settings, primaryDark: event.target.value })} />
            </label>
            <label className="field">
              <span>Amarillo acento</span>
              <input type="color" value={settings.accent} onChange={(event) => setSettings({ ...settings, accent: event.target.value })} />
            </label>
            <ColorField label="Fondo aplicación" value={settings.background} onChange={(background) => setSettings({ ...settings, background })} />
            <ColorField label="Paneles y tarjetas" value={settings.surface} onChange={(surface) => setSettings({ ...settings, surface })} />
            <ColorField label="Texto principal" value={settings.foreground} onChange={(foreground) => setSettings({ ...settings, foreground })} />
            <ColorField label="Texto secundario" value={settings.muted} onChange={(muted) => setSettings({ ...settings, muted })} />
            <ColorField label="Bordes" value={settings.line} onChange={(line) => setSettings({ ...settings, line })} />
            <ColorField label="Texto botones" value={settings.buttonText} onChange={(buttonText) => setSettings({ ...settings, buttonText })} />
            <ColorField label="Botón secundario" value={settings.secondary} onChange={(secondary) => setSettings({ ...settings, secondary })} />
            <ColorField label="Texto botón secundario" value={settings.secondaryText} onChange={(secondaryText) => setSettings({ ...settings, secondaryText })} />
            <ColorField label="Éxito" value={settings.success} onChange={(success) => setSettings({ ...settings, success })} />
            <ColorField label="Advertencia" value={settings.warning} onChange={(warning) => setSettings({ ...settings, warning })} />
            <ColorField label="Error / peligro" value={settings.danger} onChange={(danger) => setSettings({ ...settings, danger })} />
            <ColorField label="Texto barra superior" value={settings.topbarText} onChange={(topbarText) => setSettings({ ...settings, topbarText })} />
            <div className="form-section-title field-wide"><h3>Tipografía</h3><button className="button compact" title="Guardar tipografía"><Save size={14} /> Guardar tipografía</button></div>
            <label className="field field-wide">
              <span>Tipografía</span>
              <select value={settings.fontFamily} onChange={(event) => setSettings({ ...settings, fontFamily: event.target.value })}>
                <option value="Segoe UI, Arial, Helvetica, sans-serif">Segoe UI</option>
                <option value="Arial, Helvetica, sans-serif">Arial</option>
                <option value="Tahoma, Arial, sans-serif">Tahoma</option>
                <option value="Georgia, 'Times New Roman', serif">Georgia</option>
              </select>
            </label>
            <div className="form-section-title field-wide"><h3>Cabecera y menú</h3><button className="button compact" title="Guardar cabecera y menú"><Save size={14} /> Guardar cabecera</button></div>
            <label className="field">
              <span>Modo de menú</span>
              <select value={settings.menuMode} onChange={(event) => setSettings({ ...settings, menuMode: event.target.value as BrandSettings["menuMode"] })}>
                <option value="horizontal">Horizontal bajo cabecera</option>
                <option value="vertical">Vertical lateral</option>
              </select>
            </label>
            <label className="field">
              <span>Alineación texto cabecera</span>
              <select value={settings.headerTextAlign} onChange={(event) => setSettings({ ...settings, headerTextAlign: event.target.value as BrandSettings["headerTextAlign"] })}>
                <option value="center">Centrado</option>
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </label>
            <label className="field">
              <span>Ubicación vertical texto</span>
              <select value={settings.headerTextPosition} onChange={(event) => setSettings({ ...settings, headerTextPosition: event.target.value as BrandSettings["headerTextPosition"] })}>
                <option value="middle">Centro</option>
                <option value="top">Arriba</option>
                <option value="bottom">Abajo</option>
              </select>
            </label>
            {settings.menuMode === "vertical" && (
              <label className="check-field">
                <input type="checkbox" checked={settings.menuCollapsed} onChange={(event) => setSettings({ ...settings, menuCollapsed: event.target.checked })} />
                Menú vertical plegado
              </label>
            )}
            <div className="form-section-title field-wide"><h3>Logo</h3><button className="button compact" title="Guardar logo"><Save size={14} /> Guardar logo</button></div>
            <label className="field">
              <span>URL del logo</span>
              <input value={settings.logo.startsWith("data:") ? "Logo cargado desde archivo" : settings.logo} onChange={(event) => setSettings({ ...settings, logo: event.target.value })} />
            </label>
            <label className="field field-wide">
              <span>Cargar logo</span>
              <input type="file" accept="image/*" onChange={(event) => loadLogo(event.target.files?.[0])} />
            </label>
            <div className="form-actions">
              <button className="button" title="Guardar colores, logo, título y subtítulo"><Save size={16} /> Guardar</button>
              <button className="button secondary" type="button" title="Restaurar marca base de Indoamérica" onClick={restore}><RotateCcw size={16} /> Restaurar</button>
            </div>
          </form>
        </aside>
        <section className="panel">
          <div className="card-head">
            <h2>{t("Vista previa")}</h2>
            <span className="badge">{message}</span>
          </div>
          <article className="brand-preview top-space" style={{ borderColor: settings.accent, background: settings.primary }}>
            <img src={settings.logo} alt="Logo institucional" />
            <div>
              <h3>{settings.title}</h3>
              <p>{settings.subtitle}</p>
            </div>
          </article>
          <div className="actions">
            <span className="badge"><ImageUp size={14} /> Logo parametrizable</span>
            <span className="badge">Colores, textos, botones y tipografía</span>
          </div>
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
      </section>
    </main>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
