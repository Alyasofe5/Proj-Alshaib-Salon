"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Calendar, Clock, UserCircle, X, Sparkles, AlertCircle, Check, CheckCircle2, ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { Service, Employee, SalonInfo, BookingSel, dayNames, dayNamesEn, monthNames, monthNamesEn, fmt12 } from "./types";

const spring = { type: "spring" as const, stiffness: 120, damping: 22 };

const C = {
  bg:        "var(--color-background)",
  surface:   "#171618",
  surface2:  "#222022",
  border:    "rgba(255,255,255,0.08)",
  text:      "var(--color-text-primary)",
  muted:     "rgba(255,255,255,0.4)",
  lime:      "#C3D809",
  limeBg:    "rgba(195,216,9,0.08)",
  limeBrd:   "rgba(195,216,9,0.25)",
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: SalonInfo;
  services: Service[];
  employees: Employee[];
  step: number;
  setStep: (v: number | ((p: number) => number)) => void;
  sel: BookingSel;
  setSel: (v: BookingSel | ((p: BookingSel) => BookingSel)) => void;
  dates: string[];
  bookedSlots: any[];
  offEmployeesIds: number[];
  fetchBooked: (empId: number, date: string) => void;
  genTimes: () => string[];
  totalPrice: number;
  subtotal: number;
  hasDiscount: boolean;
  discountPercent: number;
  totalDur: number;
  selSrvs: Service[];
  submitting: boolean;
  error: string;
  submitBooking: () => void;
  toggleSrv: (id: number) => void;
  lang: 'ar' | 'en';
  tData: (text: string | null | undefined, lang: 'ar' | 'en') => string;
}

export default function BookingModal({
  isOpen, onClose, salon, services, employees, step, setStep, sel, setSel,
  dates, bookedSlots, offEmployeesIds, fetchBooked, genTimes, totalPrice, totalDur, selSrvs,
  submitting, error, submitBooking, toggleSrv, lang, tData, subtotal, hasDiscount, discountPercent
}: BookingModalProps) {

  const STEPS = lang === 'ar' ? ["الخدمات", "الحلاق", "الموعد", "البيانات"] : ["Services", "Barber", "Date", "Details"];

  useEffect(() => {
    if (isOpen && sel.booking_date) {
      fetchBooked(sel.employee_id, sel.booking_date);
    }
  }, [isOpen, sel.booking_date, sel.employee_id, fetchBooked]);

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setSel({ service_ids: [], employee_id: 0, booking_date: "", booking_time: "", customer_name: "", customer_phone: "", notes: "" });
    }, 400);
  };

  const canProceed =
    (step === 1 && sel.service_ids.length > 0) ||
    step === 2 ||
    (step === 3 && !!sel.booking_date && !!sel.booking_time) ||
    step === 4;

  const handleNext = () => {
    if (!canProceed) return;
    if (step === 4) submitBooking();
    else setStep(p => p + 1);
  };

  return (
    <>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)" }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="pointer-events-auto w-full flex flex-col overflow-hidden relative"
              style={{
                direction: lang === 'en' ? "ltr" : "rtl",
                maxWidth: 720,
                maxHeight: "94vh",
                background: "#080808",
                boxShadow: "0 -20px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03)",
                ...(typeof window !== "undefined" && window.innerWidth >= 640 ? { borderRadius: "2.5rem" } : { borderRadius: "2.5rem 2.5rem 0 0" }),
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Premium Glow effect behind modal content */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#C3D809]/[0.02] blur-[100px] pointer-events-none" />

              {/* Top Handle for mobile feel */}
              <div className="sm:hidden w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />

              {/* Header section with glass title */}
              <div className="relative px-6 sm:px-10 pt-6 sm:pt-10 pb-6 flex items-start justify-between">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C3D809] animate-pulse" />
                      <span className="text-[#C3D809] text-[10px] sm:text-[11px] font-black tracking-[0.4em] uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
                        {lang === 'ar' ? "نظام حجز ذكي" : "SMART BOOKING"}
                      </span>
                   </div>
                   <h2 className="text-white text-3xl sm:text-4xl leading-tight" style={{ fontFamily: lang === 'en' ? "'Playfair Display', serif" : "'Noto Sans Arabic', sans-serif", fontWeight: 900 }}>
                     {lang === 'ar' ? "خطوة واحدة لنجمك" : "Claim Your Style"}<span className="text-[#C3D809]">.</span>
                   </h2>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all bg-white/[0.02] hover:bg-white/5 active:scale-90">
                   <X size={20} />
                </button>
              </div>

              {/* Interactive Step Progress Bar */}
              <div className="px-6 sm:px-10 mb-8 mt-2 flex items-center gap-2">
                {STEPS.map((label, i) => {
                  const s = i + 1;
                  const active = s === step;
                  const completed = s < step;
                  return (
                    <div key={label} className="flex-1 group">
                       <div className="h-1.5 rounded-full bg-white/[0.03] relative overflow-hidden mb-3">
                          <motion.div 
                            initial={false}
                            animate={{ width: completed ? "100%" : active ? "100%" : "0%" }}
                            className={`absolute inset-0 ${completed ? "bg-white/20" : "bg-[#C3D809]"}`}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          />
                          {active && (
                             <motion.div 
                               animate={{ x: ["-100%", "200%"] }} 
                               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-2/3" 
                             />
                          )}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${active ? "text-[#C3D809] translate-y-0 opacity-100" : "text-white/10 translate-y-1 opacity-50"}`}>
                         {label}
                       </span>
                    </div>
                  );
                })}
              </div>

              {/* Main Scrolling Content Area */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-32 pt-2 hide-scroll scroll-smooth" id="booking-scroll-area">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="s1-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-4">
                      {services.map((s, idx) => {
                        const active = sel.service_ids.includes(s.id);
                        return (
                          <motion.div 
                            key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileTap={{ scale: 0.98 }} 
                            onClick={() => toggleSrv(s.id)}
                            className={`relative group flex items-center p-4 sm:p-5 rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden border ${
                              active 
                                ? "bg-[#C3D809]/[0.08] border-[#C3D809]/40 shadow-[0_0_30px_rgba(195,216,9,0.05)]" 
                                : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                            }`}
                          >
                             {/* Service Media */}
                             <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black/40 shrink-0 transition-all duration-500 ${active ? "ring-2 ring-[#C3D809]/50 shadow-lg shadow-[#C3D809]/20" : "border border-white/5"}`}>
                                {assetUrl(s.image || (s as any).image_path) ? (
                                  <img 
                                    src={assetUrl(s.image || (s as any).image_path)!} 
                                    className={`w-full h-full object-cover transition-transform duration-1000 ${active ? "scale-110" : "group-hover:scale-110"}`} 
                                    alt={s.name}
                                    onError={(e) => {
                                      (e.target as any).style.display = 'none';
                                      (e.target as any).parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                
                                <div className={`fallback-icon absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none ${assetUrl(s.image || (s as any).image_path) ? 'hidden' : 'flex'}`}>
                                    <Scissors size={28} />
                                </div>

                                {active && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 bg-[#C3D809]/80 backdrop-blur-[2px] flex items-center justify-center"
                                  >
                                    <Check size={32} strokeWidth={4} className="text-black" />
                                  </motion.div>
                                )}
                             </div>
 
                             {/* Service Details */}
                             <div className="flex-1 px-5 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`text-lg sm:text-xl font-black truncate transition-colors duration-300 ${active ? "text-[#C3D809]" : "text-white"}`} style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                    {tData(s.name, lang)}
                                  </h4>
                                  {idx === 0 && (
                                    <span className="shrink-0 text-[7px] bg-[#C3D809] text-black px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-[#C3D809]/20">Popular</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className="flex items-center gap-1 text-white/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                      <Clock size={10} className={active ? "text-[#C3D809]/50" : ""} /> {s.duration_minutes || 0} {lang === 'ar' ? "دقيقة" : "min"}
                                   </span>
                                   <div className={`h-1 w-1 rounded-full ${active ? "bg-[#C3D809]/30" : "bg-white/10"}`} />
                                   <span className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-tight truncate max-w-[100px]">Elite Service</span>
                                </div>
                             </div>
 
                             <div className="text-right shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className={`block text-xl sm:text-2xl font-black tracking-tighter transition-all duration-300 ${active ? "text-[#C3D809] scale-105" : "text-white"}`}>
                                        {s.price} <small className="text-[10px] opacity-70">JOD</small>
                                    </span>
                                    <span className="text-white/10 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                        {lang === 'ar' ? "يبدأ من" : "FROM"}
                                    </span>
                                </div>
                             </div>

                             {/* Interactive Background Glow for active state */}
                             {active && (
                               <motion.div 
                                 layoutId="active-glow"
                                 className="absolute -inset-x-20 -inset-y-10 bg-[#C3D809]/[0.02] blur-[40px] z-[-1]"
                               />
                             )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="s2-barbers" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Anyone Option (Card Style) */}
                      <motion.div 
                        whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} 
                        onClick={() => { setSel(p => ({ ...p, employee_id: 0 })); setStep(3); }}
                        className={`group flex flex-col items-center justify-center p-8 rounded-[3rem] transition-all duration-500 border relative overflow-hidden ${sel.employee_id === 0 ? "bg-[#C3D809]/[0.08] border-[#C3D809]/40 shadow-[0_20px_40px_rgba(195,216,9,0.1)]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"}`}
                      >
                         <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${sel.employee_id === 0 ? "bg-[#C3D809] text-black shadow-[0_0_30px_rgba(195,216,9,0.4)] scale-110" : "bg-white/5 text-white/30 group-hover:scale-105"}`}>
                            <Sparkles size={32} />
                         </div>
                         <h4 className={`text-xl font-black text-center transition-colors ${sel.employee_id === 0 ? "text-[#C3D809]" : "text-white"}`} style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                            {lang === 'ar' ? "أي حلاق متاح" : "First Available"}
                         </h4>
                         <p className="text-white/20 text-[10px] text-center mt-2 font-black uppercase tracking-widest">{lang === 'ar' ? "دخول أسرع" : "FASTEST ENTRY"}</p>
                         {sel.employee_id === 0 && <div className="absolute top-6 right-8 text-[#C3D809]"><CheckCircle2 size={24} /></div>}
                      </motion.div>

                      {employees.map(emp => {
                        const active = sel.employee_id === emp.id;
                        return (
                          <motion.div 
                            key={emp.id}
                            whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} 
                            onClick={() => { setSel(p => ({ ...p, employee_id: emp.id })); setStep(3); }}
                            className={`group flex flex-col items-center p-8 rounded-[3rem] transition-all duration-500 border relative overflow-hidden ${active ? "bg-[#C3D809]/[0.08] border-[#C3D809]/40 shadow-[0_20px_40px_rgba(195,216,9,0.1)]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"}`}
                          >
                             {/* Avatar Composition */}
                             <div className={`relative w-24 h-24 mb-6 transition-all duration-500 ${active ? "scale-110" : "group-hover:scale-105"}`}>
                                <div className={`w-full h-full rounded-[2.5rem] overflow-hidden border-2 p-1 transition-all ${active ? "border-[#C3D809] shadow-lg shadow-[#C3D809]/20" : "border-white/10 grayscale-[50%] group-hover:grayscale-0"}`}>
                                    {assetUrl(emp.avatar || (emp as any).photo_path) ? (
                                      <img src={assetUrl(emp.avatar || (emp as any).photo_path)!} className="w-full h-full rounded-[2rem] object-cover" alt={emp.name} />
                                    ) : (
                                      <div className="w-full h-full rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10"><UserCircle size={40} /></div>
                                    )}
                                </div>
                                {active && <div className="absolute -top-2 -right-2 bg-[#C3D809] text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg"><Check size={20} strokeWidth={4} /></div>}
                             </div>

                             {/* Name & Role Centered */}
                             <div className="text-center w-full px-2">
                                <h4 className={`text-lg sm:text-xl font-black leading-tight mb-2 transition-colors ${active ? "text-[#C3D809]" : "text-white"}`} 
                                    style={{ 
                                        fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif",
                                        wordBreak: "break-word"
                                    }}>
                                   {tData(emp.name, lang)}
                                </h4>
                                <span className={`text-[9px] uppercase font-black tracking-[0.2em] transition-opacity ${active ? "text-[#C3D809] opacity-100" : "text-white/20 opacity-60"}`}>
                                    {tData(emp.role || "Elite Barber", lang)}
                                </span>
                             </div>

                             {/* Bottom Status */}
                             <div className="mt-8 pt-4 border-t border-white/5 w-full flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C3D809] animate-pulse" />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${active ? "text-white" : "text-white/20"}`}>
                                    {lang === 'ar' ? "متوفر الآن" : "AVAILABLE"}
                                </span>
                             </div>
                             
                             {active && (
                               <motion.div 
                                 layoutId="active-emp-glow"
                                 className="absolute inset-0 bg-gradient-to-b from-[#C3D809]/[0.03] to-transparent z-[-1]"
                               />
                             )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="s3-date" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
                       {/* Date Carousel (Horizontal scrolling with snap) */}
                       <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 hide-scroll snap-x">
                          {dates.map((d, i) => {
                            const dateObj = new Date(d);
                            const isSel = sel.booking_date === d;
                            return (
                              <motion.button 
                                key={d} 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSel(p => ({ ...p, booking_date: d, booking_time: "" }))}
                                className={`shrink-0 flex flex-col items-center gap-1.5 py-7 px-7 rounded-[2.5rem] transition-all duration-500 snap-center min-w-[90px] ${isSel ? "bg-[#C3D809] text-black shadow-xl shadow-[#C3D809]/20" : "bg-white/[0.03] border border-white/5 text-white hover:bg-white/[0.08]"}`}
                              >
                                <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">{i === 0 ? (lang === 'ar' ? "اليوم" : "Today") : (lang === 'en' ? dayNamesEn[dateObj.getDay()].slice(0, 3) : dayNames[dateObj.getDay()])}</span>
                                <span className="text-4xl font-black leading-none">{dateObj.getDate()}</span>
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{lang === 'en' ? monthNamesEn[dateObj.getMonth()] : monthNames[dateObj.getMonth()]}</span>
                              </motion.button>
                            );
                          })}
                       </div>

                       {/* Time Grid */}
                       <div className="space-y-6">
                          <div className="flex items-center gap-3 text-white/20 uppercase text-[10px] font-black tracking-[0.4em]">
                             <Clock size={12} className="text-[#C3D809]" />
                             {lang === 'ar' ? "المواعيد المتاحة" : "Available Slots"}
                          </div>
                          
                          {sel.employee_id !== 0 && offEmployeesIds.includes(sel.employee_id) ? (
                            <div className="flex flex-col items-center py-16 bg-red-500/[0.03] rounded-[3rem] border border-dashed border-red-500/20 w-full text-center">
                              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6"><AlertCircle size={32} /></div>
                              <h3 className="text-white text-lg font-black">{lang === 'ar' ? "الحلاق في إجازة" : "Barber on Leave"}</h3>
                              <p className="text-white/40 text-xs mt-2 text-center px-8 lg:px-20 leading-relaxed">
                                {lang === 'ar' 
                                  ? "عذراً، هذا الحلاق غير متوفر في التاريخ المختار بسبب إجازة. يرجى اختيار تاريخ آخر أو العودة وتغيير الحلاق." 
                                  : "Sorry, this barber is unavailable on the selected date. Please choose another date or go back and pick another barber."}
                              </p>
                            </div>
                          ) : genTimes().length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                               {genTimes().map(t => {
                                 const isBooked = bookedSlots.some(b => (typeof b === "string" ? b : b?.booking_time) === t);
                                 const isSel = sel.booking_time === t;

                                 if (isBooked) return null; // Hide booked slots for a cleaner "available" view

                                 return (
                                   <motion.button 
                                     key={t}
                                     whileTap={{ scale: 0.94 }}
                                     onClick={() => setSel(p => ({ ...p, booking_time: t }))}
                                     className={`relative py-5 rounded-[1.5rem] text-[13px] font-black transition-all duration-300 border ${isSel ? "bg-[#C3D809] text-black border-transparent shadow-lg shadow-[#C3D809]/10" : "bg-white/[0.03] border-white/5 text-white hover:border-[#C3D809]/30"}`}
                                   >
                                     {fmt12(t)}
                                   </motion.button>
                                 );
                               })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-16 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 w-full text-center">
                               <div className="w-16 h-16 rounded-full bg-red-500/5 flex items-center justify-center text-red-500/50 mb-6"><AlertCircle size={32} /></div>
                               <h3 className="text-white text-lg font-black">{lang === 'ar' ? "يوم مزدحم جداً" : "Fully Booked Day"}</h3>
                               <p className="text-white/20 text-xs mt-1">{lang === 'ar' ? "اختر يوماً آخر للمواعيد المتاحة" : "Please check another date for availability"}</p>
                            </div>
                          )}
                       </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="s4-form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                       <div className="lg:col-span-3 space-y-8">
                          {error && <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-bold flex items-center gap-3"><AlertCircle size={16} /> {error}</motion.div>}
                          
                          <div className="space-y-6">
                            {[
                               { label: lang === 'ar' ? "الأسم الكامل" : "FULL NAME", field: "customer_name", type: "text", pl: lang === 'ar' ? "اكتب اسمك هنا..." : "Your name here...", icon: <UserCircle size={20} /> },
                               { label: lang === 'ar' ? "رقم الهاتف" : "PHONE NUMBER", field: "customer_phone", type: "tel", pl: "07XXXXXXXX", icon: <Check size={20} /> }
                            ].map(f => (
                              <div key={f.field} className="relative group">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3 block px-2">{f.label}</label>
                                <div className="relative">
                                  <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-6' : 'left-6'} flex items-center text-white/20 group-focus-within:text-[#C3D809] transition-colors`}>{f.icon}</div>
                                  <input 
                                    type={f.type} 
                                    value={(sel as any)[f.field]} 
                                    onChange={e => setSel(p => ({ ...p, [f.field]: e.target.value }))} 
                                    placeholder={f.pl}
                                    className={`w-full bg-white/[0.03] border border-white/5 rounded-[1.75rem] ${lang === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'} py-6 text-white focus:border-[#C3D809] focus:outline-none transition-all duration-500 font-black placeholder:text-white/10`} 
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="relative group">
                               <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3 block px-2">{lang === 'ar' ? "ملاحظات إضافية" : "SPECIAL REQUESTS"}</label>
                               <textarea 
                                  value={sel.notes} 
                                  onChange={e => setSel(p => ({ ...p, notes: e.target.value }))} 
                                  rows={3} 
                                  placeholder={lang === 'ar' ? "هل هناك شيء نود معرفته؟" : "Any details we should know?"}
                                  className="w-full bg-white/[0.03] border border-white/5 rounded-[1.75rem] px-8 py-6 text-white focus:border-[#C3D809] focus:outline-none transition-all duration-500 font-bold resize-none placeholder:text-white/10" 
                               />
                            </div>
                          </div>
                       </div>

                       {/* Luxury Summary Card (Receipt Style) */}
                       <div className="lg:col-span-2">
                          <div className="bg-[#111] border border-white/5 rounded-[3rem] p-8 relative overflow-hidden">
                             {/* Decorative Hole-punch effect for receipt look */}
                             <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#080808] rounded-full" />
                             <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#080808] rounded-full" />
                             
                             <div className="flex flex-col items-center mb-8 border-b border-white/5 pb-6">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#C3D809] mb-4 border border-white/5"><Scissors size={20} /></div>
                                <span className="text-[10px] font-black text-white/40 tracking-[0.6em] uppercase">Summary</span>
                             </div>

                             <div className="space-y-4 mb-10">
                                {selSrvs.map(s => (
                                  <div key={s.id} className="flex justify-between items-end">
                                     <div className="flex flex-col">
                                        <span className="text-white text-sm font-black leading-tight">{tData(s.name, lang)}</span>
                                        <span className="text-white/10 text-[9px] uppercase font-bold">{s.duration_minutes} min service</span>
                                     </div>
                                     <span className="text-white font-black">{s.price} JOD</span>
                                  </div>
                                ))}
                             </div>

                             <div className="pt-6 border-t border-white/5 border-dashed space-y-6">
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                   <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-[#C3D809]"><Calendar size={18} /></div>
                                   <div>
                                      <p className="text-white text-xs font-black">{sel.booking_date}</p>
                                      <p className="text-white/20 text-[9px] uppercase font-bold tracking-widest">{fmt12(sel.booking_time)} Appointment</p>
                                   </div>
                                </div>

                                {hasDiscount && (
                                   <div className="flex justify-between items-center text-[#C3D809] px-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Vip Discount Applied</span>
                                      <span className="text-lg font-black leading-none">-{discountPercent}%</span>
                                   </div>
                                )}

                                <div className="flex justify-between items-end bg-[#C3D809] text-black p-6 rounded-[2rem] shadow-xl shadow-[#C3D809]/5">
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">{lang === 'ar' ? 'الإجمالي القائم' : 'Final Price'}</span>
                                   <div className="text-right">
                                      {hasDiscount && <div className="text-black/40 text-[10px] line-through font-bold mb-0.5">{subtotal} JOD</div>}
                                      <span className="text-3xl font-black leading-none tracking-tighter">{totalPrice} <small className="text-xs uppercase">Jod</small></span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {step === 5 && (
                    <motion.div key="s5-success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-16 text-center">
                       <motion.div 
                          initial={{ rotate: -20, scale: 0.5 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ type: "spring", damping: 12 }}
                          className="w-32 h-32 rounded-[3.5rem] bg-[#C3D809] flex items-center justify-center text-black mb-10 shadow-[0_20px_80px_rgba(195,216,9,0.3)] relative"
                       >
                          <Check size={56} strokeWidth={5} />
                          {/* Floating particles for celebration */}
                          {[...Array(6)].map((_, i) => (
                             <motion.div 
                                key={i}
                                animate={{ y: [-20, 20], opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                className="absolute w-2 h-2 bg-[#C3D809] rounded-full"
                                style={{ top: Math.random() * 100 + "%", left: Math.random() * 100 + "%" }}
                             />
                          ))}
                       </motion.div>
                       
                       <h2 className="text-white text-5xl mb-4 leading-tight" style={{ fontFamily: lang === 'en' ? "'Playfair Display', serif" : "'Noto Sans Arabic', sans-serif", fontWeight: 900 }}>
                         {lang === 'ar' ? "مبروك، موعدك جاهز!" : "Experience Secured!"}
                       </h2>
                       <p className="text-white/40 max-w-sm mb-12 leading-relaxed text-lg" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                         {lang === 'ar' ? `تم تأكيد حجزك في ${tData(salon.name, lang)}. نراك قريباً في مقص.` : `Your booking at ${tData(salon.name, lang)} is confirmed. See you at Maqass!`}
                       </p>
                       
                       <button 
                          onClick={resetAndClose} 
                          className="group relative bg-white text-black px-12 py-6 rounded-[2.5rem] font-black text-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/5"
                       >
                          <span className="relative z-10 flex items-center gap-3">
                            {lang === 'ar' ? "العودة للرئيسية" : "Back to Home"}
                            <ArrowLeft size={20} className={lang === 'ar' ? "" : "rotate-180"} />
                          </span>
                       </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enhanced Action Bar (Sticky Footer) */}
              {step < 5 && (
                  <div className="absolute bottom-0 left-0 w-full px-6 sm:px-10 py-8 bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent flex items-center justify-between gap-4">
                     {step > 1 ? (
                       <button onClick={() => setStep(p => p - 1)} className="w-16 h-16 rounded-[2rem] border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all bg-white/[0.02] hover:bg-white/5 shrink-0">
                          <ArrowLeft size={28} className={lang === 'ar' ? "rotate-180" : ""} />
                       </button>
                     ) : <div className="w-16" />}
                     
                     <button 
                       onClick={handleNext}
                       disabled={!canProceed || submitting}
                       className={`flex-1 h-16 rounded-[2.25rem] font-black text-lg transition-all flex items-center justify-center gap-4 relative overflow-hidden ${canProceed && !submitting ? "bg-[#C3D809] text-black shadow-2xl shadow-[#C3D809]/20 active:scale-[0.98]" : "bg-white/5 text-white/10 cursor-not-allowed grayscale"}`}
                       style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}
                     >
                       <span className="relative z-10 flex items-center gap-2">
                         {submitting ? (lang === 'ar' ? "جاري الحجز..." : "Securing Slot...") : step === 4 ? (lang === 'ar' ? "تأكيد الحجز النهائي" : "Confirm Booking") : (lang === 'ar' ? "متابعة" : "Next Step")}
                         {!submitting && <ArrowLeft size={20} className={`mt-0.5 ${lang === 'ar' ? "" : "rotate-180"}`} />}
                       </span>
                       {/* Subtle Shine animation on button */}
                       {canProceed && !submitting && (
                         <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full opacity-30" />
                       )}
                     </button>
                  </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </>
  );
}
