import { useEffect } from "react";
import { Link } from "react-router-dom";

const sectionPanelStyle: React.CSSProperties = {
  minHeight: "100vh",
  border: "1px solid #d6d2c9",
  borderRadius: "0",
  padding: "68px clamp(20px, 5vw, 72px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: "100%",
  scrollMarginTop: "86px",
};

const Home = () => {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(".reveal-section"));
    if (sections.length === 0) {
      return;
    }
    const dots = Array.from(document.querySelectorAll<HTMLElement>(".scroll-dot"));
    let animationFrame = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (entry.target.classList.contains("hero-section")) {
              const title = entry.target.querySelector<HTMLElement>(".hero-title-animate");
              if (title) {
                title.classList.remove("hero-play");
                void title.offsetWidth;
                title.classList.add("hero-play");
              }
            }
          } else {
            entry.target.classList.remove("is-visible");
            if (entry.target.classList.contains("hero-section")) {
              const title = entry.target.querySelector<HTMLElement>(".hero-title-animate");
              title?.classList.remove("hero-play");
            }
          }
        });
      },
      { threshold: 0.28 }
    );

    const updateDots = () => {
      dots.forEach((dot) => {
        const parent = dot.closest("section");
        if (!parent) {
          return;
        }
        const speed = Number(dot.dataset.speed || "0.1");
        const xFactor = Number(dot.dataset.x || "0");
        const phase = Number(dot.dataset.phase || "0");
        const rect = parent.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const time = window.performance.now() / 1000;
        const bob = Math.sin(time * 2.1 + phase) * 22 * speed;
        const driftY = (progress - 0.5) * 760 * speed + bob;
        const driftX = (progress - 0.5) * 320 * speed * xFactor;
        dot.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) scale(${(1 + speed * 0.15).toFixed(3)})`;
      });
      animationFrame = 0;
    };

    const handleScroll = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateDots);
      }
    };

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 14% 10%, #e8e0fa 0%, rgba(232,224,250,0) 36%), radial-gradient(circle at 90% 88%, #f5f0fe 0%, rgba(245,240,254,0) 40%), #f4f1fb",
        padding: 0,
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        color: "#1a1040",
        scrollBehavior: "smooth",
        overflowX: "hidden",
      }}
    >
      <style>{`
        .home-fade {
          opacity: 0;
          transform: translateY(22px);
          animation: fadeUp 0.85s ease forwards;
        }

        .reveal-section {
          opacity: 0;
          transform: translateY(46px) scale(0.99);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .reveal-section.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .reveal-slide {
          transform: translateX(65px);
        }

        .reveal-slide.is-visible {
          transform: translateX(0);
        }

        .reveal-zoom {
          transform: scale(0.94);
        }

        .reveal-zoom.is-visible {
          transform: scale(1);
        }

        .delay-1 { animation-delay: 0.12s; }
        .delay-2 { animation-delay: 0.24s; }
        .delay-3 { animation-delay: 0.36s; }

        .float-shape {
          animation: float 8s ease-in-out infinite;
        }

        .float-shape-slow {
          animation: float 12s ease-in-out infinite reverse;
        }

        .nav-link {
          position: relative;
          text-decoration: none;
          color: #4a3f6b;
          font-weight: 700;
          letter-spacing: 0.2px;
          transition: color 0.25s ease;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -6px;
          width: 100%;
          height: 2px;
          background: #8b6fd4;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.28s ease;
        }

        .nav-link:hover {
          color: #5c3fa3;
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .brand-link {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          font-size: 22px;
          font-weight: 800;
          color: #5c3fa3;
          letter-spacing: 1px;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: border-bottom-color 0.2s ease;
        }

        .home-brand-logo {
          width: clamp(76px, 10vw, 114px);
          height: clamp(76px, 10vw, 114px);
          object-fit: contain;
          background: transparent;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
        }

        .hero-image-shell {
          position: relative;
          z-index: 1;
        }

        .brand-link:hover {
          border-bottom-color: #5c3fa3;
        }

        .hero-cta {
          text-decoration: none;
          border-radius: 999px;
          padding: 11px 20px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 22px rgba(92, 63, 163, 0.22);
        }

        .hero-title-animate {
          background: linear-gradient(110deg, #8b6fd4 10%, #f0b429 48%, #8b6fd4 86%);
          background-size: 260% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: geckoShimmer 4.6s linear infinite;
          transform-origin: left bottom;
          transform: scale(0.9) translate(0, 0);
          display: inline-block;
        }

        .hero-title-animate.hero-play {
          animation: geckoShimmer 6.8s linear infinite, geckoStretchToTopRight 1.8s cubic-bezier(0.2, 0.86, 0.18, 1) forwards;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px 28px;
          width: 100%;
        }

        .contact-box-animate {
          animation: contactBoxFloat 4.8s ease-in-out infinite;
        }

        .about-layout {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr);
          gap: 28px;
          align-items: center;
        }

        .about-video-box {
          border: 1px solid #c9bde8;
          border-radius: 18px;
          background: linear-gradient(145deg, #faf9fd 0%, #f4f1fb 62%, #ede8f8 100%);
          box-shadow: 0 8px 24px rgba(92, 63, 163, 0.10);
          padding: 18px;
          display: grid;
          gap: 10px;
        }

        .about-video-frame {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          border: 1px dashed #c9bde8;
          background: linear-gradient(145deg, #ede8f8 0%, #f0ebfe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5c3fa3;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .subtitle-glow {
          animation: subtitlePulse 3.2s ease-in-out infinite;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }

        @keyframes geckoShimmer {
          from { background-position: 0% center; }
          to { background-position: 200% center; }
        }

        @keyframes geckoPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }

        @keyframes geckoStretchToTopRight {
          0% {
            transform: scale(0.76) translate(0, 0);
            letter-spacing: 1px;
            text-shadow: 0 0 0 rgba(139, 111, 212, 0);
          }
          62% {
            transform: scale(1.34) translate(58px, -44px);
            letter-spacing: 3px;
            text-shadow: 0 0 32px rgba(139, 111, 212, 0.55);
          }
          100% {
            transform: scale(0.94) translate(0, 0);
            letter-spacing: 1px;
            text-shadow: 0 0 0 rgba(139, 111, 212, 0);
          }
        }

        @keyframes subtitlePulse {
          0%, 100% { opacity: 0.86; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.018); }
        }

        @keyframes contactBoxFloat {
          0%, 100% {
            transform: translateY(0);
            box-shadow: 0 8px 24px rgba(92, 63, 163, 0.10);
          }
          50% {
            transform: translateY(-5px);
            box-shadow: 0 16px 32px rgba(92, 63, 163, 0.16);
          }
        }

        @media (max-width: 920px) {
          .top-nav {
            justify-content: center !important;
            gap: 14px !important;
          }

          .home-brand-logo {
            width: 74px !important;
            height: 74px !important;
          }

          .hero-layout {
            grid-template-columns: 1fr !important;
            gap: 26px !important;
          }

          .hero-image-shell {
            min-height: 300px !important;
            justify-content: center !important;
          }

          .hero-gecko-image {
            width: clamp(420px, 88vw, 760px) !important;
            transform: scaleX(1) rotate(-4deg) translate(0, 0) !important;
          }

          .hero-title {
            font-size: 48px !important;
          }

          .about-layout {
            grid-template-columns: 1fr;
          }

          .contact-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 40px !important;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }

          .hero-gecko-image {
            width: clamp(360px, 92vw, 560px) !important;
            transform: rotate(-2deg) translate(0, 0) !important;
          }
        }
      `}</style>

      <header
        className="top-nav"
        style={{
          width: "100%",
          backgroundColor: "#faf9fd",
          borderBottom: "1px solid #c9bde8",
          padding: "14px clamp(14px, 3.4vw, 44px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(3px)",
        }}
      >
        <Link to="/" className="brand-link">
          <img
            className="home-brand-logo"
            src="/gecko-transparent.png?v=3"
            alt="Gecko logo"
          />
          G.E.C.K.O
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "22px",
            flex: "1 1 240px",
          }}
          aria-label="Homepage sections"
        >
          <a href="#about" className="nav-link">
            About Us
          </a>
          <a href="#contact" className="nav-link">
            Contact Us
          </a>
        </nav>

        <Link
          to="/login"
          style={{
            textDecoration: "none",
            border: "1px solid #8b6fd4",
            background: "linear-gradient(135deg, #8b6fd4 0%, #5c3fa3 100%)",
            color: "#ffffff",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "10px 18px",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 16px rgba(92, 63, 163, 0.22)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          Login
        </Link>
      </header>

      <main style={{ width: "100%", display: "grid", gap: "0" }}>
        <section
          className="reveal-section hero-section"
          style={{
            ...sectionPanelStyle,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #ffffff 0%, #f8f5ff 55%, #ede8f8 100%)",
          }}
        >
          <div
            className="float-shape"
            style={{
              position: "absolute",
              right: "-40px",
              top: "20%",
              width: "220px",
              height: "220px",
              borderRadius: "40% 60% 64% 36% / 42% 35% 65% 58%",
              background: "linear-gradient(135deg, #e0d6f7 0%, #c9bde8 100%)",
              opacity: 0.85,
              filter: "blur(0.2px)",
            }}
          />
          <div
            className="scroll-dot"
            data-speed="0.12"
            data-x="1"
            data-phase="0.4"
            style={{
              position: "absolute",
              left: "10%",
              top: "18%",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#b8a4e8",
              opacity: 0.85,
              transition: "transform 0.08s linear",
            }}
          />
          <div
            className="scroll-dot"
            data-speed="0.18"
            data-x="-0.8"
            data-phase="1.9"
            style={{
              position: "absolute",
              left: "15%",
              top: "27%",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#f0b429",
              opacity: 0.8,
              transition: "transform 0.08s linear",
            }}
          />
          <div
            className="float-shape-slow"
            style={{
              position: "absolute",
              left: "-55px",
              bottom: "-65px",
              width: "230px",
              height: "230px",
              borderRadius: "58% 42% 35% 65% / 56% 41% 59% 44%",
              background: "linear-gradient(135deg, #d8d0f5 0%, #b8aee8 100%)",
              opacity: 0.74,
            }}
          />

          <div
            className="hero-layout"
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.95fr)",
              alignItems: "center",
              gap: "28px",
            }}
          >
            <div className="home-fade hero-copy" style={{ maxWidth: "900px", paddingLeft: "clamp(10px, 2.2vw, 34px)" }}>
              <h1
                className="hero-title hero-title-animate"
                style={{
                  margin: "0 0 12px",
                  fontSize: "68px",
                  fontWeight: 300,
                  letterSpacing: "1px",
                  lineHeight: 1.05,
                }}
              >
                G.E.C.K.O
              </h1>
              <p className="delay-1 home-fade subtitle-glow"
                style={{ margin: "0 0 20px", color: "#5c3fa3",
                  fontWeight: 700, fontSize: "20px", letterSpacing: "0.3px" }}>
                Goals, Earnings, Capital, Knowledge, Outcomes
              </p>
              <p
                className="delay-2 home-fade"
                style={{
                  margin: "0 0 26px",
                  lineHeight: 1.75,
                  maxWidth: "860px",
                  color: "#4a3f6b",
                  fontSize: "18px",
                }}
              >
                A finance platform built to support young adults through their first job journey, from payslip understanding to budgeting confidence.
              </p>
              <div className="delay-3 home-fade" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a href="#about" className="hero-cta" style={{ backgroundColor: "#5c3fa3", color: "#ffffff" }}>
                  Explore About
                </a>
                <a
                  href="#contact"
                  className="hero-cta"
                  style={{ backgroundColor: "#ede8f8", color: "#5c3fa3", border: "1px solid #c9bde8" }}
                >
                  Contact Team
                </a>
              </div>
            </div>

            <div
              className="home-fade delay-1 hero-image-shell"
              aria-label="Gecko artwork"
              style={{
                minHeight: "560px",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "flex-end",
                paddingRight: "clamp(0px, 0.4vw, 6px)",
                paddingLeft: "clamp(78px, 12vw, 234px)",
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <img
                className="hero-gecko-image"
                src="/gecko-transparent.png?v=3"
                alt="Gecko and coin"
                style={{
                  width: "clamp(700px, 78vw, 1200px)",
                  transform: "scaleX(1) rotate(-8deg) translate(4%, -2%)",
                  transformOrigin: "center center",
                  marginRight: "clamp(-14px, -1.4vw, 4px)",
                  filter: "drop-shadow(0 20px 18px rgba(63, 89, 70, 0.16))",
                  imageRendering: "auto",
                  userSelect: "none",
                  objectFit: "contain",
                  background: "transparent",
                }}
              />
            </div>
          </div>
        </section>

        <section
          id="about"
          className="reveal-section reveal-slide"
          style={{
            ...sectionPanelStyle,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #f8f5ff 0%, #ede8f8 64%, #e4ddf5 100%)",
          }}
        >
          <div
            className="scroll-dot"
            data-speed="0.24"
            data-x="-1"
            data-phase="2.8"
            style={{
              position: "absolute",
              right: "13%",
              top: "18%",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "#f0b429",
              opacity: 0.8,
              transition: "transform 0.08s linear",
            }}
          />
          <div
            className="scroll-dot"
            data-speed="0.16"
            data-x="0.9"
            data-phase="1.2"
            style={{
              position: "absolute",
              right: "20%",
              top: "30%",
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              background: "#b8a4e8",
              opacity: 0.78,
              transition: "transform 0.08s linear",
            }}
          />
          <div
            className="scroll-dot"
            data-speed="0.2"
            data-x="0.6"
            data-phase="3.4"
            style={{
              position: "absolute",
              left: "7%",
              bottom: "20%",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#8b6fd4",
              opacity: 0.72,
              transition: "transform 0.08s linear",
            }}
          />
          <div className="about-layout">
            <div style={{ maxWidth: "980px" }}>
              <h2 style={{ marginTop: 0, marginBottom: "14px", fontSize: "36px", color: "#5c3fa3" }}>About Us</h2>
              <p style={{ margin: "0 0 14px", lineHeight: 1.8, color: "#4a3f6b", fontSize: "17px" }}>
                G.E.C.K.O (Goals, Earnings, Capital, Knowledge, Outcomes) is Team Zoar's response to the problem statement
                "Navigating your first job." Our project focuses on empowering young adults with essential financial knowledge
                related to payslips, pensions, and budgeting through an accessible web app.
              </p>
              <p style={{ margin: "0 0 14px", lineHeight: 1.8, color: "#4a3f6b", fontSize: "17px" }}>
                This directly supports SDG 4 (Quality Education) by turning complex financial topics into practical, interactive
                learning. Many young adults begin work with limited financial literacy, which can lead to financial stress,
                poor money decisions, and missed long-term opportunities.
              </p>
              <p style={{ margin: 0, lineHeight: 1.8, color: "#4a3f6b", fontSize: "17px" }}>
                UK Money Advice Service data highlights the urgency: 61% of young adults struggle with budgeting within their
                first year of employment. G.E.C.K.O addresses this with clear guidance, budgeting tools, and gamified engagement
                that rewards progress and builds healthy money habits.
              </p>
            </div>

            <aside className="about-video-box" aria-label="Demo video placeholder">
              <h3 style={{ margin: 0, color: "#5c3fa3", fontSize: "22px" }}>Demo Video</h3>
              <div className="about-video-frame">Video Placeholder</div>
              <p style={{ margin: 0, color: "#4a3f6b", fontSize: "14px" }}>
                Replace this box with your final demo recording.
              </p>
            </aside>
          </div>
        </section>

        <section
          id="contact"
          className="reveal-section reveal-zoom"
          style={{
            ...sectionPanelStyle,
            minHeight: "112vh",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #f8f5ff 0%, #f0ebfe 100%)",
            borderTop: "1px solid #c9bde8",
            borderBottom: "1px solid #c9bde8",
          }}
        >
          <div
            className="float-shape"
            style={{
              position: "absolute",
              right: "-42px",
              top: "16%",
              width: "210px",
              height: "210px",
              borderRadius: "40% 60% 64% 36% / 42% 35% 65% 58%",
              background: "linear-gradient(135deg, #e0d6f7 0%, #c9bde8 100%)",
              opacity: 0.7,
              filter: "blur(0.2px)",
            }}
          />
          <div
            className="float-shape-slow"
            style={{
              position: "absolute",
              left: "-46px",
              bottom: "-58px",
              width: "210px",
              height: "210px",
              borderRadius: "58% 42% 35% 65% / 56% 41% 59% 44%",
              background: "linear-gradient(135deg, #d8d0f5 0%, #b8aee8 100%)",
              opacity: 0.62,
            }}
          />
          <div
            className="scroll-dot"
            data-speed="0.2"
            data-x="-0.8"
            data-phase="0.7"
            style={{
              position: "absolute",
              left: "11%",
              top: "24%",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#f0b429",
              opacity: 0.82,
              transition: "transform 0.08s linear",
            }}
          />
          <div
            className="scroll-dot"
            data-speed="0.26"
            data-x="1"
            data-phase="2.1"
            style={{
              position: "absolute",
              right: "14%",
              top: "30%",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#b8a4e8",
              opacity: 0.8,
              transition: "transform 0.08s linear",
            }}
          />
          <div style={{ width: "100%" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "42px", color: "#1a1040", fontWeight: 700 }}>Contact Us</h2>
            <div
              className="contact-box-animate"
              style={{
                background: "linear-gradient(145deg, #faf9fd 0%, #f4f1fb 62%, #ede8f8 100%)",
                border: "1px solid #c9bde8",
                borderRadius: "18px",
                marginTop: "32px",
                padding: "20px 22px",
                boxShadow: "0 14px 24px rgba(92, 63, 163, 0.10)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                className="contact-grid"
                style={{
                  color: "#4a3f6b",
                  fontSize: "19px",
                  lineHeight: 1.8,
                }}
              >
                <span style={{ gridColumn: "1 / -1", fontWeight: 700, color: "#5c3fa3", fontSize: "20px" }}>
                  Location: University of Surrey, Guildford, England, GU2 7XH
                </span>
                <span>Tamara: member@example.com</span>
                <span>Aaliyah: member@example.com</span>
                <span>Rhea: member@example.com</span>
                <span>Yasmine: member@example.com</span>
                <span>Zoe: member@example.com</span>
                <span>Tom: member@example.com</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;