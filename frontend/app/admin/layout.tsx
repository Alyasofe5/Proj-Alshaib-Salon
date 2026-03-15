"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, _hydrated, setUser, setSalon, setBranches, logout, hydrate } = useAuthStore();

    // Hydrate on mount (restore token from cookies)
    useEffect(() => {
        if (!_hydrated) hydrate();
    }, [_hydrated, hydrate]);

    useEffect(() => {
        if (!_hydrated) return; // Wait for hydration

        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }

        // Fetch user data from API (includes features + branches)
        authAPI
            .me()
            .then((res) => {
                const { user, salon, branches } = res.data.data;
                setUser(user);
                if (salon) setSalon(salon);
                if (branches) setBranches(branches);
            })
            .catch(() => {
                logout();
                router.replace("/login");
            });
    }, [_hydrated, isAuthenticated, router, setUser, setSalon, setBranches, logout]);

    if (!_hydrated || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <>
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </>
    );
}
