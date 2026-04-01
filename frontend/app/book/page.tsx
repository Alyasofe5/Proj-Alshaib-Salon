"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function BookingRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = searchParams.get("s") || searchParams.get("salon");

    useEffect(() => {
        if (slug) {
            router.replace(`/book/${slug}`);
        }
    }, [slug, router]);

    if (!slug) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-[#F5F2EC] dir-rtl">
                <div className="text-center">
                    <h1 className="text-4xl font-black mb-4">منصة مقص</h1>
                    <p className="text-white/40">يرجى اختيار صالون للمتابعة</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
            <div className="w-10 h-10 rounded-full animate-spin border-3 border-[rgba(195,216,9,0.15)] border-t-[#C3D809]" />
        </div>
    );
}

export default function Page() {
    return (
        <Suspense>
            <BookingRedirect />
        </Suspense>
    );
}
