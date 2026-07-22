"use client";
import { CatalogAdministration } from "../../features/administration/components/CatalogAdministration";
import { useCatalogAdministration } from "../../features/administration/hooks/useCatalogAdministration";
import { AppNav } from "../nav";
export default function AdminPage() { const workspace = useCatalogAdministration(); return <main className="app-shell"><AppNav /><CatalogAdministration workspace={workspace} /></main>; }
