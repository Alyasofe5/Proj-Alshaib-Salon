"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { servicesAPI, API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { FaCamera, FaCheck, FaArrowRight, FaExternalLinkAlt, FaPlus, FaTrash, FaPen, FaTimes, FaSave, FaImage, FaQrcode, FaDownload, FaCopy, FaCheckCircle, FaWhatsapp, FaEye, FaEyeSlash, FaCog } from "react-icons/fa";
import { Settings, Palette, Scissors, Users, Calendar, HelpCircle, Link2, Sparkles, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { assetUrl } from "@/lib/assets";
import UpgradeCard from "@/components/UpgradeCard";

/** Same base as axios `api` (never empty — avoids wrong relative /salon/... URLs on live). */
const API_BASE = API_BASE_URL;

interface ServiceItem {
    id: number;
    name: string;
    price: string;
    image_path: string | null;
    video_path?: string | null;
    duration_minutes?: number | null;
    is_active: number;
}

interface EmployeeItem {
    id: number;
    name: string;
    phone: string;
    photo_path: string | null;
    specialty?: string;
    is_active: number;
}


interface SalonSettings {
    id: number;
    name: string;
    slug: string;
    description: string;
    secondary_description: string;
    address: string;
    instagram: string;
    whatsapp: string;
    facebook: string;
    owner_phone: string;
    booking_message: string;
    whatsapp_message?: string;
    hero_image: string | null;
    hero_video: string | null;
    hero_type: 'image' | 'video' | '';
    work_start: string;
    work_end: string;
    work_interval: number;
    off_days: number[];
    booking_days: number;
    // New Content Fields
    hero_title: string;
    about_title: string;
    about_subtitle: string;
    about_description: string;
    about_image_1: string;
    about_image_2: string;
    services_title: string;
    services_subtitle: string;
    services_description: string;
    services_ticker: string;
    team_title: string;
    team_subtitle: string;
    team_description: string;
    gallery_title: string;
    gallery_subtitle: string;
    reviews_title?: string;
    reviews_subtitle?: string;
    reviews?: { customer_name: string; comment: string; rating: number; role?: string; photo?: string; is_shown?: boolean }[];
    // Stats fields
    stats_years: string;
    stats_clients: string;
    stats_experts: string;
    // FAQ section headers
    faq_title: string;
    faq_subtitle: string;
    // Discount fields
    discount_active: number;
    discount_percentage: string;
    discount_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

interface FaqItem { id: string; question: string; answer: string; order: number; }
interface GalleryItem { id: number; file_path: string; file_type: "image" | "video"; order_num?: number; url: string; created_at?: string; }

type TabId = 'general' | 'content' | 'media' | 'gallery' | 'services' | 'employees' | 'booking' | 'faq' | 'link';
const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'general', label: 'عام', icon: Settings },
    { id: 'content', label: 'المحتوى', icon: Palette },
    { id: 'media', label: 'الخلفية', icon: FaImage },
    { id: 'services', label: 'الخدمات', icon: Scissors },
    { id: 'employees', label: 'الحلاقين', icon: Users },
    { id: 'booking', label: 'الحجز', icon: Calendar },
    { id: 'faq', label: 'الأسئلة', icon: HelpCircle },
    { id: 'link', label: 'الرابط', icon: Link2 },
];

export default function BookingSettingsPage() {

    const { salon, setSalon } = useAuthStore();
    const router = useRouter();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [settings, setSettings] = useState<SalonSettings | null>(null);
    const [uploading, setUploading] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [heroUploading, setHeroUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const aboutImg1Ref = useRef<HTMLInputElement>(null);
    const aboutImg2Ref = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoSaved, setLogoSaved] = useState(false);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [aboutImg1Uploading, setAboutImg1Uploading] = useState(false);
    const [aboutImg2Uploading, setAboutImg2Uploading] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);

    // ── FAQ state ──
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [faqLoading, setFaqLoading] = useState(false);
    const [editingFaq, setEditingFaq] = useState<string | null>(null);
    const [editFaqQ, setEditFaqQ] = useState('');
    const [editFaqA, setEditFaqA] = useState('');
    const [savingFaq, setSavingFaq] = useState(false);
    const [showAddFaq, setShowAddFaq] = useState(false);
    const [newFaqQ, setNewFaqQ] = useState('');
    const [newFaqA, setNewFaqA] = useState('');
    const [addingFaq, setAddingFaq] = useState(false);

    // Service editing
    const [editingService, setEditingService] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editDuration, setEditDuration] = useState("");
    const [savingService, setSavingService] = useState(false);

    // Add new service
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newDuration, setNewDuration] = useState("");
    const [addingService, setAddingService] = useState(false);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const galleryRef = useRef<HTMLDivElement>(null);

    const scrollGallery = (dir: 'l' | 'r') => {
        if (!galleryRef.current) return;
        const amt = 320;
        galleryRef.current.scrollBy({ left: dir === 'r' ? amt : -amt, behavior: 'smooth' });
    };

    // ── Employees (Barbers) state ──
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [empUploading, setEmpUploading] = useState<number | null>(null);
    const [editingEmp, setEditingEmp] = useState<number | null>(null);
    const [editEmpName, setEditEmpName] = useState("");
    const [editEmpPhone, setEditEmpPhone] = useState("");
    const [editEmpSpecialty, setEditEmpSpecialty] = useState("");
    const [savingEmp, setSavingEmp] = useState(false);
    const [showAddEmp, setShowAddEmp] = useState(false);
    const [newEmpName, setNewEmpName] = useState("");
    const [newEmpPhone, setNewEmpPhone] = useState("");
    const [newEmpSpecialty, setNewEmpSpecialty] = useState("");
    const [addingEmp, setAddingEmp] = useState(false);
    const [deleteEmpId, setDeleteEmpId] = useState<number | null>(null);
    const [deletingEmp, setDeletingEmp] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Set current logo from store on mount
    useEffect(() => {
        if (salon?.logo) setCurrentLogo(salon.logo);
    }, [salon]);

    const loadData = async () => {
        setLoadError(null);

        // Use shared `api` client (baseURL + Authorization + timeout) so a hung request cannot block forever.
        const [servRes, settRes, empRes, faqRes, galleryRes] = await Promise.allSettled([
            servicesAPI.getAll(),
            api.get("/salon/settings.php"),
            api.get("/employees/index.php"),
            api.get("/salon/faq.php"),
            api.get("/salon/gallery.php"),
        ]);

        if (servRes.status === "fulfilled") {
            setServices(servRes.value.data.data || []);
        } else {
            console.error("[booking-settings] services failed:", servRes.reason);
        }

        if (settRes.status === "fulfilled") {
            const body = settRes.value.data as { success?: boolean; data?: unknown; message?: string };
            if (body?.success && body.data != null) {
                const settData = body.data as SalonSettings;
                setSettings(settData);
                if (settData?.logo) setCurrentLogo(settData.logo);
            } else {
                console.error("[booking-settings] settings invalid payload:", body);
                setLoadError(body?.message || "استجابة غير صالحة من الخادم (إعدادات الصالون).");
                setSettings(null);
            }
        } else {
            console.error("[booking-settings] settings failed:", settRes.reason);
            const err = settRes.reason as { response?: { status?: number }; code?: string; message?: string };
            const status = err?.response?.status;
            const isTimeout = err?.code === "ECONNABORTED" || /timeout/i.test(String(err?.message || ""));
            setLoadError(
                isTimeout
                    ? "انتهت مهلة الاتصال بالخادم. تحقق من الشبكة أو جرّب لاحقاً."
                    : status === 500
                        ? "تعذّر تحميل إعدادات الصالون من الخادم (خطأ 500). راجع سجلات الخادم."
                        : status === 401
                            ? "انتهت صلاحية الجلسة. يرجى إعادة تسجيل الدخول."
                            : "تعذّر تحميل إعدادات الصالون. تحقّق من الاتصال وحاول مرة أخرى."
            );
        }

        if (empRes.status === "fulfilled") {
            setEmployees(empRes.value.data.data || []);
        } else {
            console.error("[booking-settings] employees failed:", empRes.reason);
        }

        if (faqRes.status === "fulfilled") {
            setFaqs(faqRes.value.data.data || []);
        } else {
            console.error("[booking-settings] faq failed:", faqRes.reason);
        }

        if (galleryRes.status === "fulfilled") {
            setGalleryItems(galleryRes.value.data.data?.items || []);
        } else {
            console.error("[booking-settings] gallery failed:", galleryRes.reason);
        }
    };

    const authH = () => ({ Authorization: `Bearer ${Cookies.get("token")}` });

    // ── Hero Media ──
    const handleHeroMedia = async (file: File) => {
        setHeroUploading(true);
        try {
            const fd = new FormData();
            fd.append("media", file);
            const res = await axios.post(`${API_BASE}/salon/hero-media.php`, fd, {
                headers: { ...authH(), "Content-Type": "multipart/form-data" },
            });
            if (settings && res.data.data) {
                setSettings({ ...settings, hero_image: res.data.data.hero_image ?? settings.hero_image, hero_video: res.data.data.hero_video ?? settings.hero_video, hero_type: res.data.data.hero_type });
            }
        } catch (e) { console.error(e); }
        finally { setHeroUploading(false); }
    };

    const deleteHeroMedia = async (type: 'image' | 'video') => {
        try {
            await axios.delete(`${API_BASE}/salon/hero-media.php`, { headers: authH(), data: { type } });
            if (settings) setSettings({ ...settings, [type === 'image' ? 'hero_image' : 'hero_video']: null });
        } catch (e) { console.error(e); }
    };

    // ── FAQ CRUD ──
    const addFaq = async () => {
        if (!newFaqQ.trim() || !newFaqA.trim()) return;
        setAddingFaq(true);
        try {
            const res = await axios.post(`${API_BASE}/salon/faq.php`, { question: newFaqQ.trim(), answer: newFaqA.trim() }, { headers: authH() });
            setFaqs(res.data.data || []);
            setNewFaqQ(''); setNewFaqA(''); setShowAddFaq(false);
        } catch (e) { console.error(e); }
        finally { setAddingFaq(false); }
    };

    const saveFaq = async () => {
        if (!editingFaq || !editFaqQ.trim() || !editFaqA.trim()) return;
        setSavingFaq(true);
        try {
            const res = await axios.put(`${API_BASE}/salon/faq.php?id=${editingFaq}`, { question: editFaqQ.trim(), answer: editFaqA.trim() }, { headers: authH() });
            setFaqs(res.data.data || []);
            setEditingFaq(null);
        } catch (e) { console.error(e); }
        finally { setSavingFaq(false); }
    };

    const deleteFaq = async (id: string) => {
        try {
            const res = await axios.delete(`${API_BASE}/salon/faq.php?id=${id}`, { headers: authH() });
            setFaqs(res.data.data || []);
        } catch (e) { console.error(e); }
    };


    const handleEmpPhotoUpload = async (empId: number, file: File) => {
        setEmpUploading(empId);
        try {
            const fd = new FormData();
            fd.append("photo", file);
            await axios.post(`${API_BASE}/employees/photo.php?id=${empId}`, fd, {
                headers: { Authorization: `Bearer ${Cookies.get("token")}`, "Content-Type": "multipart/form-data" },
            });
            await loadData();
        } catch (e) { console.error(e); }
        finally { setEmpUploading(null); }
    };

    const startEditEmp = (emp: EmployeeItem) => {
        setEditingEmp(emp.id);
        setEditEmpName(emp.name);
        setEditEmpPhone(emp.phone || "");
        setEditEmpSpecialty(emp.specialty || "");
    };

    const cancelEditEmp = () => { setEditingEmp(null); setEditEmpName(""); setEditEmpPhone(""); setEditEmpSpecialty(""); };

    const saveEmpEdit = async () => {
        if (!editingEmp || !editEmpName.trim()) return;
        setSavingEmp(true);
        try {
            await axios.put(`${API_BASE}/employees/manage.php?id=${editingEmp}`,
                { name: editEmpName.trim(), phone: editEmpPhone.trim(), specialty: editEmpSpecialty.trim() },
                { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
            );
            cancelEditEmp();
            await loadData();
        } catch (e) { console.error(e); }
        finally { setSavingEmp(false); }
    };

    const addEmployee = async () => {
        if (!newEmpName.trim()) return;
        setAddingEmp(true);
        try {
            await axios.post(`${API_BASE}/employees/index.php`,
                { name: newEmpName.trim(), phone: newEmpPhone.trim(), specialty: newEmpSpecialty.trim() },
                { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
            );
            setNewEmpName(""); setNewEmpPhone(""); setNewEmpSpecialty(""); setShowAddEmp(false);
            await loadData();
        } catch (e: any) {
            alert(e?.response?.data?.message || "حدث خطأ");
        }
        finally { setAddingEmp(false); }
    };

    const deleteEmployee = async (id: number) => {
        setDeletingEmp(true);
        try {
            await axios.delete(`${API_BASE}/employees/manage.php?id=${id}`, {
                headers: { Authorization: `Bearer ${Cookies.get("token")}` },
            });
            setDeleteEmpId(null);
            await loadData();
        } catch (e: any) {
            alert(e?.response?.data?.message || "لا يمكن حذف هذا الحلاق");
        }
        finally { setDeletingEmp(false); }
    };

    const handleLogoUpload = async (file: File) => {
        setLogoUploading(true);
        try {
            const formData = new FormData();
            formData.append("logo", file);
            const res = await axios.post(`${API_BASE}/salon/logo.php`, formData, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (res.data.success && res.data.data?.logo) {
                // Store the raw path from the API — assetUrl() resolves it for display
                const newLogoPath = res.data.data.logo;
                setCurrentLogo(newLogoPath);
                // Update the zustand store so that the sidebar updates immediately
                if (salon) {
                    setSalon({ ...salon, logo: newLogoPath });
                }
                setLogoSaved(true);
                setTimeout(() => setLogoSaved(false), 2500);
            }
        } catch (e) { console.error(e); }
        finally { setLogoUploading(false); }
    };

    const handleAboutImageUpload = async (which: 1 | 2, file: File) => {
        const setter = which === 1 ? setAboutImg1Uploading : setAboutImg2Uploading;
        setter(true);
        try {
            const fd = new FormData();
            fd.append("image", file);
            fd.append("which", String(which));
            const res = await axios.post(`${API_BASE}/salon/about-image.php`, fd, {
                headers: { ...authH(), "Content-Type": "multipart/form-data" },
            });
            if (res.data.success && res.data.data?.path && settings) {
                const field = which === 1 ? "about_image_1" : "about_image_2";
                setSettings({ ...settings, [field]: res.data.data.path });
            }
        } catch (e) { console.error(e); }
        finally { setter(false); }
    };

    const [reviewPhotoUploading, setReviewPhotoUploading] = useState<number | null>(null);
    const handleReviewPhotoUpload = async (index: number, file: File) => {
        setReviewPhotoUploading(index);
        try {
            const fd = new FormData();
            fd.append("image", file);
            // Intentionally omit Content-Type so axios lets the browser add the correct multipart boundary.
            const res = await axios.post(`${API_BASE}/salon/review-image.php`, fd, {
                headers: { ...authH() },
            });
            const path = res.data?.data?.path;
            if (!path) {
                alert(res.data?.message || "فشل رفع الصورة — لم يرجع مسار من السيرفر");
                return;
            }
            if (settings) {
                setSettings({
                    ...settings,
                    reviews: (settings.reviews ?? []).map((r, i) => i === index ? { ...r, photo: path } : r),
                });
            }
        } catch (e: any) {
            console.error("Review photo upload failed:", e);
            const msg = e?.response?.data?.message || e?.message || "فشل رفع الصورة";
            alert(`فشل رفع الصورة: ${msg}`);
        }
        finally { setReviewPhotoUploading(null); }
    };

    const handleImageUpload = async (serviceId: number, file: File) => {
        setUploading(serviceId);
        try {
            await servicesAPI.uploadImage(serviceId, file);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setUploading(null); }
    };

    const handleVideoUpload = async (serviceId: number, file: File) => {
        setUploading(serviceId);
        try {
            await servicesAPI.uploadVideo(serviceId, file);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setUploading(null); }
    };

    const deleteServiceVideo = async (serviceId: number) => {
        setUploading(serviceId);
        try {
            await servicesAPI.deleteVideo(serviceId);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setUploading(null); }
    };

    const uploadGalleryFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        setGalleryUploading(true);
        try {
            const fd = new FormData();
            Array.from(files).forEach((file) => fd.append("files[]", file));
            await axios.post(`${API_BASE}/salon/gallery-upload.php`, fd, {
                headers: { ...authH(), "Content-Type": "multipart/form-data" },
            });
            await loadData();
        } catch (e) { console.error(e); }
        finally { setGalleryUploading(false); }
    };

    const deleteGalleryItem = async (id: number) => {
        try {
            await axios.delete(`${API_BASE}/salon/gallery.php?id=${id}`, { headers: authH() });
            await loadData();
        } catch (e) { console.error(e); }
    };

    const reorderGalleryItem = async (id: number, direction: "up" | "down") => {
        const idx = galleryItems.findIndex(item => item.id === id);
        if (idx === -1) return;
        const nextIdx = direction === "up" ? idx - 1 : idx + 1;
        if (nextIdx < 0 || nextIdx >= galleryItems.length) return;

        const reordered = [...galleryItems];
        const [moved] = reordered.splice(idx, 1);
        reordered.splice(nextIdx, 0, moved);
        setGalleryItems(reordered);

        try {
            await axios.put(`${API_BASE}/salon/gallery.php`, { order: reordered.map(item => item.id) }, { headers: authH() });
        } catch (e) {
            console.error(e);
            await loadData();
        }
    };


    const handleSaveSettings = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await axios.put(`${API_BASE}/salon/settings.php`, settings, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.data.success) {
                // Merge saved_data from server with current settings to preserve all fields
                // (especially discount_active which old server may not return)
                const savedData = res.data.data?.saved_data || {};
                const finalDiscountActive = settings.discount_active;
                const finalDiscountPercentage = settings.discount_percentage;
                const finalDiscountDays = settings.discount_days;
                
                setSettings(prev => prev ? {
                    ...prev,
                    ...savedData,
                    // Always keep what user had set in UI for these fields
                    discount_active: finalDiscountActive,
                    discount_percentage: finalDiscountPercentage,
                    discount_days: finalDiscountDays,
                } : prev);
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const startEdit = (s: ServiceItem) => {
        setEditingService(s.id);
        setEditName(s.name);
        setEditPrice(s.price);
        setEditDuration(s.duration_minutes ? String(s.duration_minutes) : "");
    };

    const cancelEdit = () => {
        setEditingService(null);
        setEditName("");
        setEditPrice("");
        setEditDuration("");
    };

    const saveServiceEdit = async () => {
        if (!editingService || !editName.trim()) return;
        setSavingService(true);
        try {
            await servicesAPI.update(editingService, {
                name: editName.trim(),
                price: parseFloat(editPrice) || 0,
                duration_minutes: editDuration ? parseInt(editDuration, 10) || null : null,
            });
            cancelEdit();
            await loadData();
        } catch (e) { console.error(e); }
        finally { setSavingService(false); }
    };

    const addService = async () => {
        if (!newName.trim()) return;
        setAddingService(true);
        try {
            await servicesAPI.create({
                name: newName.trim(),
                price: parseFloat(newPrice) || 0,
                duration_minutes: newDuration ? parseInt(newDuration, 10) || null : null,
            });
            setNewName("");
            setNewPrice("");
            setNewDuration("");
            setShowAdd(false);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setAddingService(false); }
    };

    const deleteService = async (id: number) => {
        setDeleting(true);
        try {
            await servicesAPI.delete(id);
            setDeleteId(null);
            await loadData();
        } catch (e) {
            alert("لا يمكن حذف هذه الخدمة — قد تكون مرتبطة بفواتير");
            console.error(e);
        }
        finally { setDeleting(false); }
    };

    const toggleService = async (id: number) => {
        try {
            await servicesAPI.toggle(id);
            await loadData();
        } catch (e) { console.error(e); }
    };

    const gold = "var(--color-accent)";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (!settings) return (
        <div className="min-h-[80vh] flex items-center justify-center px-4" dir="rtl">
            {loadError ? (
                <div className="max-w-md w-full text-center bg-white/5 border border-red-500/30 rounded-2xl p-8 space-y-5">
                    <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto text-red-400">
                        <FaTimes size={22} />
                    </div>
                    <div>
                        <h3 className="text-white text-lg font-bold mb-2">تعذّر تحميل الصفحة</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{loadError}</p>
                    </div>
                    <button
                        onClick={loadData}
                        className="px-5 py-2.5 rounded-xl bg-[#C3D809] text-[#0A0A0B] font-bold text-sm hover:bg-[#B5C808] transition-colors"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            ) : (
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
            )}
        </div>
    );

    return (
        <div className="text-[var(--color-text-primary)]" dir="rtl" style={{ fontFamily: "var(--font-app)" }}>
            {/* Topbar — High-end Header matching Dashboard */}
            <div className="topbar">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        className="btn-secondary lg:hidden inline-flex items-center justify-center shrink-0"
                        style={{ padding: "8px 12px", minHeight: "40px" }}
                        aria-label="رجوع"
                    >
                        <FaArrowRight />
                    </button>
                    <div className="min-w-0">
                        <div className="topbar-title">
                            <FaCog className="inline-block align-middle ml-2 text-accent-lime" />
                            إعدادات <span>الحجز</span>
                        </div>
                        <div className="topbar-date">تخصيص صفحة الزبائن والخدمات</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => window.open(`${baseUrl}/book/?s=${settings?.slug || salon?.slug}`, '_blank')}
                        className="btn-outline-lime hidden md:inline-flex items-center gap-2"
                        style={{ padding: "8px 14px", minHeight: "40px" }}
                    >
                        <FaExternalLinkAlt size={11} /> <span>المعاينة</span>
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="btn-lime inline-flex border-none items-center justify-center gap-2"
                        style={{ padding: "8px 14px", minHeight: "40px" }}
                        aria-label={saved ? "تم الحفظ" : "حفظ التغييرات"}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-black" /> : <FaSave size={14} />}
                        <span className="hidden sm:inline">{saved ? "تم الحفظ" : "حفظ التغييرات"}</span>
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-8 mt-4 sticky top-[72px] z-20 bg-card-dark/80 backdrop-blur-md py-3">
                {/* Mobile Tab Selector (Custom Dropdown) */}
                <div className="block md:hidden relative">
                    <button 
                        onClick={() => setTabDropdownOpen(!tabDropdownOpen)}
                        className="w-full flex items-center justify-between bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 outline-none font-bold text-sm shadow-sm transition-all focus:border-[var(--color-accent)]"
                    >
                        <div className="flex items-center gap-2.5">
                            {(() => {
                                const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];
                                const ActiveIcon = activeTabData.icon;
                                return (
                                    <>
                                        <ActiveIcon size={16} className="text-[var(--color-accent)]" />
                                        <span>{activeTabData.label}</span>
                                    </>
                                );
                            })()}
                        </div>
                        <ChevronDown size={16} className={`transition-transform duration-300 ${tabDropdownOpen ? 'rotate-180 text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`} />
                    </button>

                    <AnimatePresence>
                        {tabDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
                            >
                                {TABS.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button 
                                            key={tab.id} 
                                            onClick={() => { setActiveTab(tab.id); setTabDropdownOpen(false); }}
                                            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-all text-right border-b border-white/5 last:border-none ${isActive ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-primary)] hover:bg-white/5"}`}
                                        >
                                            <Icon size={16} className={isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"} />
                                            <span>{tab.label}</span>
                                            {isActive && <FaCheck size={12} className="mr-auto text-[var(--color-accent)]" />}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex items-center gap-1 overflow-x-auto hide-scroll py-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${isActive ? "bg-[var(--color-accent)] text-black border-[var(--color-accent)] shadow-[0_4px_12px_rgba(195,216,9,0.2)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--border-subtle)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"}`}>
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ══════ Tab: Link ══════ */}
                {activeTab === 'link' && <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <FaExternalLinkAlt size={13} />
                        </div>
                        <h2 className="text-xl font-bold">رابط الحجز للزبائن</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* ── Booking Link Card ── */}
                        <div className="card lg:col-span-2 rounded-2xl p-5 md:p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(195,216,9,.15)" }}>
                                        <FaExternalLinkAlt size={14} color={gold} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[var(--color-text-primary)] font-bold text-sm">رابط الحجز</p>
                                        <p className="text-[var(--color-text-muted)] text-xs mt-0.5 font-mono truncate" dir="ltr">{baseUrl}/book/?s={settings.slug}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(`${baseUrl}/book/?s=${settings.slug}`);
                                        setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${copiedLink ? "bg-emerald-500/20 text-emerald-400" : "bg-accent-lime/15 text-accent-lime hover:bg-accent-lime/25"}`}
                                    >
                                        {copiedLink ? <><FaCheckCircle size={11} /> تم النسخ</> : <><FaCopy size={11} /> نسخ الرابط</>}
                                    </button>
                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`احجز موعدك الآن في ${settings.name}! 💇‍♂️\n\n${baseUrl}/book/?s=${settings.slug}`)}`, "_blank")}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                                    >
                                        <FaWhatsapp size={12} /> مشاركة واتساب
                                    </button>
                                    <a href={`/book/?s=${settings?.slug || salon?.slug}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/10 transition-all"
                                    >
                                        <FaExternalLinkAlt size={10} /> معاينة
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* ── QR Code Card ── */}
                        <div className="rounded-2xl p-5 flex flex-col items-center gap-4" style={{ background: "var(--color-cards)", border: "1px solid var(--border-subtle)" }}>
                            <div className="flex items-center gap-2 self-start">
                                <FaQrcode style={{ color: gold }} size={14} />
                                <p className="text-sm font-bold text-[var(--color-text-primary)]">باركود الحجز</p>
                            </div>

                            {['professional', 'enterprise'].includes(salon?.plan_type || '') ? (
                                <>
                                    {/* QR Code Display */}
                                    <div className="p-3 rounded-xl" style={{ background: "#fff" }}>
                                        <QRCodeSVG
                                            id="salon-qr-svg"
                                            value={`${baseUrl}/book/?s=${settings.slug}`}
                                            size={140}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>

                                    {/* Hidden Canvas for Download */}
                                    <QRCodeCanvas
                                        id="salon-qr-canvas"
                                        value={`${baseUrl}/book/?s=${settings.slug}`}
                                        size={800}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                        includeMargin={true}
                                        style={{ display: "none" }}
                                    />

                                    <p className="text-[10px] text-[var(--color-text-primary)]/25 text-center">امسح الكود بالموبايل للحجز مباشرة</p>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => {
                                            const canvas = document.getElementById("salon-qr-canvas") as HTMLCanvasElement;
                                            if (!canvas) return;
                                            const link = document.createElement("a");
                                            link.download = `qr-${settings.slug}.png`;
                                            link.href = canvas.toDataURL("image/png");
                                            link.click();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                        style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30` }}
                                    >
                                        <FaDownload size={11} /> تنزيل الباركود
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Locked QR — Blurred Preview */}
                                    <div className="relative p-3 rounded-xl" style={{ background: "#fff" }}>
                                        <div style={{ filter: "blur(6px)", pointerEvents: "none" }}>
                                            <QRCodeSVG
                                                value={`${baseUrl}/book/?s=${settings.slug}`}
                                                size={140}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                                            style={{ background: "rgba(0,0,0,.55)" }}>
                                            <span className="text-2xl">🔒</span>
                                        </div>
                                    </div>

                                    <UpgradeCard
                                        plan="professional"
                                        featureName="صفحة الحجز والباركود"
                                        compact
                                    />
                                </>
                            )}
                        </div>

                    </div>
                </motion.section>}

                {/* ══════ Tab: General — Logo ══════ */}
                {activeTab === 'general' && <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <FaImage size={14} />
                        </div>
                        <h2 className="text-xl font-bold">لوجو الصالون</h2>
                    </div>
                    <div className="rounded-2xl p-6" style={{ background: "var(--color-cards)", border: "1px solid var(--border-subtle)" }}>
                        <div className="flex items-center gap-6">
                            {/* Logo Preview */}
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => logoInputRef.current?.click()}>
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden flex items-center justify-center transition-all bg-[#0d0d0d] shadow-[0_0_40px_rgba(195,216,9,0.15)]"
                                    style={{ border: `2px solid ${currentLogo ? gold : "rgba(195,216,9,.1)"}` }}>
                                    {assetUrl(currentLogo) ? (
                                        <img src={assetUrl(currentLogo)!} alt="Logo" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; setCurrentLogo(null); }} />
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-4xl font-black maqass-brand">{settings.name?.charAt(0) || "?"}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Overlay */}
                                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                    {logoUploading ? (
                                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
                                    ) : (
                                        <FaCamera className="text-[var(--color-text-primary)]" size={18} />
                                    )}
                                </div>
                                {/* Success badge */}
                                <AnimatePresence>
                                    {logoSaved && (
                                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500 text-[var(--color-text-primary)] shadow-lg">
                                            <FaCheck size={10} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
                            </div>
                            {/* Logo Info */}
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">شعار الصالون</p>
                                <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">يظهر في صفحة الحجز والسايدبار. يُفضل صورة مربعة بدقة عالية (512×512 أو أكبر)</p>
                                <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                                    className="flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                                    style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30` }}>
                                    <FaCamera size={10} />
                                    {logoUploading ? "جاري الرفع..." : logoSaved ? "✓ تم الرفع" : "تغيير اللوجو"}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.section>}

                {/* ══════ Tab: General — Info ══════ */}
                {activeTab === 'general' && <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                    {/* Info Card */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <Users size={18} />
                            </div>
                            <h2 className="text-lg font-bold">معلومات الصالون الأساسية</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BilingualInput label="اسم الصالون" value={settings.name} onChange={v => setSettings({ ...settings, name: v })} gold={gold} placeholderAr="اسم الصالون" placeholderEn="Salon Name" />
                            <InputField label="رقم الهاتف" value={settings.owner_phone} onChange={v => setSettings({ ...settings, owner_phone: v })} gold={gold} />
                            <BilingualInput label="العنوان" value={settings.address} onChange={v => setSettings({ ...settings, address: v })} gold={gold} placeholderAr="مثال: عمان، شارع الرينبو" placeholderEn="e.g. Amman, Rainbow St" />
                            <InputField label="انستقرام" value={settings.instagram} onChange={v => setSettings({ ...settings, instagram: v })} gold={gold} placeholder="@username" />
                            <InputField label="واتساب (اختياري)" value={settings.whatsapp} onChange={v => setSettings({ ...settings, whatsapp: v })} gold={gold} placeholder="00962..." />
                            <InputField label="فيسبوك (اختياري)" value={settings.facebook} onChange={v => setSettings({ ...settings, facebook: v })} gold={gold} placeholder="facebook.com/..." />
                        </div>

                        {/* --- Stats Section --- */}
                        <div className="mt-8 pt-8 border-t border-white/5">
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-lime/10 text-accent-lime">
                                    <Sparkles size={14} />
                                </div>
                                <h3 className="text-sm font-bold">إحصائيات الصالون (الأرقام في الموقع)</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <InputField label="سنوات الخبرة" value={settings.stats_years ?? ""} onChange={v => setSettings({ ...settings, stats_years: v })} gold={gold} placeholder="مثال: 7+" />
                                <InputField label="عدد العملاء" value={settings.stats_clients ?? ""} onChange={v => setSettings({ ...settings, stats_clients: v })} gold={gold} placeholder="مثال: 15K+" />
                                <InputField label="عدد الخبراء" value={settings.stats_experts ?? ""} onChange={v => setSettings({ ...settings, stats_experts: v })} gold={gold} placeholder="مثال: 6" />
                            </div>
                            <p className="mt-4 text-[10px] text-[var(--color-text-muted)] italic leading-relaxed">
                                تظهر هذه الأرقام في قسم الإحصائيات بصفحة الحجز الرئيسية لتعزيز ثقة الزبائن.
                            </p>
                        </div>

                        {/* --- Discount Section --- */}
                        <div className="mt-8 pt-8 border-t border-white/5">
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-lime/10 text-accent-lime">
                                    <Sparkles size={14} />
                                </div>
                                <h3 className="text-sm font-bold">إعدادات عرض الخصم للموقع</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-[var(--color-text-muted)] block uppercase tracking-wider">الخصم للعملاء الجدد</label>
                                    <select 
                                        value={Number(settings.discount_active) === 1 ? "1" : "0"} 
                                        onChange={e => setSettings({ ...settings, discount_active: e.target.value === "1" ? 1 : 0 })}
                                        className="w-full py-4 px-5 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm transition-all focus:border-[var(--color-accent)]"
                                        style={{ border: "1.5px solid var(--border-subtle)" }}
                                    >
                                        <option value="1">مفعل (يظهر في الموقع)</option>
                                        <option value="0">غير مفعل (مخفي)</option>
                                    </select>
                                </div>
                                <InputField label="نسبة الخصم (%)" type="number" value={settings.discount_percentage ?? "30"} onChange={v => setSettings({ ...settings, discount_percentage: v })} gold={gold} placeholder="مثال: 30" />

                            </div>

                            {/* Days of week picker */}
                            {Number(settings.discount_active) === 1 && (
                                <div className="mt-6">
                                    <label className="text-xs font-bold text-[var(--color-text-muted)] block uppercase tracking-wider mb-3">
                                        أيام تطبيق الخصم على الزبائن
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { day: 0, ar: 'الأحد' },
                                            { day: 1, ar: 'الإثنين' },
                                            { day: 2, ar: 'الثلاثاء' },
                                            { day: 3, ar: 'الأربعاء' },
                                            { day: 4, ar: 'الخميس' },
                                            { day: 5, ar: 'الجمعة' },
                                            { day: 6, ar: 'السبت' },
                                        ].map(({ day, ar }) => {
                                            const activeDays = settings.discount_days ?? [];
                                            const isActive = activeDays.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = settings.discount_days ?? [];
                                                        const next = isActive ? cur.filter(d => d !== day) : [...cur, day];
                                                        setSettings({ ...settings, discount_days: next });
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                                        isActive
                                                            ? 'bg-[var(--color-accent)] text-black border-[var(--color-accent)] shadow-[0_0_12px_rgba(195,216,9,0.3)]'
                                                            : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--border-subtle)] hover:border-[var(--color-accent)]/50'
                                                    }`}
                                                >
                                                    {ar}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-3 text-[10px] text-[var(--color-text-muted)] italic">
                                        {(settings.discount_days ?? []).length === 0
                                            ? '⚠️ لم تحدد أي أيام — الخصم لن يُطبق حتى تختار يوماً واحداً على الأقل'
                                            : `✅ الخصم مفعّل في ${(settings.discount_days ?? []).length} يوم من الأسبوع`
                                        }
                                    </p>
                                </div>
                            )}

                            <p className="mt-4 text-[10px] text-[var(--color-text-muted)] italic leading-relaxed">
                                الخصم يُطبق تلقائياً على حساب الزبون عند اختياره يوماً من الأيام المحددة.
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                            <BilingualTextArea 
                                label="وصف الصالون الرئيسي (يظهر في الواجهة العليا)" 
                                value={settings.description} 
                                onChange={v => setSettings({ ...settings, description: v })} 
                                gold={gold} 
                                placeholderAr="اكتب وصفاً مختصراً..." 
                                placeholderEn="Write a brief description..." 
                                rows={4} 
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                            <BilingualTextArea 
                                label="وصف الصالون الفرعي (يظهر في أسفل الصفحة - Footer)" 
                                value={settings.secondary_description} 
                                onChange={v => setSettings({ ...settings, secondary_description: v })} 
                                gold={gold} 
                                placeholderAr="اكتب وصفاً موجزاً للفوتر..." 
                                placeholderEn="Footer description in English..." 
                                rows={3} 
                            />
                        </div>

                        <div className="mt-6">
                            <BilingualInput label="رسالة بعد الحجز (تظهر للزبون بعد نجاح الحجز على الموقع)" value={settings.booking_message} onChange={v => setSettings({ ...settings, booking_message: v })} gold={gold} placeholderAr="مثال: شكراً لحجزك! سننتظرك في الموعد." placeholderEn="e.g. Thanks for booking! See you soon." />
                        </div>
                        <div className="mt-6">
                            <BilingualTextArea 
                                label="رسالة الواتساب (القالب الافتراضي عند تأكيد الحجز)" 
                                value={settings.whatsapp_message || ''} 
                                onChange={v => setSettings({ ...settings, whatsapp_message: v })} 
                                gold={gold} 
                                placeholderAr="مثال: يسعدنا تأكيد حجزك في صالوننا، نراك قريباً!" 
                                placeholderEn="e.g. We are happy to confirm your booking, see you soon!" 
                                rows={3} 
                            />
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
                                * يمكنك ترك هذا الحقل فارغاً لاستخدام الرسالة الفخمة الافتراضية. إذا قمت بكتابة نص هنا، سيتم إرساله للزبون عبر الواتساب بدلاً من الرسالة الافتراضية.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-white/5">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-accent)]">قسم المعرض</h3>
                                <BilingualInput label="عنوان المعرض الكبير" value={settings.gallery_title} onChange={v => setSettings({ ...settings, gallery_title: v })} gold={gold} placeholderAr="فلسفة المظهر" placeholderEn="Style Philosophy" />
                            </div>
                            <div className="rounded-2xl p-5 flex items-center justify-center text-center text-xs leading-7 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--border-subtle)]">
                                يظهر هذا العنوان مباشرة فوق معرض الصور والفيديو في صفحة الحجز العامة.
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-lg font-bold">معرض الصور والفيديو</h2>
                                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">هذه العناصر تظهر داخل قسم المعرض في صفحة الحجز.</p>
                            </div>
                            <label className="btn-outline-lime flex items-center gap-2 h-10 px-5 cursor-pointer">
                                <FaPlus size={10} /> {galleryUploading ? "جارٍ الرفع..." : "رفع ملفات"}
                                <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple className="hidden"
                                    onChange={e => { uploadGalleryFiles(e.target.files); e.currentTarget.value = ""; }} />
                            </label>
                        </div>

                        {galleryItems.length === 0 ? (
                            <div className="rounded-2xl p-8 text-center text-sm text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--border-subtle)]">
                                لا توجد عناصر في المعرض بعد. ارفع صورًا أو فيديوهات لتظهر في صفحة الحجز.
                            </div>
                        ) : (
                            <div className="relative group/gal px-2">
                                {/* Left Arrow */}
                                <button 
                                    type="button"
                                    onClick={() => scrollGallery('l')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--color-background)]/80 backdrop-blur-md border border-[var(--border-subtle)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/50 transition-all opacity-0 group-hover/gal:opacity-100 hidden sm:flex shadow-lg"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div ref={galleryRef} className="flex overflow-x-auto gap-4 pb-6 no-scrollbar px-2 px-2 scroll-smooth">
                                    {galleryItems.map((item, idx) => (
                                    <div key={item.id} className="w-40 flex-shrink-0 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--color-surface)] transition-all hover:border-[var(--color-accent)]/50">
                                        <div className="aspect-square bg-black/20 relative">
                                            {item.file_type === "video" ? (
                                                <video src={assetUrl(item.file_path) || item.url} controls playsInline className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={assetUrl(item.file_path) || item.url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="p-4 flex items-center justify-between gap-2">
                                            <div className="text-[11px] text-[var(--color-text-muted)]">
                                                {item.file_type === "video" ? "فيديو" : "صورة"} #{idx + 1}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => reorderGalleryItem(item.id, "up")} disabled={idx === 0}
                                                    className="w-8 h-8 rounded-lg bg-white/5 text-xs disabled:opacity-30">↑</button>
                                                <button type="button" onClick={() => reorderGalleryItem(item.id, "down")} disabled={idx === galleryItems.length - 1}
                                                    className="w-8 h-8 rounded-lg bg-white/5 text-xs disabled:opacity-30">↓</button>
                                                <button type="button" onClick={() => deleteGalleryItem(item.id)}
                                                    className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    ))}
                                </div>

                                {/* Right Arrow */}
                                <button 
                                    type="button"
                                    onClick={() => scrollGallery('r')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--color-background)]/80 backdrop-blur-md border border-[var(--border-subtle)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/50 transition-all opacity-0 group-hover/gal:opacity-100 hidden sm:flex shadow-lg"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>}

                {/* ══════ Tab: Booking — Work Hours & Off Days ══════ */}
                {activeTab === 'booking' && <motion.div key="booking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <Calendar size={18} />
                            </div>
                            <h2 className="text-lg font-bold">ساعات العمل والإجازات</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <TimePicker12 label="بداية الدوام" value={settings.work_start} onChange={(v: string) => setSettings({ ...settings, work_start: v })} gold={gold} />
                            <TimePicker12 label="نهاية الدوام" value={settings.work_end} onChange={(v: string) => setSettings({ ...settings, work_end: v })} gold={gold} />
                            <div>
                                <label className="text-xs font-bold text-[var(--color-text-muted)] mb-2 block uppercase tracking-wider">الفاصل الزمني (دقيقة)</label>
                                <select value={settings.work_interval} onChange={e => setSettings({ ...settings, work_interval: Number(e.target.value) })}
                                    className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm transition-all cursor-pointer appearance-none"
                                    style={{ border: "1.5px solid var(--border-subtle)" }}>
                                    {[15, 20, 30, 45, 60].map(m => (
                                        <option key={m} value={m}>{m} دقيقة</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-8 p-5 rounded-2xl" style={{ background: "var(--color-background)", border: "1px solid var(--border-subtle)" }}>
                            <label className="text-xs font-bold text-[var(--color-accent)] mb-3 block uppercase tracking-wider">عدد أيام الحجز المتاحة</label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <select value={settings.booking_days} onChange={e => setSettings({ ...settings, booking_days: Number(e.target.value) })}
                                    className="w-full sm:w-40 py-3.5 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm transition-all cursor-pointer appearance-none font-bold"
                                    style={{ border: "1.5px solid var(--border-subtle)" }}>
                                    {[3, 4, 5, 6, 7, 10, 14, 21, 30].map(n => (
                                        <option key={n} value={n}>{n} أيام للقدام</option>
                                    ))}
                                </select>
                                <p className="text-xs text-[var(--color-text-muted)] max-w-sm">تحديد المدى الزمني المسموح للزبائن بالحجز فيه خلال المستقبل من اليوم الحالي.</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-[var(--color-text-muted)] mb-4 block uppercase tracking-wider">أيام الإجازة الأسبوعية</label>
                            <div className="flex flex-wrap gap-2">
                                {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((dayName, dayIndex) => {
                                    const isOff = settings.off_days.includes(dayIndex);
                                    return (
                                        <button key={dayIndex}
                                            onClick={() => {
                                                const newDays = isOff
                                                    ? settings.off_days.filter(d => d !== dayIndex)
                                                    : [...settings.off_days, dayIndex];
                                                setSettings({ ...settings, off_days: newDays });
                                            }}
                                            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${isOff ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--border-subtle)] hover:border-[var(--color-accent)]"}`}
                                            style={{ border: "1.5px solid" }}>
                                            {dayName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>}

                {/* ══════ Tab: Content — Hero & About ══════ */}
                {activeTab === 'content' && <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    
                    {/* Hero Text Customization */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <Palette size={18} />
                            </div>
                            <h2 className="text-lg font-bold">نصوص الواجهة الرئيسية (Hero)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <BilingualInput label="العنوان الرئيسي للموقع" value={settings.hero_title} onChange={v => setSettings({ ...settings, hero_title: v })} gold={gold} placeholderAr="مثال: أين يلتقي الإبداع بالأناقة" placeholderEn="Where Craft Meets Elegance" />
                            </div>
                        </div>
                    </div>

                    {/* About Section Customization */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <Users size={18} />
                            </div>
                            <h2 className="text-lg font-bold">قسم "قصتنا" (About)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BilingualInput label="العنوان الرئيسي للقسم" value={settings.about_title} onChange={v => setSettings({ ...settings, about_title: v })} gold={gold} placeholderAr="قصتنا" placeholderEn="Our Story" />
                            <div className="md:col-span-2">
                                <BilingualTextArea 
                                    label="وصف القسم (قصة الصالون)" 
                                    value={settings.about_description} 
                                    onChange={v => setSettings({ ...settings, about_description: v })} 
                                    gold={gold} 
                                    placeholderAr="اكتب تاريخ الصالون..." 
                                    placeholderEn="Write salon history..." 
                                    rows={5} 
                                />
                            </div>

                            {/* About Image 1 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--color-text-muted)] block uppercase tracking-wider">الصورة الرئيسية (قسم القصة)</label>
                                <div className="flex items-center gap-3">
                                    {assetUrl(settings.about_image_1) && (
                                        <img src={assetUrl(settings.about_image_1)!} alt="" className="w-14 h-14 rounded-xl object-cover border border-[var(--border-subtle)]" />
                                    )}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="btn-outline-lime flex items-center gap-2 h-9 px-4 cursor-pointer w-fit">
                                            <FaCamera size={10} />
                                            <span>{aboutImg1Uploading ? "جارٍ الرفع..." : "رفع صورة"}</span>
                                            <input ref={aboutImg1Ref} type="file" accept="image/*" className="hidden"
                                                onChange={e => { const f = e.target.files?.[0]; if (f) handleAboutImageUpload(1, f); e.currentTarget.value = ""; }} />
                                        </label>
                                        <input value={settings.about_image_1 ?? ""} onChange={e => setSettings({ ...settings, about_image_1: e.target.value })}
                                            placeholder="أو ضع رابط URL مباشر..." dir="ltr"
                                            className="w-full py-2.5 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                            {/* About Image 2 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--color-text-muted)] block uppercase tracking-wider">الصورة الفرعية (قسم القصة)</label>
                                <div className="flex items-center gap-3">
                                    {assetUrl(settings.about_image_2) && (
                                        <img src={assetUrl(settings.about_image_2)!} alt="" className="w-14 h-14 rounded-xl object-cover border border-[var(--border-subtle)]" />
                                    )}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="btn-outline-lime flex items-center gap-2 h-9 px-4 cursor-pointer w-fit">
                                            <FaCamera size={10} />
                                            <span>{aboutImg2Uploading ? "جارٍ الرفع..." : "رفع صورة"}</span>
                                            <input ref={aboutImg2Ref} type="file" accept="image/*" className="hidden"
                                                onChange={e => { const f = e.target.files?.[0]; if (f) handleAboutImageUpload(2, f); e.currentTarget.value = ""; }} />
                                        </label>
                                        <input value={settings.about_image_2 ?? ""} onChange={e => setSettings({ ...settings, about_image_2: e.target.value })}
                                            placeholder="أو ضع رابط URL مباشر..." dir="ltr"
                                            className="w-full py-2.5 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections Headers */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <Scissors size={18} />
                            </div>
                            <h2 className="text-lg font-bold">عناوين الأقسام الأخرى</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-accent)]">قسم الخدمات</h3>
                                <BilingualInput label="عنوان الخدمات الكبير" value={settings.services_title} onChange={v => setSettings({ ...settings, services_title: v })} gold={gold} placeholderAr="ما نقدمه" placeholderEn="What We Offer" />
                                <BilingualInput label="وصف قسم الخدمات" value={settings.services_description} onChange={v => setSettings({ ...settings, services_description: v })} gold={gold} placeholderAr="اكتب وصفاً..." placeholderEn="Write description..." />
                                <BilingualListEditor
                                    label="شريط الخدمات المتحرك"
                                    value={settings.services_ticker ?? ""}
                                    onChange={v => setSettings({ ...settings, services_ticker: v })}
                                    gold={gold}
                                    placeholderAr="قصات دقيقة"
                                    placeholderEn="Precision Cuts"
                                    helperText="كل سطر يمثل خدمة واحدة. السطر الأول عربي يقابله السطر الأول إنجليزي."
                                />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-accent)]">قسم فريق العمل</h3>
                                <BilingualInput label="عنوان الفريق الكبير" value={settings.team_title} onChange={v => setSettings({ ...settings, team_title: v })} gold={gold} placeholderAr="الخبراء" placeholderEn="The Experts" />
                                <BilingualInput label="وصف قسم الفريق" value={settings.team_description} onChange={v => setSettings({ ...settings, team_description: v })} gold={gold} placeholderAr="اكتب وصفاً..." placeholderEn="Write description..." />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <FaCheckCircle size={16} />
                            </div>
                            <h2 className="text-lg font-bold">قسم آراء العملاء</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <BilingualInput label="العنوان الكبير" value={settings.reviews_title ?? ""} onChange={v => setSettings({ ...settings, reviews_title: v })} gold={gold} placeholderAr="ماذا يقولون" placeholderEn="What They Say" />
                        </div>
                        <div className="space-y-4">
                            {(settings.reviews ?? []).map((review, index) => (
                                <div key={index} className="rounded-2xl p-5 bg-[var(--color-surface)] border border-[var(--border-subtle)] space-y-4">
                                    <div className="flex items-start gap-4">
                                        <label className="relative flex-shrink-0 group cursor-pointer">
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 bg-black flex items-center justify-center" style={{ borderColor: review.photo ? gold : "var(--border-subtle)" }}>
                                                {reviewPhotoUploading === index ? (
                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                ) : review.photo ? (
                                                    <img src={assetUrl(review.photo) || review.photo} alt="" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                                ) : (
                                                    <FaCamera className="text-white/40" size={18} />
                                                )}
                                            </div>
                                            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                                                <FaCamera className="text-white" size={16} />
                                            </div>
                                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleReviewPhotoUpload(index, f); e.currentTarget.value = ""; }} />
                                        </label>
                                        <div className="flex-1 text-xs text-[var(--color-text-muted)] pt-1">
                                            <div className="font-bold mb-1">صورة العميل</div>
                                            <div>اضغط على الدائرة لرفع صورة (JPG / PNG / WEBP — حتى 5MB)</div>
                                            {review.photo && (
                                                <button type="button" onClick={() => setSettings({ ...settings, reviews: (settings.reviews ?? []).map((item, i) => i === index ? { ...item, photo: "" } : item) })} className="mt-2 text-[11px] text-red-400 hover:text-red-300">حذف الصورة</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <BilingualInput label={`اسم العميل ${index + 1}`} value={review.customer_name} onChange={v => setSettings({ ...settings, reviews: (settings.reviews ?? []).map((item, i) => i === index ? { ...item, customer_name: v } : item) })} gold={gold} placeholderAr="اسم العميل" placeholderEn="Client Name" />
                                        <BilingualInput label="الصفة" value={review.role ?? ""} onChange={v => setSettings({ ...settings, reviews: (settings.reviews ?? []).map((item, i) => i === index ? { ...item, role: v } : item) })} gold={gold} placeholderAr="مثال: عميل موثق" placeholderEn="e.g. Verified Client" />
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-text-muted)] mb-2 block uppercase tracking-wider">التقييم و الظهور</label>
                                            <div className="flex gap-2">
                                                <select value={review.rating ?? 5} onChange={e => setSettings({ ...settings, reviews: (settings.reviews ?? []).map((item, i) => i === index ? { ...item, rating: Number(e.target.value) } : item) })}
                                                    className="flex-1 py-3.5 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm transition-all cursor-pointer appearance-none"
                                                    style={{ border: "1.5px solid var(--border-subtle)" }}>
                                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} نجوم</option>)}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings({ ...settings, reviews: (settings.reviews ?? []).map((item, i) => i === index ? { ...item, is_shown: !item.is_shown } : item) })}
                                                    className={`px-4 py-3.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center justify-center gap-2 ${review.is_shown ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-white/5 text-gray-400 border-gray-600'}`}
                                                >
                                                    {review.is_shown ? <><FaCheckCircle size={12} /> معروض للزبائن</> : 'مخفي'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <BilingualTextArea 
                                            label="نص التقييم" 
                                            value={review.comment} 
                                            onChange={v => setSettings({ ...settings, reviews: (settings.reviews ?? []).map((item, i) => i === index ? { ...item, comment: v } : item) })} 
                                            gold={gold} 
                                            placeholderAr="اكتب التقييم بالعربي..." 
                                            placeholderEn="Write review in English..." 
                                            rows={3} 
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setSettings({ ...settings, reviews: (settings.reviews ?? []).filter((_, i) => i !== index) })}
                                            className="btn-outline-red h-10 px-4 flex items-center gap-2"
                                        >
                                            <FaTrash size={10} /> حذف التقييم
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setSettings({
                                    ...settings,
                                    reviews: [...(settings.reviews ?? []), { customer_name: "", role: "", rating: 5, comment: "" }]
                                })}
                                className="btn-outline-lime h-11 px-5 flex items-center gap-2"
                            >
                                <FaPlus size={10} /> إضافة تقييم
                            </button>
                        </div>
                    </div>
                </motion.div>}


                {/* ══════ Tab: Media — Hero Image/Video ══════ */}
                {activeTab === 'media' && <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <FaImage size={18} />
                            </div>
                            <h2 className="text-lg font-bold">صورة / فيديو الواجهة الرئيسية</h2>
                        </div>

                        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1.5px solid var(--border-subtle)", background: "var(--color-surface)" }}>
                            {/* Preview box */}
                            <div className="relative aspect-video flex items-center justify-center">
                                {settings.hero_type === 'video' && assetUrl(settings.hero_video) ? (
                                    <video src={assetUrl(settings.hero_video)!} className="absolute inset-0 w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
                                ) : settings.hero_type === 'image' && assetUrl(settings.hero_image) ? (
                                    <img src={assetUrl(settings.hero_image)!} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                ) : (
                                    <div className="text-[var(--color-text-muted)] text-center p-8">
                                        <FaCamera className="text-5xl mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-bold tracking-tight">لم تختر خلفية بعد</p>
                                        <p className="text-xs opacity-50 mt-1">ارفع صورة أو فيديو ليظهر في خلفية صفحة الحجز</p>
                                    </div>
                                )}

                                {heroUploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
                                    </div>
                                )}

                                {/* Status Badge */}
                                {settings.hero_type && !heroUploading && (
                                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                        style={{ background: "var(--color-accent)", color: "#000" }}>
                                        {settings.hero_type === 'video' ? '🎥 VIDEO ACTIVE' : '🖼️ IMAGE ACTIVE'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="btn-lime flex items-center gap-2 flex-1 sm:flex-none justify-center cursor-pointer">
                                    <FaCamera size={12} /> <span>رفع صورة</span>
                                    <input type="file" accept="image/*" className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroMedia(f); e.currentTarget.value = ""; }} />
                                </label>
                                <label className="btn-outline-lime flex items-center gap-2 flex-1 sm:flex-none justify-center cursor-pointer">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                                    <span>رفع فيديو</span>
                                    <input type="file" accept="video/*" className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroMedia(f); e.currentTarget.value = ""; }} />
                                </label>
                            </div>

                            {(settings.hero_image || settings.hero_video) && (
                                <button onClick={() => deleteHeroMedia(settings.hero_type as any)}
                                    className="text-red-500 hover:text-red-400 text-xs font-bold px-4 py-2 hover:bg-red-500/10 rounded-xl transition-all">
                                    حذف المحتوى الحالي
                                </button>
                            )}
                            <p className="text-[10px] text-[var(--color-text-muted)] sm:mr-auto">أقصى حجم: صورة 8MB / فيديو 100MB</p>
                        </div>
                    </div>
                </motion.div>}

                {/* ══════ Tab: Services ══════ */}
                {activeTab === 'services' && <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="card">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                    <Scissors size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">قائمة الخدمات</h2>
                                    <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">{services.length} خدمة مفعلة</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAdd(true)} className="btn-outline-lime flex items-center gap-2 h-10 px-6">
                                <FaPlus size={10} /> إضافة خدمة
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAdd && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="p-6 rounded-2xl mb-8" style={{ background: "var(--color-background)", border: `1.5px solid ${gold}30` }}>
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: gold }}>تفاصيل الخدمة الجديدة</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5 sm:col-span-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mr-1">اسم الخدمة</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <span className="absolute top-2 right-2 text-[8px] font-black text-white/20 z-10">AR</span>
                                                    <input value={newName.includes("||") ? newName.split("||")[0] : newName}
                                                        onChange={e => { const en = newName.includes("||") ? newName.split("||")[1] ?? "" : ""; setNewName(en ? `${e.target.value}||${en}` : e.target.value); }}
                                                        placeholder="حلاقة" dir="rtl"
                                                        className="w-full pt-5 pb-2 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm" />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute top-2 left-2 text-[8px] font-black z-10" style={{ color: gold }}>EN</span>
                                                    <input value={newName.includes("||") ? newName.split("||")[1] ?? "" : ""}
                                                        onChange={e => { const ar = newName.includes("||") ? newName.split("||")[0] : newName; setNewName(e.target.value ? `${ar}||${e.target.value}` : ar); }}
                                                        placeholder="Haircut" dir="ltr"
                                                        className="w-full pt-5 pb-2 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mr-1">السعر (د.أ)</label>
                                            <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" dir="ltr"
                                                className="w-full py-3 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm font-mono" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mr-1">المدة (دقيقة)</label>
                                            <input value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="30" type="number" min="1" dir="ltr"
                                                className="w-full py-3 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm font-mono" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-6">
                                        <button onClick={addService} disabled={addingService || !newName.trim()} className="btn-lime min-w-[120px]">
                                            {addingService ? <div className="spinner-sm mx-auto" /> : "تأكيد الإضافة"}
                                        </button>
                                        <button onClick={() => { setShowAdd(false); setNewName(""); setNewPrice(""); setNewDuration(""); }}
                                            className="text-xs font-bold text-[var(--color-text-muted)] px-4 py-2 hover:bg-white/5 rounded-lg transition-all">إلغاء</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 gap-3">
                            {services.map(service => (
                                <ServiceRow
                                    key={service.id}
                                    service={service}
                                    isEditing={editingService === service.id}
                                    editName={editName}
                                    editPrice={editPrice}
                                    editDuration={editDuration}
                                    onEditName={setEditName}
                                    onEditPrice={setEditPrice}
                                    onEditDuration={setEditDuration}
                                    onStartEdit={() => startEdit(service)}
                                    onCancelEdit={cancelEdit}
                                    onSaveEdit={saveServiceEdit}
                                    savingEdit={savingService}
                                    uploading={uploading === service.id}
                                    onImageUpload={(file) => handleImageUpload(service.id, file)}
                                    onVideoUpload={(file) => handleVideoUpload(service.id, file)}
                                    onDeleteVideo={() => deleteServiceVideo(service.id)}
                                    onToggle={() => toggleService(service.id)}
                                    onDelete={() => setDeleteId(service.id)}
                                    gold={gold}
                                    baseUrl={baseUrl}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>}

                {/* ══════ Tab: Employees ══════ */}
                {activeTab === 'employees' && <motion.div key="employees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="card">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                    <Users size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">فريق العمل</h2>
                                    <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">{employees.length} حلاق مسجل</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddEmp(true)} className="btn-outline-lime flex items-center gap-2 h-10 px-6">
                                <FaPlus size={10} /> إضافة حلاق
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAddEmp && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="p-6 rounded-2xl mb-8" style={{ background: "var(--color-background)", border: `1.5px solid ${gold}30` }}>
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: gold }}>بيانات الحلاق الجديد</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 sm:col-span-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mr-1">اسم الحلاق</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <span className="absolute top-2 right-2 text-[8px] font-black text-white/20 z-10">AR</span>
                                                    <input value={newEmpName.includes("||") ? newEmpName.split("||")[0] : newEmpName}
                                                        onChange={e => { const en = newEmpName.includes("||") ? newEmpName.split("||")[1] ?? "" : ""; setNewEmpName(en ? `${e.target.value}||${en}` : e.target.value); }}
                                                        placeholder="الاسم بالعربي" dir="rtl"
                                                        className="w-full pt-5 pb-2 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm" />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute top-2 left-2 text-[8px] font-black z-10" style={{ color: gold }}>EN</span>
                                                    <input value={newEmpName.includes("||") ? newEmpName.split("||")[1] ?? "" : ""}
                                                        onChange={e => { const ar = newEmpName.includes("||") ? newEmpName.split("||")[0] : newEmpName; setNewEmpName(e.target.value ? `${ar}||${e.target.value}` : ar); }}
                                                        placeholder="Name in EN" dir="ltr"
                                                        className="w-full pt-5 pb-2 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-1">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mr-1">رقم الهاتف (اختياري)</label>
                                            <input value={newEmpPhone} onChange={e => setNewEmpPhone(e.target.value)} placeholder="07XXXXXXXX" dir="ltr"
                                                className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm font-mono" />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mr-1">التخصص / المسمى الوظيفي</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <span className="absolute top-2 right-2 text-[8px] font-black text-white/20 z-10">AR</span>
                                                    <input value={newEmpSpecialty.includes("||") ? newEmpSpecialty.split("||")[0] : newEmpSpecialty}
                                                        onChange={e => { const en = newEmpSpecialty.includes("||") ? newEmpSpecialty.split("||")[1] ?? "" : ""; setNewEmpSpecialty(en ? `${e.target.value}||${en}` : e.target.value); }}
                                                        placeholder="مثال: حلاق محترف" dir="rtl"
                                                        className="w-full pt-5 pb-2 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm" />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute top-2 left-2 text-[8px] font-black z-10" style={{ color: gold }}>EN</span>
                                                    <input value={newEmpSpecialty.includes("||") ? newEmpSpecialty.split("||")[1] ?? "" : ""}
                                                        onChange={e => { const ar = newEmpSpecialty.includes("||") ? newEmpSpecialty.split("||")[0] : newEmpSpecialty; setNewEmpSpecialty(e.target.value ? `${ar}||${e.target.value}` : ar); }}
                                                        placeholder="e.g. Master Barber" dir="ltr"
                                                        className="w-full pt-5 pb-2 px-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--color-accent)] transition-all text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-6">
                                        <button onClick={addEmployee} disabled={addingEmp || !newEmpName.trim()} className="btn-lime min-w-[120px]">
                                            {addingEmp ? <div className="spinner-sm mx-auto" /> : "إضافة الحلاق"}
                                        </button>
                                        <button onClick={() => { setShowAddEmp(false); setNewEmpName(""); setNewEmpPhone(""); setNewEmpSpecialty(""); }}
                                            className="text-xs font-bold text-[var(--color-text-muted)] px-4 py-2 hover:bg-white/5 rounded-lg transition-all">إلغاء</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {employees.map(emp => (
                                <EmployeeCard
                                    key={emp.id}
                                    emp={emp}
                                    isEditing={editingEmp === emp.id}
                                    editName={editEmpName}
                                    editPhone={editEmpPhone}
                                    editSpecialty={editEmpSpecialty}
                                    onEditName={setEditEmpName}
                                    onEditPhone={setEditEmpPhone}
                                    onEditSpecialty={setEditEmpSpecialty}
                                    onStartEdit={() => startEditEmp(emp)}
                                    onCancelEdit={cancelEditEmp}
                                    onSaveEdit={saveEmpEdit}
                                    savingEdit={savingEmp}
                                    uploading={empUploading === emp.id}
                                    onPhotoUpload={(file) => handleEmpPhotoUpload(emp.id, file)}
                                    onDelete={() => setDeleteEmpId(emp.id)}
                                    gold={gold}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>}

                {/* ══════ Tab: FAQ ══════ */}
                {activeTab === 'faq' && <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                    {/* FAQ Section Headers */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <HelpCircle size={18} />
                            </div>
                            <h2 className="text-lg font-bold">عناوين قسم الأسئلة الشائعة</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BilingualInput label="العنوان الرئيسي" value={settings.faq_title ?? ""} onChange={v => setSettings({ ...settings, faq_title: v })} gold={gold} placeholderAr="الأسئلة الشائعة" placeholderEn="Common Questions" />
                        </div>
                        <p className="mt-4 text-[10px] text-[var(--color-text-muted)] italic">يظهر هذا العنوان فوق قائمة الأسئلة في صفحة الحجز. اضغط "حفظ التغييرات" لتطبيقه.</p>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                    <HelpCircle size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">الأسئلة الشائعة</h2>
                                    <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">تحسين تجربة الزبون</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddFaq(true)} className="btn-outline-lime flex items-center gap-2 h-10 px-6">
                                <FaPlus size={10} /> إضافة سؤال
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAddFaq && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="p-6 rounded-2xl mb-8" style={{ background: "var(--color-background)", border: `1.5px solid ${gold}30` }}>
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: gold }}>سؤال وجواب جديد</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <BilingualInput 
                                                label="السؤال" 
                                                value={newFaqQ} 
                                                onChange={v => setNewFaqQ(v)} 
                                                gold={gold} 
                                                placeholderAr="مثال: هل توجد مواقف للسيارات؟" 
                                                placeholderEn="e.g. Is parking available?" 
                                            />
                                        </div>

                                        <div>
                                            <BilingualTextArea 
                                                label="الإجابة" 
                                                value={newFaqA} 
                                                onChange={v => setNewFaqA(v)} 
                                                gold={gold} 
                                                placeholderAr="اكتب الإجابة بالعربي..." 
                                                placeholderEn="Write answer in English..." 
                                                rows={3} 
                                            />
                                        </div>

                                    </div>
                                    <div className="flex items-center gap-3 mt-6">
                                        <button onClick={addFaq} disabled={addingFaq || !newFaqQ.trim() || !newFaqA.trim()} className="btn-lime min-w-[120px]">
                                            {addingFaq ? <div className="spinner-sm mx-auto" /> : "إضافة السؤال"}
                                        </button>
                                        <button onClick={() => { setShowAddFaq(false); setNewFaqQ(''); setNewFaqA(''); }}
                                            className="text-xs font-bold text-[var(--color-text-muted)] px-4 py-2 hover:bg-white/5 rounded-lg transition-all">إلغاء</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {faqs.length === 0 ? (
                            <div className="rounded-2xl p-16 text-center border-2 border-dashed border-[var(--border-subtle)]">
                                <HelpCircle className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold text-[var(--color-text-muted)]">لا توجد أسئلة شائعة بعد</p>
                                <p className="text-xs text-[var(--color-text-muted)]/50 mt-1">أضف الأسئلة المتكررة لتقليل استفسارات الزبائن</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {faqs.map((faq, i) => (
                                    <motion.div key={faq.id} layout className="rounded-2xl p-5 group transition-all"
                                        style={{ background: "var(--color-surface)", border: editingFaq === faq.id ? `1.5px solid ${gold}` : "1.5px solid var(--border-subtle)" }}>
                                        {editingFaq === faq.id ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <BilingualInput 
                                                        label="السؤال" 
                                                        value={editFaqQ} 
                                                        onChange={v => setEditFaqQ(v)} 
                                                        gold={gold} 
                                                        placeholderAr="السؤال بالعربي" 
                                                        placeholderEn="Question in English" 
                                                    />
                                                </div>

                                                <div>
                                                    <BilingualTextArea 
                                                        label="الإجابة" 
                                                        value={editFaqA} 
                                                        onChange={v => setEditFaqA(v)} 
                                                        gold={gold} 
                                                        placeholderAr="الإجابة بالعربي" 
                                                        placeholderEn="Answer in English" 
                                                        rows={3} 
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <button onClick={saveFaq} className="btn-lime inline-flex items-center justify-center h-8 px-4 text-[10px]" style={{ padding: "0 16px", minHeight: "32px" }}>حفظ</button>
                                                    <button onClick={() => setEditingFaq(null)} className="text-[10px] font-bold px-3">إلغاء</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                                        <span className="text-[var(--color-accent)] font-mono text-xs opacity-40">Q.</span>
                                                        {faq.question?.includes("||") ? faq.question.split("||")[0].trim() : faq.question}
                                                        {faq.question?.includes("||") && faq.question.split("||")[1]?.trim() && (
                                                            <span className="text-[9px] text-white/30 font-mono"> / {faq.question.split("||")[1].trim()}</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                                                        {faq.answer?.includes("||") ? faq.answer.split("||")[0].trim() : faq.answer}
                                                        {faq.answer?.includes("||") && faq.answer.split("||")[1]?.trim() && (
                                                            <span className="block mt-1 text-[var(--color-text-muted)]/40 italic" dir="ltr">{faq.answer.split("||")[1].trim()}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingFaq(faq.id); setEditFaqQ(faq.question); setEditFaqA(faq.answer); }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all">
                                                        <FaPen size={10} />
                                                    </button>
                                                    <button onClick={() => deleteFaq(faq.id)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all">
                                                        <FaTrash size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>}

            </div>

            {/* Delete Employee Confirmation Modal */}
            <AnimatePresence>
                {deleteEmpId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => !deletingEmp && setDeleteEmpId(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="rounded-2xl p-6 max-w-sm w-full text-center" style={{ background: "var(--color-cards)", border: "1px solid rgba(195,216,9,.15)" }}
                            onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dc262620" }}>
                                <FaTrash className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">حذف الحلاق</h3>
                            <p className="text-sm text-[var(--color-text-primary)]/40 mb-6">هل أنت متأكد من حذف &quot;{employees.find(e => e.id === deleteEmpId)?.name}&quot;؟ لا يمكن التراجع.</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setDeleteEmpId(null)} disabled={deletingEmp}
                                    className="h-10 px-6 rounded-xl text-sm text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all">إلغاء</button>
                                <button onClick={() => deleteEmployee(deleteEmpId)} disabled={deletingEmp}
                                    className="h-10 px-6 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50">
                                    {deletingEmp ? "جاري الحذف..." : "حذف نهائياً"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => !deleting && setDeleteId(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="rounded-2xl p-6 max-w-sm w-full text-center" style={{ background: "var(--color-cards)", border: "1px solid rgba(195,216,9,.15)" }}
                            onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dc262620" }}>
                                <FaTrash className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">حذف الخدمة</h3>
                            <p className="text-sm text-[var(--color-text-primary)]/40 mb-6">هل أنت متأكد من حذف &quot;{services.find(s => s.id === deleteId)?.name}&quot;؟ لا يمكن التراجع.</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setDeleteId(null)} disabled={deleting}
                                    className="h-10 px-6 rounded-xl text-sm text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all">إلغاء</button>
                                <button onClick={() => deleteService(deleteId)} disabled={deleting}
                                    className="h-10 px-6 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50">
                                    {deleting ? "جاري الحذف..." : "حذف نهائياً"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InputField({ label, value, onChange, gold, dir, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; gold: string; dir?: string; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] mb-2 block uppercase tracking-wider">{label}</label>
            <input value={value ?? ""} onChange={e => onChange(e.target.value)} dir={dir} placeholder={placeholder} type={type}
                className="w-full py-3.5 px-4 rounded-xl bg-black text-[var(--color-text-primary)] outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:bg-[var(--color-background)]"
                style={{ 
                    border: "1.5px solid var(--border-subtle)",
                    transition: "all 0.2s ease"
                }}
            />
        </div>
    );
}

/* ═══════ Bilingual Input — supports ar||en format ═══════ */
function BilingualInput({ label, value, onChange, gold, placeholderAr, placeholderEn, compact = false }: {
    label?: string; value: string; onChange: (v: string) => void; gold: string; placeholderAr?: string; placeholderEn?: string; compact?: boolean;
}) {
    const hasDelimiter = value?.includes("||");
    const arVal = hasDelimiter ? value.split("||")[0] : (value ?? "");
    const enVal = hasDelimiter ? value.split("||")[1] ?? "" : "";

    const handleAr = (v: string) => onChange(enVal ? `${v}||${enVal}` : v);
    const handleEn = (v: string) => onChange(v ? `${arVal}||${v}` : arVal);

    return (
        <div className={compact ? "" : "w-full"}>
            {label && <label className="text-xs font-bold text-[var(--color-text-muted)] mb-3 block uppercase tracking-wider">{label}</label>}
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <span className={`absolute ${compact ? "top-1 right-2 text-[7px]" : "top-2 right-3 text-[9px]"} font-black tracking-widest text-white/20 z-10`}>AR</span>
                    <input
                        value={arVal}
                        onChange={e => handleAr(e.target.value)}
                        dir="rtl"
                        placeholder={placeholderAr}
                        className={`w-full ${compact ? "pt-3.5 pb-1 px-3 rounded-lg text-[12px]" : "pt-6 pb-3 px-4 rounded-xl text-sm"} bg-black text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-accent)]`}
                        style={{ border: "1.5px solid var(--border-subtle)" }}
                    />
                </div>
                <div className="relative">
                    <span className={`absolute ${compact ? "top-1 left-2 text-[7px]" : "top-2 left-3 text-[9px]"} font-black tracking-widest z-10`} style={{ color: gold }}>EN</span>
                    <input
                        value={enVal}
                        onChange={e => handleEn(e.target.value)}
                        dir="ltr"
                        placeholder={placeholderEn}
                        className={`w-full ${compact ? "pt-3.5 pb-1 px-3 rounded-lg text-[12px]" : "pt-6 pb-3 px-4 rounded-xl text-sm"} bg-black text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-accent)]`}
                        style={{ border: `1.5px solid ${enVal ? gold + "40" : "var(--border-subtle)"}` }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ═══════ Bilingual TextArea — supports ar||en format ═══════ */
function BilingualTextArea({ label, value, onChange, gold, placeholderAr, placeholderEn, rows = 3 }: {
    label?: string; value: string; onChange: (v: string) => void; gold: string; placeholderAr?: string; placeholderEn?: string; rows?: number;
}) {
    const hasDelimiter = value?.includes("||");
    const arVal = hasDelimiter ? value.split("||")[0] : (value ?? "");
    const enVal = hasDelimiter ? value.split("||")[1] ?? "" : "";

    const handleAr = (v: string) => onChange(enVal ? `${v}||${enVal}` : v);
    const handleEn = (v: string) => onChange(v ? `${arVal}||${v}` : arVal);

    return (
        <div className="w-full">
            {label && <label className="text-xs font-bold text-[var(--color-text-muted)] mb-3 block uppercase tracking-wider">{label}</label>}
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <span className="absolute top-2 right-3 text-[9px] font-black tracking-widest text-white/20 z-10">AR</span>
                    <textarea
                        value={arVal}
                        onChange={e => handleAr(e.target.value)}
                        dir="rtl"
                        rows={rows}
                        placeholder={placeholderAr}
                        className="w-full pt-6 pb-3 px-4 rounded-xl bg-black text-[var(--color-text-primary)] outline-none resize-none text-sm transition-all focus:border-[var(--color-accent)]"
                        style={{ border: "1.5px solid var(--border-subtle)" }}
                    />
                </div>
                <div className="relative">
                    <span className="absolute top-2 left-3 text-[9px] font-black tracking-widest z-10" style={{ color: gold }}>EN</span>
                    <textarea
                        value={enVal}
                        onChange={e => handleEn(e.target.value)}
                        dir="ltr"
                        rows={rows}
                        placeholder={placeholderEn}
                        className="w-full pt-6 pb-3 px-4 rounded-xl bg-black text-[var(--color-text-primary)] outline-none resize-none text-sm transition-all focus:border-[var(--color-accent)]"
                        style={{ border: `1.5px solid ${enVal ? gold + "40" : "var(--border-subtle)"}` }}
                    />
                </div>
            </div>
        </div>
    );
}

function BilingualListEditor({ label, value, onChange, gold, placeholderAr, placeholderEn, helperText }: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    gold: string;
    placeholderAr?: string;
    placeholderEn?: string;
    helperText?: string;
}) {
    const lines = (value || "").split(/\r?\n/);
    const arVal = lines.map((line) => line.includes("||") ? line.split("||")[0] : line).join("\n");
    const enVal = lines.map((line) => line.includes("||") ? line.split("||")[1] ?? "" : "").join("\n");

    const mergeValues = (nextAr: string, nextEn: string) => {
        const arLines = nextAr.split(/\r?\n/);
        const enLines = nextEn.split(/\r?\n/);
        const maxLines = Math.max(arLines.length, enLines.length);
        const merged = Array.from({ length: maxLines }, (_, index) => {
            const arLine = arLines[index] ?? "";
            const enLine = enLines[index] ?? "";
            return enLine ? `${arLine}||${enLine}` : arLine;
        });
        onChange(merged.join("\n"));
    };

    return (
        <div className="space-y-3">
            {label && (
                <label className="text-xs font-bold text-[var(--color-text-muted)] block uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: gold }}>Arabic</div>
                    <textarea
                        value={arVal}
                        onChange={(e) => mergeValues(e.target.value, enVal)}
                        placeholder={placeholderAr}
                        rows={6}
                        className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm transition-all resize-y"
                        style={{ border: "1.5px solid var(--border-subtle)" }}
                    />
                </div>
                <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: gold }}>English</div>
                    <textarea
                        value={enVal}
                        onChange={(e) => mergeValues(arVal, e.target.value)}
                        placeholder={placeholderEn}
                        rows={6}
                        dir="ltr"
                        className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none text-sm transition-all resize-y"
                        style={{ border: "1.5px solid var(--border-subtle)" }}
                    />
                </div>
            </div>
            {helperText && (
                <p className="text-[10px] text-[var(--color-text-muted)] italic leading-relaxed">
                    {helperText}
                </p>
            )}
        </div>
    );
}

/* Service Row Component */
function ServiceRow({ service, isEditing, editName, editPrice, editDuration, onEditName, onEditPrice, onEditDuration, onStartEdit, onCancelEdit, onSaveEdit, savingEdit, uploading, onImageUpload, onVideoUpload, onDeleteVideo, onToggle, onDelete, gold, baseUrl }: {
    service: ServiceItem; isEditing: boolean; editName: string; editPrice: string; editDuration: string;
    onEditName: (v: string) => void; onEditPrice: (v: string) => void; onEditDuration: (v: string) => void;
    onStartEdit: () => void; onCancelEdit: () => void; onSaveEdit: () => void; savingEdit: boolean;
    uploading: boolean; onImageUpload: (file: File) => void; onVideoUpload: (file: File) => void; onDeleteVideo: () => void;
    onToggle: () => void; onDelete: () => void;
    gold: string; baseUrl: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const fallbackImages: Record<string, string> = {
        'حلاقة': '/services/haircut.webp',
        'قص شعر فاشن': '/services/haircut.webp',
        'حلاقة أطفال': '/services/haircut.webp',
        'تشذيب لحية': '/services/beard.webp',
        'حلاقة + لحية': '/services/beard.webp',
        'تنظيف بشرة': '/services/facial.webp',
        'صبغة شعر': '/services/coloring.webp',
    };
    const defaultImg = '/services/haircut.webp';
    const imageUrl = assetUrl(service.image_path) || fallbackImages[service.name] || defaultImg;
    const videoUrl = assetUrl(service.video_path || null);

    return (
        <div className={`rounded-2xl p-4 flex flex-col gap-4 transition-all ${!service.is_active ? "opacity-50" : ""}`}
            style={{ background: "var(--color-cards)", border: isEditing ? `1.1px solid ${gold}50` : "1px solid var(--border-subtle)" }}>
            
            <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group bg-black/40 border border-white/5"
                    onClick={() => !uploading && inputRef.current?.click()}>
                    <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaCamera className="text-white" size={14} />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex flex-col gap-3">
                            <BilingualInput value={editName} onChange={onEditName} gold={gold} compact />
                            <div className="grid grid-cols-2 gap-2">
                                <input value={editPrice} onChange={e => onEditPrice(e.target.value)} type="number" step="0.01" dir="ltr"
                                    className="w-full py-2 px-3 rounded-lg bg-black text-[var(--color-text-primary)] outline-none text-sm border border-white/10" />
                                <input value={editDuration} onChange={e => onEditDuration(e.target.value)} type="number" min="1" dir="ltr"
                                    className="w-full py-2 px-3 rounded-lg bg-black text-[var(--color-text-primary)] outline-none text-sm border border-white/10" />
                            </div>
                        </div>
                    ) : (
                        <div className="py-0.5">
                            <h3 className="font-bold text-[15px] truncate text-[var(--color-text-primary)]">
                                {service.name?.includes("||") ? service.name.split("||")[0].trim() : service.name}
                                {service.name?.includes("||") && service.name.split("||")[1]?.trim() && (
                                    <span className="text-[10px] text-white/30 font-mono ml-2 lowercase">/ {service.name.split("||")[1].trim()}</span>
                                )}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-sm font-black" style={{ color: gold }}>{Number(service.price).toFixed(2)} د.أ</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-widest">{service.duration_minutes} MINS</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button onClick={onSaveEdit} disabled={savingEdit} className="w-9 h-9 rounded-xl flex items-center justify-center bg-lime-500/10 text-lime-400 border border-lime-500/20">
                                {savingEdit ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <FaCheck size={14} />}
                            </button>
                            <button onClick={onCancelEdit} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/20 hover:text-white bg-white/5 border border-white/10">
                                <FaTimes size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onStartEdit} title="تعديل" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <FaPen size={11} />
                            </button>
                            <button onClick={onToggle} title={service.is_active ? "تعطيل" : "تفعيل"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${service.is_active ? "text-emerald-400 bg-emerald-400/5" : "text-red-400 bg-red-400/5"}`}>
                                {service.is_active ? <FaEye size={11} /> : <FaEyeSlash size={11} />}
                            </button>
                            <button onClick={onDelete} title="حذف" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/10 hover:text-red-400 transition-all">
                                <FaTrash size={11} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center gap-3">
                <button type="button" onClick={() => !uploading && videoInputRef.current?.click()} className="text-[10px] uppercase font-bold tracking-widest text-white/30 hover:text-white">
                    Video {service.video_path ? "✓" : "+"}
                </button>
                {videoUrl && (
                    <button type="button" onClick={onDeleteVideo} className="text-[10px] uppercase font-bold tracking-widest text-red-500/40 hover:text-red-500">
                        Remove
                    </button>
                )}
            </div>
            
            {videoUrl && (
                <div className="mt-1 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                    <video src={videoUrl} controls playsInline className="w-full max-h-48 object-cover opacity-60" />
                </div>
            )}
            
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.target.value=""; }} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onVideoUpload(f); e.target.value=""; }} />
        </div>
    );
}
/* Employee Card Component */
function EmployeeCard({
    emp, isEditing, editName, editPhone, editSpecialty,
    onEditName, onEditPhone, onEditSpecialty,
    onStartEdit, onCancelEdit, onSaveEdit, savingEdit,
    uploading, onPhotoUpload, onDelete, gold,
}: {
    emp: EmployeeItem;
    isEditing: boolean;
    editName: string; editPhone: string; editSpecialty: string;
    onEditName: (v: string) => void; onEditPhone: (v: string) => void; onEditSpecialty: (v: string) => void;
    onStartEdit: () => void; onCancelEdit: () => void; onSaveEdit: () => void; savingEdit: boolean;
    uploading: boolean; onPhotoUpload: (file: File) => void;
    onDelete: () => void; gold: string;
}) {
    const photoRef = useRef<HTMLInputElement>(null);

    const displayNameAr = emp.name?.includes("||") ? emp.name.split("||")[0].trim() : emp.name;
    const initials = (displayNameAr || "??")
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-2xl p-5 flex flex-col gap-5 transition-all"
            style={{
                background: "var(--color-cards)",
                border: isEditing ? `1.5px solid ${gold}50` : "1px solid rgba(195,216,9,.1)",
                boxShadow: isEditing ? `0 8px 30px ${gold}10` : "none",
            }}
        >
            <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => !uploading && photoRef.current?.click()}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/5 bg-black/40 flex items-center justify-center">
                        {uploading ? (
                            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: gold }} />
                        ) : assetUrl(emp.photo_path) ? (
                            <img src={assetUrl(emp.photo_path)!} alt="" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                        ) : (
                            <span className="text-xl font-black" style={{ color: gold }}>{initials}</span>
                        )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                        <FaCamera className="text-white" size={14} />
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoUpload(f); e.target.value=""; }} />
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex flex-col gap-3">
                            <BilingualInput value={editName} onChange={onEditName} gold={gold} compact />
                            <div className="relative">
                                <span className="absolute top-1 left-2 text-[7px] text-white/30 font-bold uppercase">Phone</span>
                                <input value={editPhone} onChange={e => onEditPhone(e.target.value)} placeholder="079..." dir="ltr"
                                    className="w-full pt-4 pb-1.5 px-3 rounded-lg bg-black/40 text-[var(--color-text-primary)] outline-none text-xs border border-white/10" />
                            </div>
                            <BilingualInput value={editSpecialty} onChange={onEditSpecialty} gold={gold} placeholderAr="التخصص" compact />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-white truncate">
                                {emp.name?.includes("||") ? emp.name.split("||")[0].trim() : emp.name}
                                {emp.name?.includes("||") && emp.name.split("||")[1]?.trim() && (
                                    <span className="text-[10px] text-white/20 font-mono ml-2">/ {emp.name.split("||")[1].trim()}</span>
                                )}
                            </h4>
                            {emp.specialty && (
                                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: gold }}>
                                    {emp.specialty.includes("||") ? emp.specialty.split("||")[0].trim() : emp.specialty}
                                    {emp.specialty.includes("||") && emp.specialty.split("||")[1]?.trim() && (
                                        <span className="opacity-40 ml-1">({emp.specialty.split("||")[1].trim()})</span>
                                    )}
                                </p>
                            )}
                            {emp.phone && (
                                <p className="text-[10px] text-white/30 font-mono" dir="ltr">{emp.phone}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                {isEditing ? (
                    <>
                        <button onClick={onSaveEdit} disabled={savingEdit} className="flex-1 h-9 rounded-xl flex items-center justify-center gap-2 bg-lime-500/10 text-lime-400 border border-lime-500/20 font-bold text-xs">
                            <FaSave size={12} /> {savingEdit ? "جار الحفظ" : "حفظ"}
                        </button>
                        <button onClick={onCancelEdit} className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 text-white/40 border border-white/10">
                            <FaTimes size={12} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onStartEdit} className="flex-1 h-9 rounded-xl flex items-center justify-center gap-2 bg-white/5 text-white/40 hover:text-white transition-all font-bold text-xs">
                            <FaPen size={11} /> تعديل
                        </button>
                        <button onClick={onDelete} className="h-9 w-9 rounded-xl flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <FaTrash size={11} />
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}


function TimePicker12({ label, value, onChange, gold }: {
    label: string; value: string; onChange: (v: string) => void; gold: string;
}) {
    // Parse 24h value (HH:MM) → 12h parts
    const [h24, m] = (value || "09:00").split(":").map(Number);

    // Special: 00:00 = midnight
    const isMidnight = h24 === 0 && m === 0;
    const period = isMidnight ? "ص" : h24 >= 12 ? "م" : "ص";
    const h12 = isMidnight ? 12 : h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

    const update = (newH12: number, newM: number, newPeriod: string) => {
        let h = newH12;
        if (newPeriod === "م" && h !== 12) h += 12;
        if (newPeriod === "ص" && h === 12) h = 0; // 12 ص = منتصف الليل = 00:00
        onChange(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
    };

    const selectStyle = { background: "var(--color-cards)", border: "1.5px solid var(--border-subtle)" };

    return (
        <div>
            <label className="text-xs font-bold text-[var(--color-text-primary)]/30 mb-2 block uppercase tracking-wider">{label}</label>
            <div className="flex gap-2" dir="ltr">
                <select value={h12} onChange={e => update(Number(e.target.value), m, period)}
                    className="flex-1 py-3 px-2 rounded-xl text-[var(--color-text-primary)] outline-none text-sm text-center transition-all cursor-pointer appearance-none"
                    style={selectStyle}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <span className="flex items-center text-[var(--color-text-primary)]/20 text-lg font-bold">:</span>
                <select value={m} onChange={e => update(h12, Number(e.target.value), period)}
                    className="flex-1 py-3 px-2 rounded-xl text-[var(--color-text-primary)] outline-none text-sm text-center transition-all cursor-pointer appearance-none"
                    style={selectStyle}>
                    {[0, 15, 30, 45].map(min => (
                        <option key={min} value={min}>{String(min).padStart(2, "0")}</option>
                    ))}
                </select>
                <select value={period} onChange={e => update(h12, m, e.target.value)}
                    className="w-16 py-3 px-1 rounded-xl text-[var(--color-text-primary)] outline-none text-sm text-center transition-all cursor-pointer appearance-none font-bold"
                    style={{ ...selectStyle, color: gold }}>
                    <option value="ص">ص</option>
                    <option value="م">م</option>
                </select>
            </div>
            {/* Show midnight hint */}
            {isMidnight && (
                <p className="text-[10px] mt-1.5 font-bold" style={{ color: gold }}>
                    ✓ منتصف الليل (00:00)
                </p>
            )}
            {!isMidnight && (
                <p className="text-[10px] mt-1.5 text-[var(--color-text-muted)]/40">
                    للعمل حتى منتصف الليل: اختر 12 ص
                </p>
            )}
        </div>
    );
}
