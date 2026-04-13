import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../../lib/api/products";
import { normalizeImagePath } from "../../utils/imageUtils";
import { formatCurrency } from "../../utils/formatCurrency";

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted) setProducts(data || []);
    });
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const results = query.trim().length < 2
    ? []
    : products.filter((product) =>
        String(product.name || "").toLowerCase().includes(query.toLowerCase()) ||
        String(product.category || "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);

  return (
    <div
      style={{
        display: open ? "flex" : "none",
        position: "fixed",
        inset: 0,
        background: "rgba(10,31,20,0.97)",
        zIndex: 9999,
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "10vh"
      }}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 30, left: 40, background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 28, cursor: "pointer" }}><i className="fa-solid fa-xmark" /></button>
      <h2 style={{ color: "var(--color-secondary)", fontFamily: "var(--font-accent)", fontSize: 28, marginBottom: 30 }}>ماذا تبحث عن؟</h2>
      <div style={{ position: "relative", width: "min(700px,90vw)" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن منتجاتك..."
          autoFocus
          style={{ width: "100%", padding: "20px 60px 20px 25px", fontSize: 18, fontFamily: "Cairo, sans-serif", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(220,169,34,0.4)", borderRadius: 50, outline: "none", direction: "rtl", boxSizing: "border-box" }}
        />
        <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "var(--color-secondary)", fontSize: 18 }} />
      </div>
      <div style={{ width: "min(700px,90vw)", marginTop: 25, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20 }}>
        {query.trim().length >= 2 && results.length === 0 ? <p style={{ color: "white", opacity: 0.5 }}>لا توجد نتائج</p> : null}
        {results.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(220,169,34,0.15)", borderRadius: 14, padding: 15, textDecoration: "none", textAlign: "center", display: "block" }}
          >
            <img src={normalizeImagePath(product.image_url)} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />
            <div style={{ color: "white", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{product.name}</div>
            <div style={{ color: "var(--color-secondary)", fontWeight: 800 }}>{formatCurrency(product.price)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
