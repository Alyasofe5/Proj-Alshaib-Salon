"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Calendar, Clock, UserCircle, X, Sparkles, AlertCircle, Check, CheckCircle2, ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { Service, Employee, SalonInfo, BookingSel, dayNames, monthNames, fmt12 } from "./types";

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
  fetchBooked: (empId: number, date: string) => void;
  genTimes: () => string[];
  totalPrice: number;
  totalDur: number;
  selSrvs: Service[];
  submitting: boolean;
  error: string;
  submitBooking: () => void;
  toggleSrv: (id: number) => void;
}

const STEPS = ["الخدمات", "الحلاق", "الموعد", "البيانات"];

export default function BookingModal({
  isOpen, onClose, salon, services, employees, step, setStep, sel, setSel,
  dates, bookedSlots, fetchBooked, genTimes, totalPrice, totalDur, selSrvs,
  submitting, error, submitBooking, toggleSrv,
}: BookingModalProps) {

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)" }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 30 }}
              transition={spring}
              className="pointer-events-auto w-full flex flex-col overflow-hidden"
              style={{
                direction: "rtl",
                maxWidth: 720,
                maxHeight: "88vh",
                background: "#0c0c0c",
                borderRadius: "2.5rem 2.5rem 0 0",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 50px 150px rgba(0,0,0,0.7)",
                ...(typeof window !== "undefined" && window.innerWidth >= 640 ? { borderRadius: "2.5rem" } : {}),
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-7 bg-white/[0.01]">
                <div>
                   <span className="text-[#C3D809] text-[9px] font-black tracking-[0.5em] uppercase opacity-60 block mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>Reservations</span>
                   <h2 className="text-white text-2xl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900 }}>احجز موعدك</h2>
                </div>
                <button onClick={onClose} className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all bg-white/5">
                   <X size={20} />
                </button>
              </div>

              {/* Steps (Tabs) */}
              <div className="px-8 pb-4 flex items-center justify-between gap-3 overflow-x-auto hide-scroll">
                {STEPS.map((label, i) => {
                  const active = (i + 1) === step;
                  const done = (i + 1) < step;
                  return (
                    <div key={label} className="flex-1 flex flex-col gap-2 min-w-[70px]">
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <motion.div animate={{ width: done ? "100%" : active ? "100%" : "0%" }} transition={{ duration: 0.6 }} className="h-full bg-[#C3D809]" />
                      </div>
                      <span className={`text-[10px] text-center font-bold transition-colors ${active ? "text-[#C3D809]" : "text-white/20"}`} style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto px-8 py-6 hide-scroll" style={{ minHeight: 0 }}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {services.map(s => {
                        const active = sel.service_ids.includes(s.id);
                        return (
                          <motion.div key={s.id} whileTap={{ scale: 0.98 }} onClick={() => toggleSrv(s.id)}
                            className="group flex flex-col p-5 rounded-[2rem] cursor-pointer transition-all duration-500"
                            style={{
                              background: active ? "rgba(195,216,9,0.12)" : "rgba(255,255,255,0.03)",
                              border: `1px solid ${active ? "rgba(195,216,9,0.3)" : "rgba(255,255,255,0.06)"}`,
                            }}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                                  {s.image ? <img src={assetUrl(s.image)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Scissors /></div>}
                                </div>
                                <h4 className="text-white text-base font-black leading-tight" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>{s.name}</h4>
                            </div>
                            <div className="flex items-end justify-between mt-auto pt-2">
                               <div className="flex flex-col">
                                  <span className="text-[#C3D809] text-xl font-black">{s.price} JOD</span>
                                  <span className="text-white/20 text-[10px] font-bold tracking-widest">{s.duration_minutes || 0} دقيقة</span>
                               </div>
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${active ? "bg-[#C3D809] text-black shadow-[0_0_20px_rgba(195,216,9,0.4)]" : "bg-white/5 text-white/5 border border-white/5"}`}>
                                  <Check size={14} strokeWidth={4} />
                               </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.div whileTap={{ scale: 0.98 }} onClick={() => { setSel(p => ({ ...p, employee_id: 0, booking_date: p.booking_date || dates[0] })); setStep(3); }}
                        className="flex items-center gap-5 p-5 rounded-[2.5rem] cursor-pointer transition-all duration-500"
                        style={{
                           background: sel.employee_id === 0 ? "rgba(195,216,9,0.14)" : "rgba(255,255,255,0.03)",
                           border: `1px solid ${sel.employee_id === 0 ? "rgba(195,216,9,0.35)" : "rgba(255,255,255,0.06)"}`
                        }}>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${sel.employee_id === 0 ? "bg-[#C3D809] text-black shadow-[0_0_30px_rgba(195,216,9,0.3)]" : "bg-white/5 text-[#C3D809]"}`}>
                           <Sparkles size={24} />
                        </div>
                        <h4 className="text-white text-lg font-black" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>أي حلاق متاح</h4>
                      </motion.div>
                      {employees.map(emp => {
                        const active = sel.employee_id === emp.id;
                        return (
                          <motion.div key={emp.id} whileTap={{ scale: 0.98 }} onClick={() => { setSel(p => ({ ...p, employee_id: emp.id, booking_date: p.booking_date || dates[0] })); setStep(3); }}
                            className="flex items-center gap-5 p-5 rounded-[2.5rem] cursor-pointer transition-all duration-500"
                            style={{
                              background: active ? "rgba(195,216,9,0.14)" : "rgba(255,255,255,0.03)",
                              border: `1px solid ${active ? "rgba(195,216,9,0.35)" : "rgba(255,255,255,0.06)"}`
                            }}>
                            <div className={`w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 transition-all p-0.5 ${active ? "border-[#C3D809] shadow-[0_0_25px_rgba(195,216,9,0.2)]" : "border-white/10"}`}>
                               {emp.avatar ? <img src={assetUrl(emp.avatar)!} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-white/10" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-white text-lg font-black truncate" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>{emp.name}</h4>
                               <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest">{emp.role || "Elite Barber"}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-10">
                       <div className="flex gap-4 overflow-x-auto pb-4 hide-scroll justify-start">
                          {dates.map((d, i) => {
                            const dateObj = new Date(d);
                            const isSel = sel.booking_date === d;
                            return (
                              <button key={d} onClick={() => setSel(p => ({ ...p, booking_date: d, booking_time: "" }))}
                                className="shrink-0 flex flex-col items-center gap-1 py-5 px-5 rounded-[2rem] transition-all min-w-[70px]"
                                style={{
                                  background: isSel ? "#C3D809" : "rgba(255,255,255,0.03)",
                                  border: `1px solid ${isSel ? "#C3D809" : "rgba(255,255,255,0.06)"}`,
                                  color: isSel ? "#000" : "#fff",
                                  boxShadow: isSel ? "0 10px 30px rgba(195,216,9,0.3)" : "none"
                                }}>
                                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{i === 0 ? "اليوم" : dayNames[dateObj.getDay()]}</span>
                                <span className="text-3xl font-black">{dateObj.getDate()}</span>
                                <span className="text-[9px] font-bold opacity-40 uppercase">{monthNames[dateObj.getMonth()]}</span>
                              </button>
                            );
                          })}
                       </div>

                       {sel.booking_date && (
                         <div className="space-y-4">
                            {genTimes().length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                 {genTimes().map(t => {
                                   // Robust matching logic
                                   const isBooked = bookedSlots.some(b => {
                                     const bTime = (typeof b === "string" ? b : b?.booking_time);
                                     if (!bTime) return false;
                                     const [bh, bm] = bTime.split(":").map(Number);
                                     const [th, tm] = t.split(":").map(Number);
                                     return bh === th && bm === tm;
                                   });
                                   const isSel = sel.booking_time === t;

                                   return (
                                     <button key={t} disabled={isBooked} onClick={() => setSel(p => ({ ...p, booking_time: t }))}
                                       className="relative py-4 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center"
                                       style={{
                                         background: isSel ? "#C3D809" : isBooked ? "rgba(220,38,38,0.06)" : "rgba(255,255,255,0.03)",
                                         color: isSel ? "#000" : isBooked ? "rgba(239,68,68,0.5)" : "#fff",
                                         border: `1px solid ${isSel ? "#C3D809" : isBooked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
                                         opacity: isBooked ? 1 : 1,
                                         cursor: isBooked ? "not-allowed" : "pointer",
                                         boxShadow: isSel ? "0 8px 25px rgba(195,216,9,0.25)" : "none"
                                       }}>
                                       {isBooked && (
                                         <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} className="absolute h-[1.5px] bg-red-500/40" />
                                       )}
                                       <span className={isBooked ? "opacity-40" : ""}>{fmt12(t)}</span>
                                     </button>
                                   );
                                 })}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center py-10 opacity-30">
                                 <Clock size={40} className="mb-3" />
                                 <p className="font-bold text-sm">عذراً، لا يوجد مواعيد متاحة لهذا اليوم</p>
                              </div>
                            )}
                         </div>
                       )}
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="s4" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                       <div className="lg:col-span-3 space-y-6">
                          {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-bold">{error}</div>}
                          {[
                             { label: "الأسم الكريم", field: "customer_name", type: "text", pl: "أدخل اسمك الكامل" },
                             { label: "رقم الجوال بالأرقام", field: "customer_phone", type: "tel", pl: "07XXXXXXXX" }
                          ].map(f => (
                            <div key={f.field}>
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 block">{f.label}</label>
                              <input type={f.type} value={(sel as any)[f.field]} onChange={e => setSel(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.pl}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-white focus:border-[#C3D809] focus:outline-none transition-all font-bold" />
                            </div>
                          ))}
                          <div>
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 block">ملاحظات للجلسة</label>
                             <textarea value={sel.notes} onChange={e => setSel(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="اكتب ملاحظاتك هنا..."
                               className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-white focus:border-[#C3D809] focus:outline-none transition-all font-bold resize-none" />
                          </div>
                       </div>
                       <div className="lg:col-span-2 bg-[#C3D809]/[0.03] border border-[#C3D809]/10 rounded-[2.5rem] p-7 flex flex-col">
                          <span className="text-[10px] font-black text-[#C3D809] tracking-[0.4em] uppercase mb-6 block">ملخص النهائي</span>
                          <div className="space-y-3 flex-1">
                             {selSrvs.map(s => (
                               <div key={s.id} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl">
                                  <span className="text-white text-sm font-bold">{s.name}</span>
                                  <span className="text-[#C3D809] font-black">{s.price} JOD</span>
                               </div>
                             ))}
                          </div>
                          <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-white/20 text-[10px] font-black uppercase">Schedule</span>
                                <span className="text-white text-sm font-black">{sel.booking_date} · {fmt12(sel.booking_time)}</span>
                             </div>
                             <div className="flex justify-between items-end">
                                <span className="text-white/20 text-xs font-black uppercase">TOTAL</span>
                                <span className="text-3xl text-[#C3D809] font-black leading-none tracking-tighter">{totalPrice} <small className="text-xs">JOD</small></span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {step === 5 && (
                    <motion.div key="s5" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-10 text-center">
                       <div className="w-24 h-24 rounded-[2rem] bg-[#C3D809] flex items-center justify-center text-black mb-8 shadow-[0_0_60px_rgba(195,216,9,0.4)]">
                          <Check size={40} strokeWidth={5} />
                       </div>
                       <h2 className="text-4xl text-white mb-4" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900 }}>نعيماً مقدماً!</h2>
                       <p className="text-white/40 max-w-sm mb-10 leading-relaxed">تم تسجيل موعدك بنجاح في {salon.name}. يرجى الحضور قبل الموعد بـ 5 دقائق.</p>
                       <button onClick={resetAndClose} className="bg-white text-black px-14 py-5 rounded-[2rem] font-black hover:scale-105 active:scale-95 transition-all text-lg shadow-xl shadow-white/5">العودة للرئيسية</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Bar */}
              {step < 5 && (
                <div className="px-8 py-7 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                   {step > 1 ? (
                     <button onClick={() => setStep(p => p - 1)} className="w-14 h-14 rounded-[1.5rem] border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all hover:bg-white/5">
                        <ArrowLeft size={22} />
                     </button>
                   ) : <div />}
                   <button onClick={() => { if(!canProceed) return; if(step === 4) submitBooking(); else setStep(p => p + 1); }}
                     disabled={!canProceed || submitting}
                     className={`px-12 py-5 rounded-[2rem] font-black text-base transition-all flex items-center gap-3 ${canProceed && !submitting ? "bg-[#C3D809] text-black shadow-[0_15px_45px_rgba(195,216,9,0.3)] active:scale-95" : "bg-white/5 text-white/10 cursor-not-allowed"}`}>
                     {submitting ? "جاري الحجز..." : step === 4 ? "تأكيد الموعد النهائي" : "الخطوة التالية"}
                     {!submitting && <ArrowLeft size={18} className="translate-y-[1px] rotate-180" />}
                   </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
