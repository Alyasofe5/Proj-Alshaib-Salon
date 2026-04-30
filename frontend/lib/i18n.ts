export const AUTO_TRANSLATE_MAP: Record<string, string> = {
    // --- Brand & Basic ---
    "صالون الشايب": "Al-Shaib Salon",
    "الشايب": "Al-Shaib",
    "صالون مقص": "Maqass Salon",
    "مقص": "Maqass",
    "تجربة استثنائية تجمع بين الفن العريق والأسلوب المعاصر في قلب العاصمة.": "An exceptional experience combining ancient art and contemporary style in the heart of the capital.",

    // --- Hero & About ---
    "أين يلتقي الإبــــداع بالأناقة": "Where Creativity Meets Elegance",
    "قصتنا": "Our Story",
    "لمسة من الإبداع": "A Touch of Creativity",
    "ادخل إلى عالم يروي فيه كل مظهر قصة. يجمع خبراء الشايب بين التقنيات الأصيلة والفن الحديث لخلق مظهرك الفريد، بأسلوب يعكس شخصيتك ويرتقي بتجربتك.": "Step into a world where every look tells a story. Our experts combine authentic techniques and modern art to create your unique look, reflecting your personality and elevating your experience.",

    // --- Promotions ---
    "خصم": "Discount",
    "بمناسبة الافتتاح": "Opening Special",
    "للعملاء الجدد": "for new customers",
    "عرض خاص": "Special Offer",
    "عرض لفترة محدودة": "Limited Time Offer",

    // --- Sections ---
    "قائمة الخدمات": "Service Menu",
    "خدمات الصالون": "Our Services",
    "اختر الخدمة، شاهد لمحة فورية، ثم احجز بضغطة واحدة. تصميم واضح لتجربة راقية وعناية دقيقة تليق بك.": "Select a service, view an instant preview, and book with one click. Simple design for a refined experience and care that suits you.",
    "أيدي مبدعة": "Creative Hands",
    "فريق العمل": "Our Team",
    "خبراء محترفون يجمعون بين المهارة والإبداع لتقديم أفضل النتائج.": "Professional experts combining skill and creativity to deliver the best results.",
    "معرض أعمالنا": "Our Gallery",
    "لمحة عن إبداعاتنا وأعمالنا المميزة": "A glimpse of our work and unique creations",
    "ماذا يقول عنا العملاء": "What Our Clients Say",
    "آراء عملائنا": "Client Reviews",

    // --- Stats & Footer ---
    "سنوات خبرة": "Years of Exp.",
    "عميل سعيد": "Happy Clients",
    "خبير حلاقة": "Hair Experts",
    "موقعنا": "Our Location",
    "ساعات العمل": "Opening Hours",
    "تواصل معنا": "Contact Us",
    "جميع الحقوق محفوظة": "All Rights Reserved",
    "طورت بواسطة": "Developed by",

    // --- Booking Actions ---
    "احجز الآن": "Book Now",
    "اكتشف المزيد": "Discover More",
    "متوفر الآن": "Available Now",
    "أيام العمل": "Working Days",
    "مغلق": "Closed",

    // --- Roles ---
    "حلاق": "Barber",
    "كوافير": "Stylist",
    "خبير مظهر": "Style Expert",
    "أخصائي بشرة": "Skin Specialist",
    "مصفف شعر": "Hair Stylist",
    "حلاق رئيسي": "Master Barber",
    "Elite Barber": "Elite Barber",

    // --- Sections (Management) ---
    "قسم الشعر": "Hair Section",
    "قسم الذقن": "Beard Section",
    "العناية بالبشرة": "Skin Care",
    "باقات العرسان": "Groom Packages",
    "باقات العريس": "Groom Packages",

    // --- Services ---
    "حلاقة": "Haircut",
    "قص شعر": "Haircut",
    "حلاقة ذقن": "Beard Trim",
    "حلاقة وتحديد": "Trim & Line-up",
    "شعر وذقن": "Hair & Beard",
    "تصفيف شعر": "Hair Styling",
    "تنظيف بشرة عادي": "Standard Facial",
    "تنظيف بشرة عميق": "Deep Facial",
    "سشوار": "Blowdry",
    "استشوار": "Blowdry",
    "صبغة شعر": "Hair Coloring",
    "صبغة": "Dye",
    "كراتين": "Keratin",
    "كرياتين": "Keratin",
    "كيراتين شعر": "Hair Keratin",
    "بروتين شعر": "Hair Protein",
    "بروتين": "Protein",
    "حمام مغربي": "Moroccan Bath",
    "حمام": "Bath",
    "مغربي": "Moroccan",
    "مساج": "Massage",
    "بديكير ومنيكير": "Mani & Pedi",
    "تجميل": "Beauty",
    "مظهر": "Appearance",
    "عناية بالوجه": "Facial Care",
    "تنظيف بشرة": "Facial Cleansing",
    "مساج رأس": "Head Massage",
    "مساج وجه": "Face Massage",
    "ذقن": "Beard",
    "تنظيف": "Cleaning",
    "بشرة": "Skin",
    "تجهيز": "Grooming",
    "عريس": "Groom",
    "تقوية شعر": "Hair Strengthening",
    "عناية شعر": "Hair Care",
    "ماسك شعر": "Hair Mask",
    "تقوية": "Treatment",
    "علاج": "Treatment",
    "باقة": "Package",
    "خدمة": "Service",
    "خدمات": "Services",
};

/**
 * Handles bilingual strings separated by "||" and provides auto-translation fallbacks.
 * Usage: tData("Name AR||Name EN", "ar") -> "Name AR"
 */
export const tData = (text: string | null | undefined, lang: 'ar' | 'en'): string => {
    if (!text) return "";

    const trimmedText = text.trim();
    if (!trimmedText) return "";

    // Support bilingual format: "Arabic||English"
    if (trimmedText.includes("||")) {
        const parts = trimmedText.split("||").map(s => s.trim());
        const arText = parts[0] || "";
        const enText = parts[1] || arText || ""; // Fallback to Arabic if English part is missing
        return lang === 'ar' ? arText : enText;
    }

    // If already in the target language (assuming most raw data is Arabic)
    if (lang === 'ar') return trimmedText;

    // For non-Arabic, try auto-translation map
    if (AUTO_TRANSLATE_MAP[trimmedText]) return AUTO_TRANSLATE_MAP[trimmedText];

    // Try partial translation for multi-word strings
    let translated = trimmedText;
    Object.keys(AUTO_TRANSLATE_MAP).forEach(key => {
        // Only replace whole words to avoid partial matches inside other words
        if (key.split(" ").length === 1) {
            const regex = new RegExp(`(?<=^|\\s)${key}(?=\\s|$)`, 'g');
            translated = translated.replace(regex, AUTO_TRANSLATE_MAP[key]);
        }
    });

    // Handle common numeric patterns
    translated = translated.replace(/(\d+)\s+دقيقة/g, '$1 min');
    translated = translated.replace(/(\d+)\s+دينار/g, '$1 JOD');
    translated = translated.replace(/(\d+)\s+د\.أ/g, '$1 JOD');
    translated = translated.replace(/د\.أ/g, 'JOD');

    return translated;
};

/* ──────────────────────────────────────────────────────────────────────────
   PROFESSIONAL BILINGUAL HANDLER
   Single source of truth for displaying any DB value across the entire app.
   Handles:
     - Plain strings:                "قص شعر"
     - Legacy bilingual strings:     "قص شعر||Haircut"
     - Future structured objects:    { ar: "قص شعر", en: "Haircut" }
     - Multi-item joins:             "قص شعر||Haircut + ذقن||Beard"
     - null / undefined / non-strings — never throws.

   USAGE:
     import { t, tList } from '@/lib/i18n';
     {t(b.service_name)}              // → Arabic by default
     {t(b.service_name, 'en')}        // → English
     {tList(b.service_names)}         // → "قص شعر + ذقن"

   This is the ONLY function admin/dashboard pages should use to render
   user-facing fields stored in the database. Do NOT print raw DB strings.
   ────────────────────────────────────────────────────────────────────────── */

type BiValue = string | number | { ar?: string | null; en?: string | null } | null | undefined;

const stripOneSegment = (raw: string, lang: 'ar' | 'en'): string => {
    if (!raw.includes("||")) return raw.trim();
    const [ar = "", en = ""] = raw.split("||").map(s => s.trim());
    if (lang === 'ar') return ar || en;
    return en || ar;
};

export const t = (value: BiValue, lang: 'ar' | 'en' = 'ar'): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
        return (lang === 'ar' ? (value.ar || value.en) : (value.en || value.ar)) || "";
    }
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return stripOneSegment(trimmed, lang);
};

/** For comma/plus-separated lists like "A||A_en + B||B_en" → "A + B" */
export const tList = (
    value: BiValue,
    lang: 'ar' | 'en' = 'ar',
    separator: string = " + "
): string => {
    const raw = t(value, lang);
    if (!raw) return "";
    // Split by the most common joiners while preserving the user-facing separator
    return raw
        .split(/\s*[+,،]\s*/)
        .map(part => stripOneSegment(part, lang))
        .filter(Boolean)
        .join(separator);
};
