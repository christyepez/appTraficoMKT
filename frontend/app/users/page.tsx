"use client";

import { UsersAdministration } from "../../features/users/components/UsersAdministration";
import { useUsersAdministration } from "../../features/users/hooks/useUsersAdministration";
import { AppNav } from "../nav";

export default function UsersPage() {
  const workspace = useUsersAdministration();
  return <main className="app-shell"><AppNav /><UsersAdministration workspace={workspace} /></main>;
}
