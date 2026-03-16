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
    FaLock,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import BranchSwitcher from "@/components/BranchSwitcher";
import { assetUrl } from "@/lib/assets";

// Feature keys that each link requires (undefined = always visible)
type FeatureKey = "has_booking_page" | "has_advanced_reports" | "has_whatsapp" | "has_multi_branch" | "has_custom_api" | "has_priority_support" | "has_full_customize";

interface NavLink {
    href?: string;
    label: string;
    section?: boolean;
    icon?: React.ComponentType;
    requiredFeature?: FeatureKey;
}

const adminLinks: NavLink[] = [
    { label: "الرئيسية", section: true },
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: FaChartPie },
    { label: "الإدارة", section: true },
    { href: "/admin/employees", label: "الموظفون", icon: FaUsers },
    { href: "/admin/services", label: "الخدمات", icon: FaCut },
    { href: "/admin/bookings", label: "الحجوزات", icon: FaCalendarAlt, requiredFeature: "has_booking_page" },
    { href: "/admin/expenses", label: "المصاريف", icon: FaFileInvoiceDollar },
    { label: "التقارير", section: true },
    { href: "/admin/reports", label: "التقارير الشاملة", icon: FaChartBar },
    { href: "/admin/print-report", label: "طباعة التقارير", icon: FaPrint },
    { label: "الإعدادات", section: true },
    { href: "/admin/booking-settings", label: "إعدادات الحجز", icon: FaCut, requiredFeature: "has_booking_page" },
    { href: "/admin/users", label: "المستخدمون", icon: FaUserCog },
];

const employeeLinks: NavLink[] = [
    { label: "الرئيسية", section: true },
    { href: "/employee/dashboard", label: "لوحتي", icon: FaHome },
    { href: "/employee/new-customer", label: "تسجيل زبون", icon: FaPlusCircle },
    { label: "تقاريري", section: true },
    { href: "/employee/reports", label: "التقارير", icon: FaChartBar },
    { href: "/employee/print-report", label: "طباعة تقريري", icon: FaPrint },
];

const planBadges: Record<string, { label: string; color: string }> = {
    free: { label: "مجاني", color: "bg-gray-500/20 text-gray-400" },
    basic: { label: "أساسي", color: "bg-blue-500/20 text-blue-400" },
    professional: { label: "احترافي", color: "bg-purple-500/20 text-purple-400" },
    enterprise: { label: "مؤسسات", color: "bg-[#E6B31E]/20 text-[#E6B31E]" },
};

interface SidebarProps {
    role?: "admin" | "employee";
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, salon, branches, logout, hasFeature } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    // Prevent background scrolling when sidebar is open
    useEffect(() => {
        if (isOpen && window.innerWidth <= 768) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const displayName = user?.employee_name || user?.name || user?.username || "مستخدم";
    const initials = displayName.charAt(0).toUpperCase();
    const isEmployee = role === "employee" || user?.role === "employee";
    const rawLinks = isEmployee ? employeeLinks : adminLinks;
    const panelName = isEmployee ? "EMPLOYEE PANEL" : "MANAGEMENT SYSTEM";
    const salonName = salon?.name || "Maqass";
    const salonLogo = salon?.logo;
    const planType = salon?.plan_type || "basic";
    const badge = planBadges[planType] || planBadges.basic;

    // Filter links based on features
    const links = rawLinks.filter(link => {
        if (link.section) return true;
        if (!link.requiredFeature) return true;
        return hasFeature(link.requiredFeature);
    });

    // Define 3 main shortcuts for the bottom nav based on role
    const bottomNavAdmin = [
        { href: "/admin/dashboard", label: "الرئيسية", icon: FaChartPie },
        ...(hasFeature("has_booking_page") ? [{ href: "/admin/bookings", label: "الحجوزات", icon: FaCalendarAlt }] : []),
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
                    {assetUrl(salonLogo) ? (
                        <img
                            src={assetUrl(salonLogo)!}
                            alt={salonName}
                            width={44}
                            height={44}
                            style={{ borderRadius: "10px", flexShrink: 0, objectFit: "cover" }}
                            onError={(e) => {
                                // Hide the broken img, show fallback initial
                                (e.target as HTMLImageElement).style.display = "none";
                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                            }}
                        />
                    ) : null}
                    <div className="logo-icon" style={{ display: assetUrl(salonLogo) ? "none" : "flex" }}>{salonName.charAt(0)}</div>
                    <div>
                        <div className="salon-name">{salonName}</div>
                        <div className="salon-sub">{panelName}</div>
                    </div>
                </div>

                {/* Branch Switcher — shown when user has multiple branches */}
                {branches && branches.length > 1 && (
                    <div className="mt-4 px-3 mb-2">
                        <BranchSwitcher />
                    </div>
                )}

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
                            <div className="user-role flex items-center gap-1.5">
                                {isEmployee ? (
                                    <><FaCut className="inline ml-1" size={10} /> حلاق</>
                                ) : (
                                    <>
                                        <FaCrown className="inline ml-1" size={10} /> مدير النظام
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </>
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
