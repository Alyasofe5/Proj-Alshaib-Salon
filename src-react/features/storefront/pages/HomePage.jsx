import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { consumeScrollTarget } from "../../../utils/scrollUtils";
import { normalizeImagePath } from "../../../utils/imageUtils";
import { formatCurrency } from "../../../utils/formatCurrency";
import { fetchCategories } from "../../../lib/api/categories";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../../../hooks/useProducts";
import { fetchHomeContent, DEFAULT_CONTENT } from "../../../utils/homeContent";
import "../storefront.css";

function StatusBox({ text }) {
  return <div className="react-status-box">{text}</div>;
}

function SpecialOffersSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <section className="categories-showcase-section" style={{ minHeight: 520 }} />
  );

  if (!categories.length) return null;

  const minSlides = 8;
  const promoSlides = categories.length > 1
    ? Array.from({ length: Math.ceil(minSlides / categories.length) })
      .flatMap(() => categories)
    : categories;

  return (
    <section className="categories-showcase-section">
      <div className="container">

        {/* Header */}
        <div className="categories-showcase-header">
          <div className="categories-showcase-header-main">
            <h2 className="categories-showcase-heading">استكشف تشكيلتنا الواسعة</h2>
            <p className="categories-showcase-subheading">
              مجموعة مختارة من القهوة المختصة، المكسرات الطازجة، والبهارات الأصيلة المختارة بعناية لتناسب ذوقك الرفيع.
            </p>
          </div>
        </div>

        <div className="wpr-promo-grid">
          <div className="wpr-promo-track">
            {promoSlides.map((cat, idx) => (
              <div key={`${cat.id}-${idx}`} className="wpr-promo-column">
                <div className="wpr-promo-box wpr-animation-wrap">
                  <div className="wpr-promo-box-image">
                    <div
                      className="wpr-promo-box-bg-image wpr-bg-anim-zoom-in wpr-anim-timing-ease-default"
                      style={{ backgroundImage: `url(${normalizeImagePath(cat.image_url, cat.key)})` }}
                    />
                    <div className={`wpr-promo-box-bg-overlay ${idx % 2 === 0 ? 'wpr-border-anim-oscar' : 'wpr-border-anim-jazz'}`} />
                  </div>

                  <div className="wpr-promo-box-content">
                    <div className="wpr-promo-box-icon" />
                    <h3 className="wpr-promo-box-title"><span>{cat.name}</span></h3>
                    {cat.description && (
                      <div className="wpr-promo-box-description">
                        <p>{cat.description}</p>
                      </div>
                    )}
                    <div className="wpr-promo-box-btn-wrap">
                      <Link to={`/shop?category=${cat.key}`} className="wpr-promo-box-btn">
                        <span className="wpr-promo-box-btn-text">{idx % 2 === 0 ? "اطلب الآن" : "تسوّق الآن"}</span>
                        <i className="fa-solid fa-arrow-left-long hs-btn-icon" style={{ marginRight: '10px' }} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
function OurStorySection({ story: s }) {
  return (
    <section className="section our-story-section reveal-on-scroll" aria-labelledby="our-story-title">
      <div className="container our-story-grid">
        <div className="our-story-visual" aria-hidden="true">
          <div className="our-story-collage">
            <div className="our-story-photo our-story-photo-primary">
              <img src={s.image1} alt="" className="our-story-image" width="340" height="340" loading="lazy" decoding="async" />
            </div>
            <div className="our-story-photo our-story-photo-secondary">
              <img src={s.image2} alt="" className="our-story-image our-story-image-muted" width="340" height="340" loading="lazy" decoding="async" />
            </div>
            <div className="our-story-beans">
              <img src="/assets/images/beans-floating.png" alt="" className="our-story-beans-image" width="120" height="124" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
        <div className="our-story-copy">
          <h2 className="our-story-title" id="our-story-title">حكايتنا</h2>
          <h3 className="our-story-heading">{s.heading}</h3>
          <div className="our-story-text">
            <p>{s.text1}</p>
            <p>{s.text2}</p>
          </div>
        </div>
      </div>
    </section>
  );
}


function VisionIcon({ kind }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "vision-editorial-icon-svg",
    "aria-hidden": "true",
  };

  if (kind === "compass") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M14.8 9.2l-1.9 4.1-4.1 1.9 1.9-4.1 4.1-1.9z" />
      </svg>
    );
  }

  if (kind === "seedling") {
    return (
      <svg {...commonProps}>
        <path d="M12 20v-7" />
        <path d="M12 13c0-3.8 2.1-6 5.7-6 .2 3.6-2.2 6-5.7 6z" />
        <path d="M12 15c0-3.1-1.8-5-4.9-5-.2 3 1.8 5 4.9 5z" />
      </svg>
    );
  }

  if (kind === "target") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 4.5v2.2M19.5 12h-2.2M12 19.5v-2.2M4.5 12h2.2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M8.5 12.5l2.4 2.3c1.1 1.1 2.9 1.1 4 0l1.6-1.6c1.1-1.1 1.1-2.9 0-4l-.6-.6" />
      <path d="M15.5 11.5l-2.4-2.3c-1.1-1.1-2.9-1.1-4 0l-1.6 1.6c-1.1 1.1-1.1 2.9 0 4l.6.6" />
      <path d="M9.5 14.5l5-5" />
    </svg>
  );
}

function VisionSection({ vision: items }) {
  return (
    <section className="section vision-section reveal-on-scroll" aria-labelledby="vision-title">
      <div className="container">
        <div className="vision-header">
          <h2 className="vision-title" id="vision-title">نصيغ معايير الجودة</h2>
          <p className="vision-subtitle">التزامنا بالتميز يبدأ من المصدر وينتهي في فنجانك.</p>
        </div>
        <div className="vision-editorial">
          <div className="vision-editorial-list">
            {items.map((item, index) => (
              <article key={item.key} className={`vision-editorial-item reveal-on-scroll reveal-delay-${(index % 3) + 1}`}>
                <div className="vision-editorial-meta">
                  <span className="vision-editorial-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="vision-editorial-icon" aria-hidden="true">
                    <VisionIcon kind={["compass","seedling","target","handshake"][index % 4]} />
                  </span>
                </div>
                <div className="vision-editorial-copy">
                  <h3 className="vision-editorial-title">{item.title}</h3>
                  <p className="vision-editorial-text">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const target = Number(value) || 0;
    const duration = 1400;
    const startTime = performance.now();

    let frameId = 0;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [hasStarted, value]);

  return (
    <div className="numbers-counter" ref={ref}>
      {prefix ? <span className="numbers-counter-prefix">{prefix}</span> : null}
      <span className="numbers-counter-value">{displayValue}</span>
      {suffix ? <span className="numbers-counter-suffix">{suffix}</span> : null}
    </div>
  );
}

function NumbersSection({ numbers: items }) {
  return (
    <section className="section numbers-section reveal-on-scroll" aria-labelledby="numbers-title">
      <div className="container">
        <div className="numbers-header">
          <h2 className="numbers-title" id="numbers-title">أرقامنا</h2>
          <p className="numbers-subtitle">أثر يتّسع، وثقة تنمو، وتجربة تُبنى على الجودة في كل تفصيلة.</p>
        </div>
        <div className="numbers-grid">
          {items.map((item, index) => (
            <article key={item.key} className={`numbers-item reveal-on-scroll reveal-delay-${index + 1}`}>
              <div className={`numbers-ring numbers-ring-${item.tone}`}>
                <div className="numbers-ring-inner">
                  <AnimatedNumber value={item.value} prefix={item.prefix} suffix={item.suffix} />
                </div>
              </div>
              <div className="numbers-copy">
                <h3 className="numbers-item-title">{item.title}</h3>
                <p className="numbers-item-subtitle">{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CuratedSelection({ curatedIds = [] }) {
  const { products, loading } = useProducts();
  const curated = curatedIds.length
    ? products.filter((p) => curatedIds.includes(p.id)).slice(0, 8)
    : products.slice(0, 4);

  if (loading || !curated.length) return null;

  return (
    <section className="section curated-section reveal-on-scroll">
      <div className="container">
        <div className="section-header reveal-on-scroll">
          <h2 className="section-title">مختاراتنا لك</h2>
          <p className="section-description">تشكيلة منتقاة بعناية من أجود منتجات الحسّون لتمنحك تجربة مذاق لا تُنسى.</p>
        </div>

        <div className="curated-grid reveal-on-scroll">
          {curated.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="curated-footer reveal-on-scroll">
          <Link to="/shop" className="btn btn-primary" style={{ padding: '18px 45px' }}>
            استكشف المتجر بالكامل <i className="fa-solid fa-store" style={{ marginRight: '10px' }} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQSection({ faq: faqData }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="section faq-section reveal-on-scroll" id="faq">
      <div className="container">
        <div className="section-header reveal-on-scroll">
          <h2 className="section-title">الأسئلة الشائعة</h2>
          <p className="section-description">كل ما تود معرفته عن منتجات وإجراءات منتجات الحسّون.</p>
        </div>

        <div className="faq-container reveal-on-scroll">
          {faqData.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => setActiveIndex(activeIndex === index ? -1 : index)}
              >
                <h4>{item.question}</h4>
                <span className="faq-icon">
                  <i className={`fa-solid ${activeIndex === index ? 'fa-minus' : 'fa-plus'}`} />
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WholesaleSection({ wholesale: w }) {
  return (
    <section className="wholesale-section" id="wholesale">
      <div className="wholesale-bg-glow" />
      <div className="container">
        <div className="wholesale-grid">
          <div className="wholesale-content reveal-on-scroll reveal-delay-1">
            <span className="wholesale-eyebrow">B2B & Wholesale</span>
            <h2 className="wholesale-heading">{w.heading}</h2>
            <p className="wholesale-text">{w.text}</p>
            <Link to="/b2b" className="btn btn-primary" style={{ padding: '18px 45px', fontSize: '16px' }}>
              سجل اهتمامك الآن <i className="fa-solid fa-arrow-left-long" style={{ marginRight: '12px' }} />
            </Link>
          </div>
          <div className="wholesale-benefits reveal-on-scroll reveal-delay-2">
            {w.benefits.map((b, i) => (
              <div key={i} className="wholesale-benefit-card">
                <div className="wholesale-benefit-icon-box"><i className={b.icon} /></div>
                <h4 className="wholesale-benefit-title">{b.title}</h4>
                <p className="wholesale-benefit-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const location = useLocation();
  const [homeData, setHomeData] = useState({ content: DEFAULT_CONTENT, curatedIds: [] });

  useEffect(() => {
    fetchHomeContent().then(setHomeData);
  }, []);

  useEffect(() => {
    const timer = consumeScrollTarget();
    if (timer) {
      const elTimer = window.setTimeout(() => {
        const element = document.getElementById(timer);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
      return () => window.clearTimeout(elTimer);
    }
  }, [location.pathname]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );

    function observeNew(mutations) {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList?.contains("reveal-on-scroll") && !node.classList.contains("is-visible")) {
            io.observe(node);
          }
          node.querySelectorAll?.(".reveal-on-scroll:not(.is-visible)").forEach((el) => io.observe(el));
        });
      });
    }

    // Observe existing elements
    document.querySelectorAll(".reveal-on-scroll:not(.is-visible)").forEach((el) => io.observe(el));

    // Only watch for newly ADDED nodes, not attribute changes
    const mo = new MutationObserver(observeNew);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  return (
    <>
      <HeroSlider />

      <SpecialOffersSection />

      <CuratedSelection curatedIds={homeData.curatedIds} />

      <OurStorySection story={homeData.content.story} />

      <NumbersSection numbers={homeData.content.numbers} />

      <VisionSection vision={homeData.content.vision} />

      <WholesaleSection wholesale={homeData.content.wholesale} />

      <FAQSection faq={homeData.content.faq} />
    </>
  );
}
