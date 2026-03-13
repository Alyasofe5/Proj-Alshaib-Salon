"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import {
    FaChartPie,
    FaUsers,
    FaCut,
    FaFileInvoiceDollar,
    FaChartBar,
    FaUserCog,
    FaSignOutAlt,
    FaCrown,
    FaBars,
    FaTimes,
    FaHome,
    FaPlusCircle,
    FaCalendarAlt,
    FaPrint,
} from "react-icons/fa";
import { useState } from "react";

const adminLinks = [
    { label: "الرئيسية", section: true },
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: FaChartPie },
    { label: "الإدارة", section: true },
    { href: "/admin/employees", label: "الموظفون", icon: FaUsers },
    { href: "/admin/services", label: "الخدمات", icon: FaCut },
    { href: "/admin/bookings", label: "الحجوزات", icon: FaCalendarAlt },
    { href: "/admin/expenses", label: "المصاريف", icon: FaFileInvoiceDollar },
    { label: "التقارير", section: true },
    { href: "/admin/reports", label: "التقارير الشاملة", icon: FaChartBar },
    { href: "/admin/print-report", label: "طباعة التقارير", icon: FaPrint },
    { label: "الإعدادات", section: true },
    { href: "/admin/booking-settings", label: "إعدادات الحجز", icon: FaCut },
    { href: "/admin/users", label: "المستخدمون", icon: FaUserCog },
];

const employeeLinks = [
    { label: "الرئيسية", section: true },
    { href: "/employee/dashboard", label: "لوحتي", icon: FaHome },
    { href: "/employee/new-customer", label: "تسجيل زبون", icon: FaPlusCircle },
    { label: "تقاريري", section: true },
    { href: "/employee/reports", label: "التقارير", icon: FaChartBar },
    { href: "/employee/print-report", label: "طباعة تقريري", icon: FaPrint },
];

interface SidebarProps {
    role?: "admin" | "employee";
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, salon, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const displayName = user?.employee_name || user?.name || user?.username || "مستخدم";
    const initials = displayName.charAt(0).toUpperCase();
    const isEmployee = role === "employee" || user?.role === "employee";
    const links = isEmployee ? employeeLinks : adminLinks;
    const panelName = isEmployee ? "EMPLOYEE PANEL" : "MANAGEMENT SYSTEM";
    const salonName = salon?.name || "Maqass";
    const salonLogo = salon?.logo;

    // Define 3 main shortcuts for the bottom nav based on role
    const bottomNavAdmin = [
        { href: "/admin/dashboard", label: "الرئيسية", icon: FaChartPie },
        { href: "/admin/bookings", label: "الحجوزات", icon: FaCalendarAlt },
        { href: "/admin/reports", label: "التقارير", icon: FaChartBar },
    ];
    const bottomNavEmployee = [
        { href: "/employee/dashboard", label: "الرئيسية", icon: FaHome },
        { href: "/employee/new-customer", label: "زبون جديد", icon: FaPlusCircle },
        { href: "/employee/reports", label: "التقارير", icon: FaChartBar },
    ];
    const bottomShortcuts = isEmployee ? bottomNavEmployee : bottomNavAdmin;

    return (
        <>
            {/* Overlay for Bottom Sheet on Mobile */}
            {isOpen && (
                <div
                    className="sidebar-overlay active"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? "open" : ""}`}>
                <div className="sidebar-logo">
                    {salonLogo ? (
                        <img src={salonLogo.startsWith("http") ? salonLogo : `/${salonLogo}`} alt={salonName} width={44} height={44} style={{ borderRadius: "10px", flexShrink: 0, objectFit: "cover" }} />
                    ) : (
                        <div className="logo-icon">{salonName.charAt(0)}</div>
                    )}
                    <div>
                        <div className="salon-name">{salonName}</div>
                        <div className="salon-sub">{panelName}</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link, idx) => {
                        if (link.section) {
                            return (
                                <div key={idx} className="nav-section-title">
                                    {link.label}
                                </div>
                            );
                        }
                        const Icon = link.icon!;
                        const isActive = pathname === link.href || pathname?.startsWith(link.href?.split("?")[0] || "");
                        return (
                            <Link
                                key={link.href}
                                href={link.href!}
                                className={`nav-link-item ${isActive ? "active" : ""}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="nav-icon">
                                    <Icon />
                                </span>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{initials}</div>
                        <div>
                            <div className="user-name">{displayName}</div>
                            <div className="user-role">
                                {isEmployee ? (
                                    <><FaCut className="inline ml-1" size={10} /> حلاق</>
                                ) : (
                                    <><FaCrown className="inline ml-1" size={10} /> مدير النظام</>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <FaSignOutAlt className="inline ml-1" />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Bottom Nav (Mobile Only) */}
            <div className="bottom-nav">
                {bottomShortcuts.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || pathname?.startsWith(link.href?.split("?")[0] || "");
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`bottom-nav-item ${isActive && !isOpen ? "active" : ""}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <Icon />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
                <div
                    className={`bottom-nav-item ${isOpen ? "active" : ""}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <FaBars />
                    <span>المزيد</span>
                </div>
            </div>
        </>
    );
}
