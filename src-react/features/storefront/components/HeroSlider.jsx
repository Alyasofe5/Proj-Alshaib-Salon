import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HeroSlider.css";

const SLIDES = [
  {
    key: "coffee",
    ariaLabel: "شريحة القهوة المختصة",
    title: "اكتشف عبق القهوة\nالمختصة الأصيلة",
    description: "تحميص فاخر وحبوب مختارة بعناية لتجربة استثنائية في كل كوب.",
    btnText: "تسوق الان",
    btnLink: "/shop",
    image: null,
  },
  {
    key: "nuts",
    ariaLabel: "شريحة المكسرات المحمصة",
    title: "تشكيلة فاخرة من\nالمكسرات المحمصة",
    description: "مذاق راقي يبدأ من العرض وينتهي بتجربة استثنائية لا تُنسى.",
    btnText: "تسوق الان",
    btnLink: "/shop",
    image: null,
  },
  {
    key: "spices",
    ariaLabel: "شريحة البهارات الأصيلة",
    title: "خلطات مميزة من\nالبهارات الأصيلة",
    description: "بهاراتنا مختارة بعناية لتضيف نكهة لا تقاوم لأطباقك.",
    btnText: "تسوق الان",
    btnLink: "/shop",
    image: null,
  }
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const handleTopNav = (e, link) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate(link);
    setTimeout(() => window.scrollTo(0, 0), 10);
  };

  const goTo = useCallback((index) => {
    setActive(index);
  }, []);

  const next = useCallback(() => {
    setActive((current) => (current + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    intervalRef.current = window.setInterval(next, 7000);
    return () => window.clearInterval(intervalRef.current);
  }, [next]);

  const slide = SLIDES[active];

  return (
    <section className="hs-root">
      {/* Coffee Beans — eager for first 4 (slide-0), lazy for others */}
      {[1,2,3,4,1,2,3,4,1,2,3,4].map((n, i) => (
        <div key={`bean-${i+1}`} className={`hs-floating-beans-layer bean-${i+1} active-slide-${active}`}>
          <img src={`/assets/images/user-bean-${n}.webp`} alt="" aria-hidden="true"
            width="120" height="120" loading={i < 4 ? "eager" : "lazy"} decoding={i < 4 ? "sync" : "async"}
            fetchpriority={i < 2 ? "high" : undefined} />
        </div>
      ))}

      {/* Nuts — all lazy (slide-1, not visible initially) */}
      {[1,2,3,4,5,1,2,3,4,5,1,2].map((n, i) => (
        <div key={`nut-${i+1}`} className={`hs-floating-nuts-layer nut-${i+1} active-slide-${active}`}>
          <img src={`/assets/images/user-nut-${n}.webp`} alt="" aria-hidden="true"
            width="120" height="120" loading="lazy" decoding="async" />
        </div>
      ))}

      {/* Spices — all lazy (slide-2, not visible initially) */}
      {[5,1,2,6,3,4,4,1,2,6,3,4].map((n, i) => (
        <div key={`spice-${i+1}`} className={`hs-floating-spices-layer spice-${i+1} active-slide-${active}`}>
          <img src={`/assets/images/user-spice-${n}.webp`} alt="" aria-hidden="true"
            width="120" height="120" loading="lazy" decoding="async" />
        </div>
      ))}

      <div className="hs-slide-container">
        <div className="hs-banner-shell">
          <div className="hs-panel">
            {slide.image && <div className="hs-side-image" style={{ backgroundImage: `url(${slide.image})` }} />}
            <div className="hs-panel-overlay" />

            <div className="hs-content-wrapper">
              <div className="hs-content" key={slide.key}>
                <h1 className="hs-title">{slide.title}</h1>
                <p className="hs-description">{slide.description}</p>
                <Link to={slide.btnLink} onClick={(e) => handleTopNav(e, slide.btnLink)} className="hs-btn">
                  <span>{slide.btnText}</span>
                  <i className="fa-solid fa-arrow-left hs-btn-icon" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>

      <div className="hs-controls" aria-label="Hero slide controls">
        {SLIDES.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className={`hs-dot ${index === active ? "active" : ""}`}
            onClick={() => {
              goTo(index);
              window.clearInterval(intervalRef.current);
              intervalRef.current = window.setInterval(next, 7000);
            }}
            aria-label={item.ariaLabel}
          />
        ))}
      </div>
    </section>
  );
}
