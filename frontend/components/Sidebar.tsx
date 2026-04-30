"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import {
    LayoutDashboard,
    Users,
    Scissors,
    FileText,
    BarChart3,
    UserCog,
    LogOut,
    Crown,
    Menu,
    Home,
    UserPlus,
    Calendar,
    Printer,
    Settings2,
    ChevronLeft,
    type LucideProps,
} from "lucide-react";
import { useState, useEffect } from "react";
import BranchSwitcher from "@/components/BranchSwitcher";
import { assetUrl } from "@/lib/assets";
import { tData } from "@/lib/i18n";

// Feature keys that each link requires (undefined = always visible)
type FeatureKey = "has_booking_page" | "has_advanced_reports" | "has_whatsapp" | "has_multi_branch" | "has_custom_api" | "has_priority_support" | "has_full_customize";

interface NavLink {
    href: string;
    label: string;
    icon: React.ComponentType<LucideProps>;
    requiredFeature?: FeatureKey;
    badge?: string;
}

interface NavSection {
    title: string;
    items: NavLink[];
}

// Organized by sections for the new design
const adminNavSections: NavSection[] = [
    {
        title: "الرئيسية",
        items: [
            { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
        ]
    },
    {
        title: "الإدارة",
        items: [
            { href: "/admin/employees", label: "الموظفون", icon: Users },
            { href: "/admin/services", label: "الخدمات", icon: Scissors },
            { href: "/admin/bookings", label: "الحجوزات", icon: Calendar, requiredFeature: "has_booking_page" },
            { href: "/admin/calendar", label: "التقويم", icon: Calendar, requiredFeature: "has_booking_page" },
            { href: "/admin/expenses", label: "المصاريف", icon: FileText },
        ]
    },
    {
        title: "التقارير",
        items: [
            { href: "/admin/reports", label: "التقارير الشاملة", icon: BarChart3 },
            { href: "/admin/print-report", label: "طباعة التقارير", icon: Printer },
        ]
    },
    {
        title: "الإعدادات",
        items: [
            { href: "/admin/booking-settings", label: "إعدادات الحجز", icon: Settings2, requiredFeature: "has_booking_page" },
            { href: "/admin/users", label: "المستخدمون", icon: UserCog },
        ]
    },
];

const employeeNavSections: NavSection[] = [
    {
        title: "الرئيسية",
        items: [
            { href: "/employee/dashboard", label: "لوحتي", icon: Home },
            { href: "/employee/new-customer", label: "تسجيل زبون", icon: UserPlus },
            { href: "/employee/calendar", label: "التقويم", icon: Calendar, requiredFeature: "has_booking_page" },
        ]
    },
    {
        title: "تقاريري",
        items: [
            { href: "/employee/reports", label: "التقارير", icon: BarChart3 },
            { href: "/employee/print-report", label: "طباعة تقريري", icon: Printer },
        ]
    },
];

const planBadges: Record<string, { label: string; colorClass: string; dotClass: string }> = {
    free: { label: "مجاني", colorClass: "bg-white/5 text-white/50 border-white/10", dotClass: "bg-white/50" },
    basic: { label: "أساسي", colorClass: "bg-white/10 text-white/70 border-white/15", dotClass: "bg-white/70" },
    professional: { label: "احترافي", colorClass: "bg-[#C3D809]/15 text-[#C3D809] border-[#C3D809]/30", dotClass: "bg-[#C3D809]" },
    enterprise: { label: "مؤسسات", colorClass: "bg-[#C3D809]/20 text-[#C3D809] border-[#C3D809]/40", dotClass: "bg-[#C3D809]" },
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

    const rawName = user?.employee_name || user?.name || user?.username || "مستخدم";
    const displayName = rawName.includes("||") ? rawName.split("||")[0].trim() : rawName;
    const initials = displayName.charAt(0).toUpperCase();
    const isEmployee = role === "employee" || user?.role === "employee";
    const navSections = isEmployee ? employeeNavSections : adminNavSections;
    const salonName = tData(salon?.name || "Maqass", "ar");
    const salonLogo = salon?.logo;
    const planType = salon?.plan_type || "basic";
    const badge = planBadges[planType] || planBadges.basic;

    // Filter sections/items based on features
    const filteredSections = navSections.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (!item.requiredFeature) return true;
            return hasFeature(item.requiredFeature);
        })
    })).filter(section => section.items.length > 0);

    // Define 3 main shortcuts for the bottom nav based on role
    const bottomNavAdmin = [
        { href: "/admin/dashboard", label: "الرئيسية", icon: LayoutDashboard },
        ...(hasFeature("has_booking_page") ? [{ href: "/admin/bookings", label: "الحجوزات", icon: Calendar }] : []),
        { href: "/admin/reports", label: "التقارير", icon: BarChart3 },
    ];
    const bottomNavEmployee = [
        { href: "/employee/dashboard", label: "الرئيسية", icon: Home },
        { href: "/employee/new-customer", label: "زبون جديد", icon: UserPlus },
        { href: "/employee/reports", label: "التقارير", icon: BarChart3 },
    ];
    const bottomShortcuts = isEmployee ? bottomNavEmployee : bottomNavAdmin;

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href.split("?")[0]);

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
                {/* Header with Logo */}
                <div className="border-b border-white/5 bg-gradient-to-bl from-[#111112] to-[#C3D809]/5 p-4 xl:p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-[#0A0A0B] font-bold text-xl overflow-hidden shadow-lg shadow-[#C3D809]/25"
                                style={{ 
                                    background: 'linear-gradient(135deg, rgba(195, 216, 9, 0.9), rgba(195, 216, 9, 0.7))',
                                    border: '1px solid rgba(195, 216, 9, 0.3)'
                                }}
                            >
                                {assetUrl(salonLogo) ? (
                                    <img
                                        src={assetUrl(salonLogo)!}
                                        alt={salonName}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    salonName.charAt(0)
                                )}
                            </div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[#C3D809] border-2 border-[#111112] rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight">{salonName}</h1>
                            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                {isEmployee ? "لوحة الموظف" : "نظام الإدارة"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Branch Switcher */}
                {branches && branches.length > 1 && (
                    <div className="mt-4 px-3 mb-2">
                        <BranchSwitcher />
                    </div>
                )}

                {/* Scrollable Nav Content */}
                <div className="flex-1 overflow-y-auto px-2 py-3 xl:px-3 xl:py-4">
                    <nav className="space-y-6">
                        {filteredSections.map((section) => (
                            <div key={section.title} className="space-y-2">
                                <h3 className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                                    {section.title}
                                </h3>
                                <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] shadow-sm">
                                    {section.items.map((item, idx) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href!);
                                        return (
                                            <div key={item.href}>
                                                <Link
                                                    href={item.href!}
                                                    className={`inline-flex items-center whitespace-nowrap w-full justify-start gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
                                                        active 
                                                            ? "bg-[#C3D809]/10 text-[#C3D809]" 
                                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                                    }`}
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    <div className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                                                        active 
                                                            ? "bg-[#C3D809] text-[#0A0A0B]" 
                                                            : "bg-white/5 text-white/50"
                                                    }`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <span className="flex-1 text-right">{item.label}</span>
                                                    {'badge' in item && item.badge && (
                                                        <div className="inline-flex items-center rounded-full border border-transparent bg-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5">
                                                            {item.badge}
                                                        </div>
                                                    )}
                                                </Link>
                                                {idx < section.items.length - 1 && (
                                                    <div className="mx-4 h-px bg-white/5" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div className="space-y-3 border-t border-white/5 bg-white/[0.01] p-3 xl:p-4">
                    {/* Divider */}
                    <div className="h-px w-full bg-white/5" />
                    
                    {/* User Profile Card */}
                    <div className="group flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-[#C3D809]/30 hover:shadow-[0_8px_30px_rgba(195,216,9,0.1)] transition-all duration-300 cursor-pointer">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C3D809] to-[#8FA807] flex items-center justify-center text-[#0A0A0B] font-bold text-base shadow-lg shadow-[#C3D809]/20">
                                {initials}
                            </div>
                        </div>
                        
                        {/* Info - stacked layout */}
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p className="text-[15px] font-bold text-white leading-tight">{displayName}</p>
                            <p className="text-[11px] text-white/50 font-medium flex items-center gap-1.5 whitespace-nowrap">
                                {isEmployee ? (
                                    <><Scissors size={11} className="text-white/40" /> حلاق</>
                                ) : (
                                    <><Crown size={11} className="text-[#C3D809]" /> مدير النظام</>
                                )}
                            </p>
                            {!isEmployee && (
                                <span className={`self-start inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.colorClass} mt-0.5`}>
                                    <span className={`w-1 h-1 rounded-full ${badge.dotClass}`} />
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        

                    </div>
                    
                    {/* Logout Button */}
                    <button 
                        onClick={handleLogout}
                        className="inline-flex items-center w-full justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={16} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Bottom Nav (Mobile Only) */}
            <div className="bottom-nav">
                {bottomShortcuts.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`bottom-nav-item ${active && !isOpen ? "active" : ""}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <Icon size={20} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
                <div
                    className={`bottom-nav-item ${isOpen ? "active" : ""}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Menu size={20} />
                    <span>المزيد</span>
                </div>
            </div>
        </>
    );
}
