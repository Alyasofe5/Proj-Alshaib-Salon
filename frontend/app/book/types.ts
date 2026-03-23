export interface Service { id: number; name: string; price: string; duration_minutes: number | null; image: string | null; }
export interface Employee { id: number; name: string; avatar?: string; role?: string; }
export interface SalonInfo {
    name: string; slug: string; logo: string | null; phone: string | null;
    description: string; address: string; instagram: string; booking_message: string;
    hero_image: string | null;
    gallery?: string[];
    reviews?: { id: number; customer_name: string; rating: number; comment: string; }[];
    faqs?: { id: number; question: string; answer: string; }[];
}

export interface BookingSel {
    service_ids: number[];
    employee_id: number;
    booking_date: string;
    booking_time: string;
    customer_name: string;
    customer_phone: string;
    notes: string;
}

export const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export const fmt12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "م" : "ص"}`; };
export const API = process.env.NEXT_PUBLIC_API_URL || "/api";
