export interface Service { id: number; name: string; price: string; duration_minutes: number | null; image: string | null; video?: string | null; }
export interface Employee { id: number; name: string; avatar?: string; role?: string; specialty?: string; }
export interface SalonInfo {
    name: string; slug: string; logo: string | null; logo_path?: string | null; phone: string | null;
    description: string; secondary_description?: string; address: string; instagram: string;
    whatsapp?: string; facebook?: string; booking_message: string;
    hero_image: string | null;
    hero_video?: string | null;
    hero_type?: string;
    gallery?: string[];
    reviews?: { id: number; customer_name: string; rating: number; comment: string; role?: string; }[];
    faqs?: { id: number; question: string; answer: string; }[];
    // New Content Fields
    hero_title?: string;
    about_title?: string;
    about_subtitle?: string;
    about_description?: string;
    about_image_1?: string;
    about_image_2?: string;
    services_title?: string;
    services_subtitle?: string;
    services_description?: string;
    services_ticker?: string;
    team_title?: string;
    team_subtitle?: string;
    team_description?: string;
    gallery_title?: string;
    gallery_subtitle?: string;
        reviews_title?: string;
        reviews_subtitle?: string;
        stats_years?: string;
        stats_clients?: string;
        stats_experts?: string;
        faq_title?: string;
        faq_subtitle?: string;
        discount_active?: number;
        discount_percentage?: string;
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
export const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmt12 = (t: string, lang?: string) => { const [h, m] = t.split(":").map(Number); const displayH = h % 12 === 0 ? 12 : h % 12; const isAm = h < 12; const ampm = lang === 'en' ? (isAm ? "AM" : "PM") : (isAm ? "ص" : "م"); return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`; };
export const API = process.env.NEXT_PUBLIC_API_URL || "/api";
