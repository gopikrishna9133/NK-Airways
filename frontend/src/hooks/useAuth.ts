import { create } from "zustand";

type Role = "Passenger" | "Admin" | "Unknown";
type User = { user_id?: number; name?: string; email?: string; role?: Role } | null;

type AuthState = {
  token: string | null;
  user: User;
  setToken: (t: string | null) => void;
  setUser: (u: User) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("nk_token") : null,
  user: typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "null")
    : null,

  setToken: (t) => {
    if (t) localStorage.setItem("nk_token", t);
    else localStorage.removeItem("nk_token");
    set({ token: t });
  },

  setUser: (u) => {
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
    set({ user: u });
  },

  logout: () => {
    localStorage.removeItem("nk_token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
    window.location.href = "/auth/login";
  },
}));
