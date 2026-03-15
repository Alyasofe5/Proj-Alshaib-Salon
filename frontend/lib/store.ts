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

interface FeaturesConfig {
    has_booking_page?: boolean;
    has_advanced_reports?: boolean;
    has_whatsapp?: boolean;
    has_multi_branch?: boolean;
    has_custom_api?: boolean;
    has_priority_support?: boolean;
    has_full_customize?: boolean;
    max_bookings_month?: number;
}

interface SalonInfo {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    status: string;
    days_left: number | null;
    plan_type?: "free" | "basic" | "professional" | "enterprise";
    features?: FeaturesConfig;
}

interface Branch {
    id: number;
    name: string;
    slug: string;
    status: string;
    logo_path?: string | null;
    plan_name?: string;
    plan_type?: string;
}

interface AuthState {
    user: User | null;
    salon: SalonInfo | null;
    branches: Branch[];
    token: string | null;
    isAuthenticated: boolean;
    _hydrated: boolean;
    login: (user: User, token: string, salon?: SalonInfo, branches?: Branch[]) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setSalon: (salon: SalonInfo) => void;
    setBranches: (branches: Branch[]) => void;
    switchSalon: (salon: SalonInfo, token: string, branches?: Branch[]) => void;
    hydrate: () => void;
    hasFeature: (feature: keyof FeaturesConfig) => boolean;
    isEnterprise: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    salon: null,
    branches: [],
    token: null,
    isAuthenticated: false,
    _hydrated: false,

    hydrate: () => {
        const token = Cookies.get("token") || null;
        let user = null;
        let salon = null;
        let branches: Branch[] = [];
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem("user");
            const salonStr = localStorage.getItem("salon");
            const branchesStr = localStorage.getItem("branches");
            user = userStr ? JSON.parse(userStr) : null;
            salon = salonStr ? JSON.parse(salonStr) : null;
            branches = branchesStr ? JSON.parse(branchesStr) : [];
        }
        set({ token, user, salon, branches, isAuthenticated: !!token, _hydrated: true });
    },

    login: (user, token, salon, branches) => {
        Cookies.set("token", token, { expires: 1 });
        if (typeof window !== 'undefined') {
            localStorage.setItem("user", JSON.stringify(user));
            if (salon) localStorage.setItem("salon", JSON.stringify(salon));
            if (branches) localStorage.setItem("branches", JSON.stringify(branches));
        }
        set({ user, token, salon: salon || null, branches: branches || [], isAuthenticated: true, _hydrated: true });
    },

    logout: () => {
        Cookies.remove("token");
        if (typeof window !== 'undefined') {
            localStorage.removeItem("user");
            localStorage.removeItem("salon");
            localStorage.removeItem("branches");
        }
        set({ user: null, salon: null, branches: [], token: null, isAuthenticated: false });
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

    setBranches: (branches) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("branches", JSON.stringify(branches));
        }
        set({ branches });
    },

    switchSalon: (salon, token, branches) => {
        Cookies.set("token", token, { expires: 1 });
        if (typeof window !== 'undefined') {
            localStorage.setItem("salon", JSON.stringify(salon));
            localStorage.setItem("token", token);
            if (branches) localStorage.setItem("branches", JSON.stringify(branches));
        }
        // Update user salon_id
        const user = get().user;
        if (user) {
            const updatedUser = { ...user, salon_id: salon.id };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            set({ user: updatedUser, salon, token, branches: branches || get().branches });
        } else {
            set({ salon, token });
        }
    },

    hasFeature: (feature) => {
        const salon = get().salon;
        if (!salon?.features) return false;
        return !!salon.features[feature];
    },

    isEnterprise: () => {
        const salon = get().salon;
        return salon?.plan_type === 'enterprise';
    },
}));
