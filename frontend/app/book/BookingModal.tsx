"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Calendar, Clock, UserCircle, X, Sparkles, AlertCircle, Check, CheckCircle2, ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { Service, Employee, SalonInfo, BookingSel, dayNames, monthNames, fmt12 } from "./types";

const spring = { type: "spring" as const, stiffness: 120, damping: 22 };

// Light theme palette (matching page sections)
const C = {
  bg:        "var(--color-background)",   // Charcoal black
  surface:   "#222022",   // Elevated cards
  border:    "rgba(255,255,255,0.08)",
  text:      "var(--color-text-primary)",   // White text
  muted:     "rgba(255,255,255,0.4)",
  subtle:    "rgba(255,255,255,0.08)",
  lime:      "#C3D809",   // Brand accent
  limeBg:    "rgba(195,216,9,0.08)",
  limeBrd:   "rgba(195,216,9,0.25)",
  headerBg:  "rgba(26,26,26,0.95)",
  footerBg:  "rgba(26,26,26,0.97)",
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
  bookedSlots: { booking_time: string; employee_id: number }[];
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(10,10,10,0.7)", backdropFilter: "blur(16px)" }}
            onClick={onClose}
          />

          {/* Dialog — bottom-sheet on mobile, centered on desktop */}
          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 24 }}
              transition={spring}
              className="pointer-events-auto w-full flex flex-col"
              style={{
                direction: "rtl",
                maxWidth: 680,
                maxHeight: "92vh",
                background: C.bg,
                borderRadius: "20px 20px 0 0",
                border: `1px solid ${C.border}`,
                boxShadow: "0 -8px 48px rgba(0,0,0,0.2), 0 32px 80px rgba(0,0,0,0.25)",
                overflow: "hidden",
                // On desktop: centered with all rounded corners
                ...(typeof window !== "undefined" && window.innerWidth >= 640 ? {
                  borderRadius: 20,
                  boxShadow: "0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.8) inset",
                } : {}),
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Gold top accent */}
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${C.lime} 40%, transparent)`, flexShrink: 0 }} />

              {/* ── HEADER ── */}
              <div className="flex items-start justify-between px-5 sm:px-8 pt-5 pb-4" style={{ flexShrink: 0, background: C.headerBg, backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
                {step < 5 ? (
                  <div>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.45rem", letterSpacing: "0.35em", color: C.lime, marginBottom: 4, textTransform: "uppercase" }}>
                      {salon.name}
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(1.3rem, 5vw, 1.75rem)", fontStyle: "italic", color: C.text, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                      احجز <span style={{ color: C.lime }}>موعدك</span>
                    </h2>
                    {selSrvs.length > 0 && (
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", color: C.muted, letterSpacing: "0.08em", marginTop: 4 }}>
                        {selSrvs.length} {selSrvs.length === 1 ? "خدمة" : "خدمات"} · {totalPrice} ر.س
                      </p>
                    )}
                  </div>
                ) : (
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(1.3rem, 5vw, 1.75rem)", fontStyle: "italic", color: C.text }}>
                    تم التأكيد<span style={{ color: C.lime }}>.</span>
                  </h2>
                )}
                <button onClick={onClose} aria-label="إغلاق"
                  className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-black/8"
                  style={{ border: `1px solid ${C.border}`, color: C.muted, marginTop: 2 }}>
                  <X size={15} />
                </button>
              </div>

              {/* ── STEP BAR ── */}
              {step < 5 && (
                <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                  {/* Animated progress line */}
                  <div style={{ height: 2, background: "rgba(0,0,0,0.04)", position: "relative" }}>
                    <motion.div
                      animate={{ width: `${((step - 1) / 3) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      style={{ position: "absolute", top: 0, right: 0, height: "100%", background: C.lime }}
                    />
                  </div>
                  {/* Labels */}
                  <div className="flex px-4 sm:px-8 py-2.5 gap-0">
                    {STEPS.map((label, i) => {
                      const num = i + 1;
                      const done = num < step;
                      const active = num === step;
                      return (
                        <div key={num} className="flex items-center flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center justify-center rounded-full shrink-0 transition-all duration-400"
                              style={{
                                width: 20, height: 20,
                                background: done ? C.lime : active ? C.limeBg : "rgba(0,0,0,0.04)",
                                border: done ? "none" : active ? `1.5px solid ${C.lime}` : `1.5px solid rgba(0,0,0,0.1)`,
                              }}>
                              {done
                                ? <Check size={10} strokeWidth={3} style={{ color: "#fff" }} />
                                : <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.45rem", fontWeight: 700, color: active ? C.lime : "rgba(0,0,0,0.25)" }}>{num}</span>
                              }
                            </div>
                            <span style={{
                              fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "clamp(0.65rem, 2vw, 0.72rem)",
                              fontWeight: active ? 700 : 400,
                              color: active ? C.text : done ? C.muted : "rgba(0,0,0,0.3)",
                            }}>{label}</span>
                          </div>
                          {num < 4 && <div className="flex-1 mx-1.5 sm:mx-2" style={{ height: 1, background: done ? C.limeBrd : "rgba(0,0,0,0.07)" }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── SCROLLABLE CONTENT ── */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-5 hide-scroll" style={{ minHeight: 0, background: C.bg }}>
                <AnimatePresence mode="wait">

                  {/* STEP 1 — Services */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring}>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.35em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>
                        اختر الخدمات
                      </p>
                      <div className="space-y-2">
                        {services.map(s => {
                          const active = sel.service_ids.includes(s.id);
                          return (
                            <motion.div key={s.id} whileTap={{ scale: 0.99 }} onClick={() => toggleSrv(s.id)}
                              className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200"
                              style={{
                                background: active ? C.limeBg : C.surface,
                                border: `1.5px solid ${active ? C.lime : C.border}`,
                                boxShadow: active ? `0 0 0 1px ${C.lime}1A` : "0 1px 4px rgba(0,0,0,0.04)",
                              }}>
                              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                                style={{ background: active ? C.limeBg : "rgba(0,0,0,0.03)" }}>
                                {s.image
                                  ? <img src={assetUrl(s.image)!} alt={s.name} className="w-full h-full object-cover" />
                                  : <Scissors size={16} style={{ color: active ? C.lime : "rgba(0,0,0,0.2)" }} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.text }}>{s.name}</h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.68rem", color: C.lime, fontWeight: 700 }}>{s.price} ر.س</span>
                                  {s.duration_minutes && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: C.muted }}>{s.duration_minutes} د</span>}
                                </div>
                              </div>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                                style={{ background: active ? C.lime : "transparent", border: `1.5px solid ${active ? C.lime : "rgba(0,0,0,0.15)"}` }}>
                                <Check size={10} strokeWidth={3} style={{ color: active ? "#fff" : "transparent" }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2 — Barber */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring}>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.35em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>
                        اختر الحلاق
                      </p>
                      <div className="space-y-2">
                        {/* Any available */}
                        <div onClick={() => { setSel(p => ({ ...p, employee_id: 0 })); setStep(3); }}
                          className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200"
                          style={{ background: sel.employee_id === 0 ? C.limeBg : C.surface, border: `1.5px solid ${sel.employee_id === 0 ? C.lime : C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: C.limeBg, border: `1px solid ${C.limeBrd}` }}>
                            <Sparkles size={16} style={{ color: C.lime }} />
                          </div>
                          <div className="flex-1">
                            <h4 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.text }}>أي حلاق متاح</h4>
                            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: C.muted, marginTop: 2 }}>سيتم تخصيص أفضل حلاق لك</p>
                          </div>
                          {sel.employee_id === 0 && <CheckCircle2 size={16} style={{ color: C.lime }} />}
                        </div>
                        {employees.map(emp => (
                          <div key={emp.id} onClick={() => { setSel(p => ({ ...p, employee_id: emp.id })); setStep(3); fetchBooked(emp.id, sel.booking_date || dates[0]); }}
                            className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200"
                            style={{ background: sel.employee_id === emp.id ? C.limeBg : C.surface, border: `1.5px solid ${sel.employee_id === emp.id ? C.lime : C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                            {emp.avatar
                              ? <img src={assetUrl(emp.avatar)!} alt={emp.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                              : <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: C.subtle, fontWeight: 700, color: C.muted, fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "1rem" }}>{emp.name.charAt(0)}</div>
                            }
                            <div className="flex-1">
                              <h4 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.text }}>{emp.name}</h4>
                              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: C.muted, marginTop: 2 }}>{emp.role || "حلاق نخبة"}</p>
                            </div>
                            {sel.employee_id === emp.id && <CheckCircle2 size={16} style={{ color: C.lime }} />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3 — Date & Time */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring} className="space-y-7">
                      <div>
                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.35em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>اختر التاريخ</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 hide-scroll">
                          {dates.map((d, i) => {
                            const dateObj = new Date(d);
                            const isSel = sel.booking_date === d;
                            return (
                              <button key={d} onClick={() => { setSel(p => ({ ...p, booking_date: d, booking_time: "" })); fetchBooked(sel.employee_id, d); }}
                                className="shrink-0 flex flex-col items-center gap-1 py-3.5 px-3 rounded-xl transition-all duration-200"
                                style={{
                                  minWidth: 64,
                                  background: isSel ? C.lime : C.surface,
                                  border: `1.5px solid ${isSel ? C.lime : C.border}`,
                                  boxShadow: isSel ? `0 4px 16px ${C.lime}30` : "0 1px 4px rgba(0,0,0,0.04)",
                                }}>
                                <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "0.6rem", fontWeight: 700, color: isSel ? "rgba(255,255,255,0.85)" : C.muted }}>
                                  {i === 0 ? "اليوم" : dayNames[dateObj.getDay()]}
                                </span>
                                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: isSel ? "#fff" : C.text, lineHeight: 1 }}>{dateObj.getDate()}</span>
                                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", color: isSel ? "rgba(255,255,255,0.75)" : C.lime, fontWeight: 700 }}>
                                  {monthNames[dateObj.getMonth()]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {sel.booking_date && (
                        <div>
                          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.35em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>الأوقات المتاحة</p>
                          <div className="grid grid-cols-4 gap-2">
                            {genTimes().map(t => {
                              const isBooked = bookedSlots.some(b => b.booking_time === t);
                              const isSel = sel.booking_time === t;
                              return (
                                <button key={t} disabled={isBooked} onClick={() => setSel(p => ({ ...p, booking_time: t }))}
                                  className="py-2.5 rounded-lg transition-all duration-200"
                                  style={{
                                    fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", fontWeight: 700,
                                    background: isSel ? C.lime : isBooked ? "rgba(0,0,0,0.02)" : C.surface,
                                    color: isSel ? "#fff" : isBooked ? "rgba(0,0,0,0.15)" : C.text,
                                    border: `1.5px solid ${isSel ? C.lime : isBooked ? "rgba(0,0,0,0.04)" : C.border}`,
                                    textDecoration: isBooked ? "line-through" : "none",
                                    cursor: isBooked ? "not-allowed" : "pointer",
                                    boxShadow: isSel ? `0 4px 12px ${C.lime}25` : "none",
                                  }}>
                                  {fmt12(t)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 4 — Details */}
                  {step === 4 && (
                    <motion.div key="s4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Form */}
                        <div className="space-y-4">
                          {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.18)", color: "#c62828" }}>
                              <AlertCircle size={13} /> {error}
                            </div>
                          )}
                          {[
                            { label: "الاسم الكريم", field: "customer_name", type: "text", placeholder: "اكتب اسمك" },
                            { label: "رقم الجوال", field: "customer_phone", type: "tel", placeholder: "05XXXXXXXX" },
                          ].map(({ label, field, type, placeholder }) => (
                            <div key={field}>
                              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.25em", color: C.muted, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                                {label}
                              </label>
                              <input
                                type={type}
                                dir={field === "customer_phone" ? "ltr" : "rtl"}
                                value={(sel as any)[field]}
                                onChange={e => setSel(p => ({ ...p, [field]: e.target.value }))}
                                placeholder={placeholder}
                                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                                style={{
                                  background: C.surface, border: `1.5px solid ${C.border}`,
                                  fontFamily: field === "customer_phone" ? "'Space Mono', monospace" : "'Noto Sans Arabic', sans-serif",
                                  fontSize: "0.9rem", color: C.text, textAlign: field === "customer_phone" ? "left" : "right",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                }}
                                onFocus={e => { e.target.style.borderColor = C.lime; e.target.style.boxShadow = `0 0 0 3px ${C.lime}15`; }}
                                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
                              />
                            </div>
                          ))}
                          <div>
                            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.25em", color: C.muted, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                              ملاحظات (اختياري)
                            </label>
                            <textarea
                              value={sel.notes}
                              onChange={e => setSel(p => ({ ...p, notes: e.target.value }))}
                              rows={3}
                              placeholder="أي طلبات خاصة..."
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 resize-none"
                              style={{
                                background: C.surface, border: `1.5px solid ${C.border}`,
                                fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "0.88rem", color: C.text,
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                              }}
                              onFocus={e => { e.target.style.borderColor = C.lime; e.target.style.boxShadow = `0 0 0 3px ${C.lime}15`; }}
                              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
                            />
                          </div>
                        </div>

                        {/* Booking Summary */}
                        <div className="p-5 rounded-xl flex flex-col gap-3"
                          style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                          <div style={{ height: 3, background: C.lime, borderRadius: 2, marginBottom: 8 }} />
                          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.35em", color: C.lime, textTransform: "uppercase", marginBottom: 4 }}>ملخص الحجز</p>
                          <div className="space-y-2.5 flex-1">
                            {selSrvs.map(s => (
                              <div key={s.id} className="flex justify-between items-center">
                                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: C.lime, fontWeight: 700 }}>{s.price} ر.س</span>
                                <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "0.85rem", color: C.text, fontWeight: 600 }}>{s.name}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-3 flex justify-between items-center" style={{ borderTop: `1px solid ${C.border}` }}>
                            <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "1.15rem", color: C.lime }}>{totalPrice} ر.س</span>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", color: C.muted }}>الإجمالي</span>
                          </div>
                          {sel.booking_date && sel.booking_time && (
                            <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: C.muted, direction: "ltr" }}>{sel.booking_date} · {fmt12(sel.booking_time)}</span>
                              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", color: "rgba(0,0,0,0.2)" }}>الموعد</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5 — Confirmed */}
                  {step === 5 && (
                    <motion.div key="s5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15, stiffness: 200 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-7"
                        style={{ background: C.limeBg, border: `2px solid ${C.limeBrd}` }}>
                        <Check size={34} strokeWidth={2.5} style={{ color: C.lime }} />
                      </motion.div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "2rem", fontStyle: "italic", color: C.text, marginBottom: 10 }}>
                        تم التأكيد<span style={{ color: C.lime }}>.</span>
                      </h2>
                      <p style={{ color: C.muted, maxWidth: 280, marginBottom: 28, lineHeight: 1.8, fontSize: "0.9rem" }}>
                        نتطلع لاستقبالكم في {salon.name}
                      </p>
                      <div className="w-full p-5 rounded-xl text-right mb-6 space-y-3 relative overflow-hidden"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                        <div className="absolute top-0 right-0 w-1 h-full" style={{ background: C.lime }} />
                        <div className="flex justify-between items-center">
                          <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 700, color: C.text, fontSize: "0.9rem" }}>{sel.booking_date} · {sel.booking_time && fmt12(sel.booking_time)}</span>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", color: C.muted }}>التاريخ والوقت</span>
                        </div>
                        <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                          <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "1.15rem", color: C.lime }}>{totalPrice} ر.س</span>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", color: C.muted }}>الإجمالي</span>
                        </div>
                      </div>
                      <button onClick={resetAndClose}
                        className="w-full py-3.5 rounded-xl font-bold transition-all hover:opacity-90"
                        style={{ background: C.text, color: "#F5F2EC", fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "1rem" }}>
                        العودة للرئيسية
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* ── FOOTER ── */}
              {step < 5 && (
                <div className="flex-shrink-0 px-8 py-4 flex items-center justify-between gap-4"
                  style={{ borderTop: `1px solid ${C.border}`, background: C.footerBg, backdropFilter: "blur(8px)" }}>
                  {step > 1 ? (
                    <button onClick={() => setStep(p => p - 1)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-black/6 shrink-0"
                      style={{ border: `1.5px solid ${C.border}`, color: C.muted }}>
                      <ArrowLeft size={16} />
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-5 flex-1 justify-end">
                    {totalPrice > 0 && (
                      <div className="text-right">
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", color: C.muted, letterSpacing: "0.15em", display: "block" }}>الإجمالي</span>
                        <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "1.15rem", color: C.lime }}>{totalPrice} ر.س</span>
                      </div>
                    )}
                    <button
                      onClick={() => { if (!canProceed) return; if (step === 4) submitBooking(); else setStep(p => p + 1); }}
                      disabled={!canProceed || submitting}
                      className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-bold transition-all duration-200"
                      style={{
                        background: canProceed && !submitting ? C.text : "rgba(0,0,0,0.06)",
                        color: canProceed && !submitting ? "#F5F2EC" : "rgba(0,0,0,0.25)",
                        fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "0.9rem",
                        cursor: !canProceed || submitting ? "not-allowed" : "pointer",
                        minWidth: 110, justifyContent: "center",
                        boxShadow: canProceed && !submitting ? "0 4px 16px rgba(0,0,0,0.15)" : "none",
                      }}>
                      {submitting
                        ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(245,242,236,0.3)", borderTopColor: "#F5F2EC" }} />
                        : step === 4 ? "تأكيد الحجز" : "التالي"
                      }
                      {!submitting && step < 4 && (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
