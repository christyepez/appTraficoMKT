export function safeAuthMessage(value: string) {
  if (/https?:\/\/|trycloudflare\.com|localhost/i.test(value)) {
    return "No se pudo completar el inicio de sesión. Revise la URL pública vigente o vuelva a intentar.";
  }
  if (value.length > 180) return `${value.slice(0, 177)}...`;
  return value;
}

export function authenticatedRoute(mustChangePassword: boolean | undefined, email: string) {
  return mustChangePassword ? `/change-password?email=${encodeURIComponent(email)}` : "/dashboard";
}
