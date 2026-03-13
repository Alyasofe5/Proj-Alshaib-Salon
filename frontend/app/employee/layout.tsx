"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, _hydrated, setUser, setSalon, logout, hydrate } = useAuthStore();

    useEffect(() => { if (!_hydrated) hydrate(); }, [_hydrated, hydrate]);

    useEffect(() => {
        if (!_hydrated) return;
        if (!isAuthenticated) { router.replace("/login"); return; }
        authAPI.me().then(res => {
            const { user, salon } = res.data.data;
            setUser(user);
            if (salon) setSalon(salon);
        }).catch(() => { logout(); router.replace("/login"); });
    }, [_hydrated, isAuthenticated, router, setUser, setSalon, logout]);

    if (!_hydrated || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

    return <><Sidebar role="employee" /><main className="main-content">{children}</main></>;
}
