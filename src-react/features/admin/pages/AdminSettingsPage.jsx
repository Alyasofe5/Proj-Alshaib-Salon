import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { fetchVideoSettings, upsertHeroSetting } from "../../../lib/api/settings";
import { resolveMedia } from "../../../lib/mediaDb";

export default function AdminSettingsPage() {
  const [appSettings, setAppSettings] = useState({
    maintenance: localStorage.getItem("alhason_maintenance") === "true",
    payments: localStorage.getItem("alhason_payments") !== "false",
    shipping: localStorage.getItem("alhason_shipping_module") !== "false"
  });
  const [settings, setSettings] = useState({
    coffee: { url: "", title: "", tag: "", description: "" },
    nuts: { url: "", title: "", tag: "", description: "" },
    spices: { url: "", title: "", tag: "", description: "" },
    poster: { url: "" }
  });
  const [saving, setSaving] = useState(false);

  const normalizeSrc = (val, isPoster = false) => {
    let s = "";
    if (val && typeof val === "object" && val.url) s = String(val.url);
    else if (val && typeof val === "string") s = val;
    else s = String(val || "");

    if (!s || s === "[object Object]") return "";
    if (s.startsWith("data:") || s.includes("://") || s.startsWith("blob:")) return s;
    if (isPoster) return s.startsWith("assets/") ? s : `assets/images/${s}`;
    return "";
  };

  const [uploadingStatus, setUploadingStatus] = useState({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      const next = {
        coffee: { url: "", title: "", tag: "", description: "" },
        nuts: { url: "", title: "", tag: "", description: "" },
        spices: { url: "", title: "", tag: "", description: "" },
        poster: { url: "" }
      };
      const remote = await fetchVideoSettings();
      remote.forEach((item) => {
        if (next[item.key]) {
           next[item.key] = {
             url: item.url || "",
             title: item.title || "",
             tag: item.tag || "",
             description: item.description || ""
           };
        }
      });
      for (const key of Object.keys(next)) {
        const local = await resolveMedia(key);
        if (local) next[key].url = local;
      }
      if (mounted) setSettings(next);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleMediaUpload(key, file) {
    if (!file) return;
    setUploadingStatus((prev) => ({ ...prev, [key]: true }));

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${key}-${Date.now()}.${fileExt}`;
      const filePath = `site-media/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
      setSettings((current) => ({
        ...current,
        [key]: { ...current[key], url: publicUrl }
      }));
      window.Swal.fire({ icon: "success", title: "تم رفع الملف", toast: true, position: "top-end", showConfirmButton: false, timer: 2000 });
    } catch (err) {
      window.Swal.fire("خطأ في التحميل", "تأكد من إعدادات Supabase Storage", "error");
    } finally {
      setUploadingStatus((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function saveHeroContent(key) {
    try {
      setSaving(true);
      const payload = {
        key,
        url: settings[key].url,
        title: settings[key].title || "",
        tag: settings[key].tag || "",
        description: settings[key].description || ""
      };
      await upsertHeroSetting(payload);
      window.Swal.fire({ icon: "success", title: "تم التحديث الملكي", text: `تم مزامنة محتوى ${key} مع الواجهة الرئيسية.`, timer: 1500, showConfirmButton: false });
    } catch (error) {
      window.Swal.fire("فشل المزامنة", "تعذر تحديث قاعدة بيانات المحتوى الإستراتيجي.", "error");
    } finally {
      setSaving(false);
    }
  }

  function toggleAppSetting(key) {
    const newVal = !appSettings[key];
    setAppSettings({ ...appSettings, [key]: newVal });
    localStorage.setItem(`alhason_${key === "maintenance" ? "maintenance" : key === "payments" ? "payments" : "shipping_module"}`, String(newVal));
    window.Swal.fire({ icon: "info", title: "تم التغيير", text: "تم تحديث إعدادات النظام بنجاح.", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });
  }

  function factoryReset() {
    window.Swal.fire({
      title: "تنبيه خطير!",
      text: "هذا الإجراء سيقوم بحذف كافة البيانات المخزنة محلياً وإعادة كاش الميديا. هل تود المتابعة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "نعم، إعادة ضبط كاملة"
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.clear();
        indexedDB.deleteDatabase("alhason_media");
        window.location.reload();
      }
    });
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon luxe-settings"><i className="fa-solid fa-gears" /></div>
          <div>
            <h1 className="admin-title">إعدادات المنظومة الذكية</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>مركز التحكم التقني • إصدار بلاتيني 4.5</p>
          </div>
        </div>
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <h2 className="card-title-luxe"><i className="fa-solid fa-sliders" /> خيارات التشغيل المتقدمة</h2>
            <div className="luxe-settings-stack">
              {[
                { id: "maintenance", label: "وضع الصيانة الشامل", sub: "إغلاق المتجر أمام الزوار خلال فترات التحديث الكبرى.", icon: "fa-hammer" },
                { id: "payments", label: "تشغيل بوابات الدفع", sub: "تفعيل خيارات الدفع الإلكتروني المباشر بفيزا وماستركارد.", icon: "fa-credit-card" },
                { id: "shipping", label: "محرك حساب الشحن", sub: "تشغيل حساب تكاليف التوصيل بناءً على المنطقة الجغرافية.", icon: "fa-map-location-dot" }
              ].map(s => (
                <div className="luxe-settings-row" key={s.id}>
                  <div className="s-info">
                    <div className="s-icon-box"><i className={`fa-solid ${s.icon}`} /></div>
                    <div>
                      <div className="s-label">{s.label}</div>
                      <div className="s-sub">{s.sub}</div>
                    </div>
                  </div>
                  <div className={`luxe-switch ${appSettings[s.id] ? "active" : ""}`} onClick={() => toggleAppSetting(s.id)}>
                     <div className="switch-knob" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="admin-overview-aside">
           <div className="admin-brand-card-platinum">
              <div className="p-logo"><img src="assets/images/logo-gold.svg" /></div>
              <div className="p-brand">AL HASON EXCLUSIVE</div>
              <div className="p-version">PLATINUM v4.5.1</div>
              <div className="p-status"><span className="dot" /> نظام التشغيل نشط</div>
           </div>

           <div className="admin-card-luxe" style={{ marginTop: 25 }}>
              <h3 className="card-title-luxe"><i className="fa-solid fa-microchip" /> ذكاء المنظومة</h3>
              <div className="ai-tips">
                 <div className="tip-item">
                    <i className="fa-solid fa-bolt" />
                    <span>فيديوهات 1080p بمعدل بت معتدل تمنح أفضل تجربة تحميل سريعة.</span>
                 </div>
                 <div className="tip-item">
                    <i className="fa-solid fa-shield-check" />
                    <span>كافة البيانات مشفرة ببروتوكول SSL ومدعومة من قبل Supabase.</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}
