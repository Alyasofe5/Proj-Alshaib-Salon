"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Calendar, Clock, UserCircle, X, Sparkles, AlertCircle, Check, ArrowLeft, ArrowRight, ChevronRight, Plus, Minus, Star } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { Service, Employee, SalonInfo, BookingSel, dayNames, dayNamesEn, monthNames, monthNamesEn, fmt12 } from "./types";

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
  discountDays: number[];
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
  submitting, error, submitBooking, toggleSrv, lang, tData, subtotal, hasDiscount, discountPercent, discountDays
}: BookingModalProps) {

  const isRTL = lang === 'ar';
  const STEPS_AR = ["الخدمات", "المصمم", "الموعد", "التأكيد"];
  const STEPS_EN = ["Services", "Professional", "Time", "Confirm"];
  const STEPS = isRTL ? STEPS_AR : STEPS_EN;

  useEffect(() => {
    if (isOpen && sel.booking_date) fetchBooked(sel.employee_id, sel.booking_date);
  }, [isOpen, sel.booking_date, sel.employee_id, fetchBooked]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

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

  const selectedEmp = employees.find(e => e.id === sel.employee_id);

  /* ── Sidebar Summary (reused in desktop right col & mobile bottom) ── */
  const SummaryPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col ${mobile ? "" : "sticky top-0 h-fit"}`}>
      {/* Salon Profile Header (Only visible on desktop sidebar) */}
      {!mobile && (
        <div className="flex gap-4 mb-8 pb-8 border-b border-white/5">
          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 border border-white/10 bg-white/5">
            {salon.logo_path || salon.logo ? (
              <img src={assetUrl(salon.logo_path || salon.logo)!} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#C3D809] font-bold text-2xl">
                {tData(salon.name, lang).charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-white text-[15px] font-bold mb-1.5 leading-tight">
              {tData(salon.name, lang)}
            </h3>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-white text-[13px] font-semibold">5.0</span>
              <div className="flex gap-0.5 text-[#C3D809]">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
              </div>
            </div>
            <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2">
              {tData(salon.address, lang) || (isRTL ? "عمان، الأردن" : "Amman, Jordan")}
            </p>
          </div>
        </div>
      )}

      {/* Selected Professional */}
      {(step >= 2 && (sel.employee_id !== 0 || step > 2)) && selectedEmp && (
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
            {assetUrl(selectedEmp.avatar || (selectedEmp as any).photo_path) ? (
              <img src={assetUrl(selectedEmp.avatar || (selectedEmp as any).photo_path)!} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20"><UserCircle size={24} /></div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-bold">{tData(selectedEmp.name, lang)}</p>
            <p className="text-white/30 text-[11px]">{tData(selectedEmp.role || (isRTL ? "حلاق" : "Barber"), lang)}</p>
          </div>
        </div>
      )}

      {/* Selected Services List */}
      {selSrvs.length > 0 && (
        <div className="space-y-4 mb-8">
          {selSrvs.map(s => (
            <div key={s.id} className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{tData(s.name, lang)}</p>
                <p className="text-white/25 text-[11px]">{s.duration_minutes} {isRTL ? "دقيقة" : "mins"}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-white font-bold text-sm">JOD {s.price}</span>
                {hasDiscount && <span className="block text-[#C3D809] text-[10px] font-bold">{isRTL ? `خصم ${discountPercent}%` : `Save ${discountPercent}%`}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Info */}
      {sel.booking_date && sel.booking_time && (
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5 text-white/40 text-xs">
          <Calendar size={14} className="text-[#C3D809]/60" />
          <span>{sel.booking_date}</span>
          <span className="text-white/10">·</span>
          <Clock size={14} className="text-[#C3D809]/60" />
          <span>{fmt12(sel.booking_time, lang)}</span>
        </div>
      )}

      {/* Total */}
      {selSrvs.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <span className="text-white/50 font-bold text-sm">{isRTL ? "الإجمالي" : "Total"}</span>
          <span className="text-white text-xl font-black tracking-tight">JOD {totalPrice}</span>
        </div>
      )}

      {/* Continue Button (desktop) */}
      {!mobile && (
        <button
          onClick={handleNext}
          disabled={!canProceed || submitting}
          className={`mt-8 w-full py-5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${
            canProceed && !submitting
              ? "bg-[#C3D809] text-black hover:bg-[#aabf05] hover:shadow-[0_0_20px_rgba(195,216,9,0.4)] active:scale-[0.98]"
              : "bg-white/5 text-white/15 cursor-not-allowed"
          }`}
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> {isRTL ? "جاري المعالجة..." : "Processing..."}</>
          ) : (
            <>{step === 4 ? (isRTL ? "تأكيد الحجز" : "Confirm Appointment") : (isRTL ? "متابعة" : "Continue")} <ChevronRight size={18} className={isRTL ? "rotate-180" : ""} /></>
          )}
        </button>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-[#0A0A0A] flex flex-col overflow-hidden"
          style={{ 
            direction: isRTL ? 'rtl' : 'ltr',
            fontFamily: isRTL ? "'Noto Sans Arabic', sans-serif" : "'Cormorant Garamond', serif"
          }}
        >
          {/* ═══ TOP BAR ═══ */}
          <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 py-3 sm:py-4 border-b border-white/5">
            {/* Back */}
            {step > 1 ? (
              <button onClick={() => setStep(p => p - 1)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                <ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} />
              </button>
            ) : <div className="w-10" />}

            {/* Breadcrumb Steps */}
            <nav className="hidden sm:flex items-center gap-2 text-[13px]">
              {STEPS.map((label, i) => {
                const s = i + 1;
                const active = s === step;
                const done = s < step;
                return (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight size={14} className={`text-white/10 ${isRTL ? "rotate-180" : ""}`} />}
                    <span className={`transition-colors cursor-default ${active ? "text-white font-bold" : done ? "text-white/50 font-medium" : "text-white/20"}`}>
                      {label}
                    </span>
                  </span>
                );
              })}
            </nav>

            {/* Mobile step indicator */}
            <div className="sm:hidden text-white/40 text-sm font-bold">{step} / 4</div>

            {/* Close */}
            <button onClick={onClose} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scroll">
            <div className="flex max-w-[1200px] mx-auto min-h-full">
            {/* LEFT: Main Content */}
            <div className="flex-1 px-5 sm:px-8 lg:px-10 py-6 sm:py-8 pb-40 sm:pb-10">
              {/* Page Title */}
              <div className="mb-6">
                <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight">
                  {STEPS[step - 1]}
                </h1>
              </div>

              <AnimatePresence mode="wait">
                {/* ─── STEP 1: Services ─── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-0 divide-y divide-white/5">
                    {services.map((s, idx) => {
                      const active = sel.service_ids.includes(s.id);
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => toggleSrv(s.id)}
                          className={`group flex items-center justify-between py-4 sm:py-5 cursor-pointer transition-all duration-200 ${
                            active ? "bg-[#C3D809]/[0.04] -mx-4 px-4 rounded-xl" : "hover:bg-white/[0.02] -mx-4 px-4 rounded-xl"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-[15px] sm:text-[16px] font-semibold mb-1 transition-colors ${active ? "text-white" : "text-white"}`}>
                              {tData(s.name, lang)}
                            </h4>
                            <p className="text-white/30 text-[13px] mb-1">
                              {s.duration_minutes} {isRTL ? "دقيقة" : "mins"}
                            </p>
                            <span className="text-white/60 text-[13px] font-semibold">{s.price}&nbsp;{isRTL ? "د.أ." : "JOD"}</span>
                          </div>
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                            active ? "bg-[#C3D809] border-[#C3D809] text-black" : "border-white/10 text-transparent group-hover:border-white/25"
                          }`}>
                            {active ? <Check size={18} strokeWidth={3} /> : <Plus size={18} className="text-white/20" />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* ─── STEP 2: Professional ─── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-0 divide-y divide-white/5">
                    <div
                      onClick={() => { setSel(p => ({ ...p, employee_id: 0 })); setStep(3); }}
                      className={`group flex items-center gap-5 py-4 sm:py-5 cursor-pointer transition-all duration-200 ${
                        sel.employee_id === 0 ? "bg-[#C3D809]/[0.04] -mx-4 px-4 rounded-xl" : "hover:bg-white/[0.02] -mx-4 px-4 rounded-xl"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${sel.employee_id === 0 ? "bg-[#C3D809] text-black" : "bg-white/5 text-white/20"}`}>
                        <Sparkles size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-[15px] sm:text-[16px] font-semibold mb-0.5">{isRTL ? "أي متخصص متاح" : "Any Professional"}</h4>
                        <p className="text-white/30 text-[13px]">{isRTL ? "أسرع موعد" : "Fastest availability"}</p>
                      </div>
                      <ChevronRight size={18} className={`text-white/15 shrink-0 ${isRTL ? "rotate-180" : ""}`} />
                    </div>
                    {employees.map(emp => {
                      const active = sel.employee_id === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => { setSel(p => ({ ...p, employee_id: emp.id })); setStep(3); }}
                          className={`group flex items-center gap-5 py-4 sm:py-5 cursor-pointer transition-all duration-200 ${
                            active ? "bg-[#C3D809]/[0.04] -mx-4 px-4 rounded-xl" : "hover:bg-white/[0.02] -mx-4 px-4 rounded-xl"
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 ${active ? "border-[#C3D809]" : "border-white/10"}`}>
                            {assetUrl(emp.avatar || (emp as any).photo_path) ? (
                              <img src={assetUrl(emp.avatar || (emp as any).photo_path)!} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/15"><UserCircle size={28} /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-[15px] sm:text-[16px] font-semibold mb-0.5 ${active ? "text-white" : "text-white"}`}>{tData(emp.name, lang)}</h4>
                            <p className="text-white/30 text-[13px]">{tData(emp.role || "Barber", lang)}</p>
                          </div>
                          <ChevronRight size={18} className={`text-white/15 shrink-0 ${isRTL ? "rotate-180" : ""}`} />
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* ─── STEP 3: Time ─── */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                    <div className="flex gap-3 overflow-x-auto pb-4 hide-scroll snap-x">
                      {dates.map((d, i) => {
                        const dt = new Date(d + "T00:00:00");
                        const isSel = sel.booking_date === d;
                        const isDiscDay = discountDays.includes(dt.getDay());
                        return (
                          <button key={d} onClick={() => setSel(p => ({ ...p, booking_date: d, booking_time: "" }))}
                            className={`relative shrink-0 flex flex-col items-center gap-1 py-6 px-5 rounded-2xl snap-center min-w-[85px] border transition-all ${
                              isSel ? "bg-[#C3D809] border-[#C3D809] text-black" : "bg-white/[0.02] border-white/5 text-white hover:border-white/20"
                            }`}>
                            {/* Discount badge */}
                            {isDiscDay && !isSel && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black bg-[#C3D809] text-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {isRTL ? 'خصم' : 'SALE'}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSel ? "text-black/50" : "text-white/25"}`}>
                              {i === 0 ? (isRTL ? "اليوم" : "Today") : (lang === 'en' ? dayNamesEn[dt.getDay()].slice(0, 3) : dayNames[dt.getDay()])}
                            </span>
                            <span className="text-3xl font-bold leading-none">{dt.getDate()}</span>
                            <span className={`text-[10px] font-bold ${isSel ? "text-black/40" : "text-white/15"}`}>
                              {lang === 'en' ? monthNamesEn[dt.getMonth()].slice(0, 3) : monthNames[dt.getMonth()]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {sel.employee_id !== 0 && offEmployeesIds.includes(sel.employee_id) ? (
                      <div className="p-10 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
                        <AlertCircle size={36} className="text-red-400/50 mx-auto mb-4" />
                        <h3 className="text-white font-bold mb-1">{isRTL ? "غير متاح" : "Unavailable"}</h3>
                        <p className="text-white/30 text-sm">{isRTL ? "يرجى اختيار يوم آخر" : "Please select another date"}</p>
                      </div>
                    ) : genTimes().length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {genTimes().map(t => {
                          const isBooked = bookedSlots.some(b => (typeof b === "string" ? b : b?.booking_time) === t);
                          if (isBooked) return null;
                          const isSel = sel.booking_time === t;
                          return (
                            <button key={t} onClick={() => setSel(p => ({ ...p, booking_time: t }))}
                              className={`py-5 rounded-xl text-[14px] font-bold border transition-all ${
                                isSel ? "bg-[#C3D809] text-black border-transparent" : "bg-white/[0.02] border-white/5 text-white/50 hover:border-white/20 hover:text-white"
                              }`}>
                              {fmt12(t)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-10 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
                        <p className="text-white/30 text-sm font-bold">{isRTL ? "لا مواعيد متاحة" : "No available slots"}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ─── STEP 4: Confirm ─── */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-xl space-y-8">
                    {error && (
                      <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-[13px] font-bold flex items-center gap-3">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}
                    {[
                      { label: isRTL ? "الاسم الكريم" : "Full Name", field: "customer_name", type: "text", pl: isRTL ? "الاسم بالكامل..." : "Your full name..." },
                      { label: isRTL ? "رقم الجوال" : "Phone Number", field: "customer_phone", type: "tel", pl: "07XXXXXXXX", maxLength: 10 }
                    ].map(f => (
                      <div key={f.field}>
                        <label className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-3 block">{f.label}</label>
                        <input
                          type={f.type}
                          value={(sel as any)[f.field]}
                          onChange={e => {
                            let val = e.target.value;
                            if (f.type === "tel") val = val.replace(/\D/g, '').slice(0, 10);
                            setSel(p => ({ ...p, [f.field]: val }));
                          }}
                          placeholder={f.pl}
                          maxLength={f.maxLength}
                          className="w-full bg-white/[0.03] border border-[#C3D809]/30 rounded-2xl px-6 py-5 text-white focus:border-[#C3D809] focus:ring-1 focus:ring-[#C3D809] focus:ring-offset-0 focus:shadow-[0_0_15px_rgba(195,216,9,0.2)] !outline-none transition-all duration-300 font-bold placeholder:text-white/20"
                          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-3 block">{isRTL ? "ملاحظات" : "Notes"}</label>
                      <textarea value={sel.notes} onChange={e => setSel(p => ({ ...p, notes: e.target.value }))} rows={3}
                        placeholder={isRTL ? "ملاحظات إضافية..." : "Special requests..."}
                        className="w-full bg-white/[0.03] border border-[#C3D809]/30 rounded-2xl px-6 py-5 text-white focus:border-[#C3D809] focus:ring-1 focus:ring-[#C3D809] focus:ring-offset-0 focus:shadow-[0_0_15px_rgba(195,216,9,0.2)] !outline-none transition-all duration-300 font-bold resize-none placeholder:text-white/20"
                      />
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 5: Success ─── */}
                {step === 5 && (
                  <motion.div key="s5" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-20 text-center max-w-md mx-auto">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
                      className="w-28 h-28 rounded-full bg-[#C3D809] flex items-center justify-center text-black mb-10 shadow-[0_0_40px_rgba(195,216,9,0.3)]">
                      <Check size={48} strokeWidth={4} />
                    </motion.div>
                    <h2 className="text-white text-3xl sm:text-4xl font-bold mb-4">
                      {isRTL ? "تم تأكيد موعدك" : "Booking Confirmed"}
                    </h2>
                    <p className="text-white/40 mb-10 leading-relaxed">{isRTL ? `نراك في ${tData(salon.name, lang)} قريباً!` : `See you at ${tData(salon.name, lang)}!`}</p>
                    <button onClick={resetAndClose} className="px-10 py-4 rounded-2xl bg-white text-black font-bold hover:bg-[#C3D809] transition-colors active:scale-95">
                      {isRTL ? "العودة" : "Done"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Summary Sidebar (Fresha-style) */}
            {step < 5 && (
              <div className="hidden lg:block w-[444px] shrink-0 sticky top-10 self-start border-s border-white/5 bg-white/[0.015] p-8 pt-12 pb-12">
                <SummaryPanel />
              </div>
            )}
            </div>
          </div>

          {/* ═══ MOBILE BOTTOM BAR ═══ */}
          {step < 5 && (
            <div className="lg:hidden shrink-0 px-6 py-5 border-t border-white/5 bg-[#0A0A0A] flex items-center gap-4">
              {selSrvs.length > 0 && (
                <div className="flex-1 min-w-0">
                  <span className="text-white font-black text-lg">JOD {totalPrice}</span>
                  <span className="text-white/20 text-[11px] block">{selSrvs.length} {isRTL ? "خدمة" : "service(s)"}</span>
                </div>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed || submitting}
                className={`flex-1 py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${
                  canProceed && !submitting ? "bg-[#C3D809] text-black hover:bg-[#aabf05] hover:shadow-[0_0_20px_rgba(195,216,9,0.4)] active:scale-[0.97]" : "bg-white/5 text-white/15 cursor-not-allowed"
                }`}
              >
                {submitting ? (isRTL ? "جاري..." : "...") : step === 4 ? (isRTL ? "تأكيد" : "Confirm") : (isRTL ? "متابعة" : "Continue")}
                {!submitting && <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
