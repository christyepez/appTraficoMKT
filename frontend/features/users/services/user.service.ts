import { api } from "../../../app/lib"; import type { ManagedUser, SaveUserPayload, UsersWorkspaceData } from "../models/user.models";
export async function getUsersWorkspace(): Promise<UsersWorkspaceData> { const [users, roles, screens] = await Promise.all([api<ManagedUser[]>("/api/identity/users"), api<string[]>("/api/identity/roles"), api<string[]>("/api/identity/screens")]); return { users, roles, screens }; }
export function saveUser(user: ManagedUser | null, payload: SaveUserPayload) { const body = user ? withoutProvider(payload) : payload; return api<ManagedUser>(`/api/identity/users${user ? `/${user.id}` : ""}`, { method: user ? "PUT" : "POST", body: JSON.stringify(body) }); }
export function disableUser(id: string) { return api(`/api/identity/users/${id}`, { method: "DELETE" }); }
function withoutProvider({ authProvider: _provider, ...payload }: SaveUserPayload) { return payload; }
