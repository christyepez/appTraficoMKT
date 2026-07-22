"use client";

import { BrandSettingsPanel } from "../../features/branding/components/BrandSettingsPanel";
import { useBrandSettings } from "../../features/branding/hooks/useBrandSettings";
import { AppNav } from "../nav";

export default function BrandingPage(){const workspace=useBrandSettings();return <main className="app-shell"><AppNav/><BrandSettingsPanel workspace={workspace}/></main>;}
