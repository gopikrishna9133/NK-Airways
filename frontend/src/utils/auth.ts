export function setSession(token: string, user: any) {
  localStorage.setItem("token", token);
  localStorage.setItem("nk_token", token);
  localStorage.setItem("user", JSON.stringify(user));
  const now = Date.now();
  localStorage.setItem("nk_login_at", String(now));
  localStorage.setItem("nk_expires_at", String(now + 30 * 60 * 1000)); 
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("nk_token");
  localStorage.removeItem("user");
  localStorage.removeItem("nk_login_at");
  localStorage.removeItem("nk_expires_at");
}

export function isExpired() {
  const exp = Number(localStorage.getItem("nk_expires_at") || "0");
  return exp && Date.now() >= exp;
}
