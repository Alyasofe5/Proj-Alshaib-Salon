import { create } from "zustand";
import Cookies from "js-cookie";

interface User {
    id: number;
    name: string;
    username: string;
    role: "super_admin" | "admin" | "employee";
    employee_id: number | null;
    employee_name?: string | null;
    salon_id?: number;
}

interface SalonInfo {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    status: string;
    days_left: number | null;
}

interface AuthState {
    user: User | null;
    salon: SalonInfo | null;
    token: string | null;
    isAuthenticated: boolean;
    _hydrated: boolean;
    login: (user: User, token: string, salon?: SalonInfo) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setSalon: (salon: SalonInfo) => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    salon: null,
    token: null,
    isAuthenticated: false,
    _hydrated: false,

    hydrate: () => {
        const token = Cookies.get("token") || null;
        let user = null;
        let salon = null;
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem("user");
            const salonStr = localStorage.getItem("salon");
            user = userStr ? JSON.parse(userStr) : null;
            salon = salonStr ? JSON.parse(salonStr) : null;
        }
        set({ token, user, salon, isAuthenticated: !!token, _hydrated: true });
    },

    login: (user, token, salon) => {
        Cookies.set("token", token, { expires: 1 });
        if (typeof window !== 'undefined') {
            localStorage.setItem("user", JSON.stringify(user));
            if (salon) localStorage.setItem("salon", JSON.stringify(salon));
        }
        set({ user, token, salon: salon || null, isAuthenticated: true, _hydrated: true });
    },

    logout: () => {
        Cookies.remove("token");
        if (typeof window !== 'undefined') {
            localStorage.removeItem("user");
            localStorage.removeItem("salon");
        }
        set({ user: null, salon: null, token: null, isAuthenticated: false });
    },

    setUser: (user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("user", JSON.stringify(user));
        }
        set({ user });
    },

    setSalon: (salon) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("salon", JSON.stringify(salon));
        }
        set({ salon });
    },
}));
