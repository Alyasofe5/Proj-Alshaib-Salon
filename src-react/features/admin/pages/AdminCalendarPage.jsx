import React, { useEffect, useState } from "react";
import { fetchBookings, insertBooking } from "../../../lib/api/bookings";

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState({ count: 0, pending: 0 });

  async function load() {
    const data = await fetchBookings();
    if (data) {
      setAllBookings(data);
      setStats({
        count: data.length,
        pending: data.filter((b) => b.status === "pending").length
      });
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthsAr = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = allBookings.filter((b) => b.booking_date === todayStr);

  async function handleAddBooking(preDate = "") {
    const d = preDate || todayStr;
    const { value: form } = await window.Swal.fire({
      title: `<div style="font-family:Cairo; font-weight:900; color:#0a1f14; font-size:24px; border-bottom:2px solid #dca922; padding-bottom:15px; margin-bottom:10px;">نظــــــــام حجز المــــــــواعيد</div>`,
      html: `
        <div class="luxury-form" style="text-align:right; font-family:Cairo; padding:10px 0;">
          <p style="color:#dca922; font-weight:800; font-size:14px; margin-bottom:25px;">تاريخ الموعد المختار: <span style="color:#0a1f14; border:1px solid #eee; padding:4px 12px; border-radius:30px; background:#fafafa;">${d}</span></p>

          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-user-tie" style="margin-left:8px; color:#dca922;"></i> اسم العميل أو الجهة المختصة</label>
            <input id="bm-client" class="swal2-input" placeholder="مثلاً: شركة التوريدات الدولية" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; font-size:15px; padding:0 15px; box-sizing:border-box;">
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-comment-dots" style="margin-left:8px; color:#dca922;"></i> تفاصيل اللقاء / الملاحظات</label>
            <input id="bm-title" class="swal2-input" placeholder="عنوان موجز لغرض الزيارة" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; font-size:15px; padding:0 15px; box-sizing:border-box;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-clock" style="margin-left:8px; color:#dca922;"></i> التوقيت</label>
              <input id="bm-time" type="time" class="swal2-input" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-tags" style="margin-left:8px; color:#dca922;"></i> التصنيف</label>
              <select id="bm-type" class="swal2-input" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; box-sizing:border-box; padding:0 10px;">
                <option value="tasting">جلسة تذوق خاص</option>
                <option value="b2b" selected>زيارة عمل B2B</option>
                <option value="meeting">اجتماع مجلس الإدارة</option>
                <option value="event">فعالية حصرية</option>
              </select>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "تأكيد الحجز البلاتيني",
      cancelButtonText: "تراجع",
      confirmButtonColor: "#0a1f14",
      cancelButtonColor: "#c0392b",
      background: "#fff",
      width: "550px",
      padding: "30px",
      preConfirm: () => {
        const title = document.getElementById("bm-title").value.trim();
        const customer = document.getElementById("bm-client").value.trim();
        if (!customer) { window.Swal.showValidationMessage("يرجى تزويدنا باسم العميل للمتابعة"); return false; }
        return {
          title: title || "موعد عمل رسمي",
          customer_name: customer,
          booking_time: document.getElementById("bm-time").value,
          booking_date: d,
          type: document.getElementById("bm-type").value,
          status: "confirmed"
        };
      }
    });

    if (form) {
      try {
        await insertBooking(form);
        window.Swal.fire({
          icon: "success",
          title: "تم التسجيل بنجاح",
          text: "تم إدراج الموعد في التقويم الاستراتيجي لمحمصة الحسون بنجاح.",
          confirmButtonColor: "#0a1f14",
          timer: 3000
        });
        load();
      } catch (e) {
        console.error("Booking Insert Error:", e);
        window.Swal.fire("عذراً", `فشلت عملية الحفظ. السبب: ${e.message || "خطأ داخلي في الخادم"}`, "error");
      }
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">نظام جدولة المواعيد والزيارات</h1>
        <button className="btn btn-primary" onClick={() => handleAddBooking()} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, cursor: "pointer" }}>
          <i className="fa-solid fa-plus" style={{ fontSize: 16 }} />
          حجز موعد جديد
        </button>
      </div>

      <div className="admin-calendar-layout">
        <div className="admin-card stats-panel">
          <h3 className="admin-card-title"><i className="fa-solid fa-clock" /> مواعيد اليوم</h3>
          <div className="today-list">
            {!todayBookings.length ? (
              <div className="empty-msg">لا توجد مواعيد لليوم.</div>
            ) : (
              todayBookings.map((b) => (
                <div key={b.id} className="today-item">
                  <div className="item-title">{b.customer_name || b.title}</div>
                  <div className="item-time"><i className="fa-solid fa-clock" /> {b.booking_time || "–"}</div>
                  <div className="item-meta">النوع: {b.type === "tasting" ? "جلسة تذوق" : b.type === "b2b" ? "زيارة عمل" : "اجتماع"}</div>
                </div>
              ))
            )}
          </div>
          <h3 className="admin-card-title" style={{ marginTop: 40 }}><i className="fa-solid fa-circle-info" /> ملخص الجدولة</h3>
          <div className="stats-summary">
            <div className="stat-row"><span>مواعيد محجوزة</span><b>{stats.count}</b></div>
            <div className="stat-row"><span>بانتظار التأكيد</span><b>{stats.pending}</b></div>
          </div>
        </div>

        <div className="admin-card calendar-panel">
          <div className="calendar-header">
            <h2 className="month-name">{monthsAr[month]} {year}</h2>
            <div className="calendar-nav">
              <button className="nav-btn" onClick={prevMonth}><i className="fa-solid fa-chevron-right" /></button>
              <button className="nav-btn" onClick={nextMonth}><i className="fa-solid fa-chevron-left" /></button>
            </div>
          </div>
          <div className="calendar-grid-wrapper">
             <div className="grid-header">
               {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => <div key={day}>{day}</div>)}
             </div>
             <div className="calendar-grid">
               {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} className="day-box off-month" />)}
               {[...Array(daysInMonth)].map((_, i) => {
                 const day = i + 1;
                 const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                 const daily = allBookings.filter((b) => b.booking_date === dateStr);
                 const isToday = todayStr === dateStr;
                 return (
                   <div key={day} className={`day-box ${isToday ? "today" : ""}`} onClick={() => handleAddBooking(dateStr)}>
                     <span className="day-num">{day}</span>
                     <div className="day-tags">
                        {daily.map(b => (
                          <span key={b.id} className={`booking-tag tag-${b.type || "meeting"}`}>{b.customer_name || b.title}</span>
                        ))}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
