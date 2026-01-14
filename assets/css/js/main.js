// assets/js/main.js

(() => {
  "use strict";

  /* ===========================
     Helpers
     =========================== */

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const prefersDark = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const setAriaExpanded = (btn, val) => {
    if (!btn) return;
    btn.setAttribute("aria-expanded", val ? "true" : "false");
  };

  /* ===========================
     Theme + Motion preference
     =========================== */

  const THEME_KEY = "site_theme";
  const MOTION_KEY = "site_motion";

  const applyTheme = (theme) => {
    // theme: "light" | "dark" | "system"
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data_theme", theme);
      return;
    }
    // system
    document.documentElement.setAttribute("data_theme", prefersDark() ? "dark" : "light");
  };

  const applyMotion = (motion) => {
    // motion: "reduced" | "full" | "system"
    if (motion === "reduced") {
      document.documentElement.setAttribute("data_motion", "reduced");
      return;
    }
    if (motion === "full") {
      document.documentElement.setAttribute("data_motion", "full");
      return;
    }
    // system
    document.documentElement.setAttribute("data_motion", prefersReducedMotion() ? "reduced" : "full");
  };

  const initThemeAndMotion = () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || "system";
    const savedMotion = localStorage.getItem(MOTION_KEY) || "system";

    applyTheme(savedTheme);
    applyMotion(savedMotion);

    // Update on OS changes if using system
    const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mqTheme && mqTheme.addEventListener) {
      mqTheme.addEventListener("change", () => {
        const current = localStorage.getItem(THEME_KEY) || "system";
        if (current === "system") applyTheme("system");
      });
    }

    if (mqMotion && mqMotion.addEventListener) {
      mqMotion.addEventListener("change", () => {
        const current = localStorage.getItem(MOTION_KEY) || "system";
        if (current === "system") applyMotion("system");
      });
    }
  };

  const initThemeToggle = () => {
    const btn = qs("[data_theme_toggle]");
    if (!btn) return;

    // Cycle: system -> dark -> light -> system ...
    btn.addEventListener("click", () => {
      const current = localStorage.getItem(THEME_KEY) || "system";
      const next = current === "system" ? "dark" : current === "dark" ? "light" : "system";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      updateToggleLabels();
    });
  };

  const initMotionToggle = () => {
    const btn = qs("[data_motion_toggle]");
    if (!btn) return;

    // Cycle: system -> reduced -> full -> system ...
    btn.addEventListener("click", () => {
      const current = localStorage.getItem(MOTION_KEY) || "system";
      const next = current === "system" ? "reduced" : current === "reduced" ? "full" : "system";
      localStorage.setItem(MOTION_KEY, next);
      applyMotion(next);
      updateToggleLabels();
      // If motion is reduced, immediately reveal animations
      if (document.documentElement.getAttribute("data_motion") === "reduced") {
        qsa("[data_animate]").forEach((el) => el.classList.add("in_view"));
      }
    });
  };

  const updateToggleLabels = () => {
    const themeBtn = qs("[data_theme_toggle]");
    const motionBtn = qs("[data_motion_toggle]");

    const theme = localStorage.getItem(THEME_KEY) || "system";
    const motion = localStorage.getItem(MOTION_KEY) || "system";

    if (themeBtn) themeBtn.textContent = theme === "system" ? "Theme: System" : theme === "dark" ? "Theme: Dark" : "Theme: Light";
    if (motionBtn) motionBtn.textContent = motion === "system" ? "Motion: System" : motion === "reduced" ? "Motion: Reduced" : "Motion: Full";
  };

  /* ===========================
     Mobile nav
     =========================== */

  const initNav = () => {
    const toggle = qs("[data_nav_toggle]");
    const links = qs("#nav_links");
    if (!toggle || !links) return;

    const closeNav = () => {
      links.classList.remove("is_open");
      setAriaExpanded(toggle, false);
    };

    toggle.addEventListener("click", () => {
      const open = !links.classList.contains("is_open");
      links.classList.toggle("is_open", open);
      setAriaExpanded(toggle, open);
    });

    // Close on link click
    qsa("a.nav_link", links).forEach((a) => {
      a.addEventListener("click", () => closeNav());
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      const clickedInside = links.contains(e.target) || toggle.contains(e.target);
      if (!clickedInside) closeNav();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  };

  /* ===========================
     Scroll progress indicator
     =========================== */

  const initScrollProgress = () => {
    const bar = qs("#scroll_progress_bar");
    if (!bar) return;

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = `${clamp(pct, 0, 100).toFixed(2)}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  };

  /* ===========================
     Scroll triggered animations
     =========================== */

  const initScrollAnimations = () => {
    const els = qsa("[data_animate]");
    if (!els.length) return;

    if (document.documentElement.getAttribute("data_motion") === "reduced") {
      els.forEach((el) => el.classList.add("in_view"));
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in_view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  };

  /* ===========================
     Count up metrics
     =========================== */

  const initCountUp = () => {
    const nodes = qsa("[data_countup][data_target]");
    if (!nodes.length) return;

    const reduced = document.documentElement.getAttribute("data_motion") === "reduced";

    const animateValue = (el) => {
      const targetRaw = el.getAttribute("data_target") || "0";
      const target = Number(targetRaw.replace(/,/g, ""));
      if (!Number.isFinite(target)) return;

      if (reduced) {
        el.textContent = formatNumber(target);
        return;
      }

      const duration = 900;
      const start = performance.now();
      const startVal = 0;

      const tick = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(startVal + (target - startVal) * eased);
        el.textContent = formatNumber(value);
        if (t < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const formatNumber = (n) => {
      // NOTE: If you want commas for large numbers
      return n.toLocaleString("en-US");
    };

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateValue(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    nodes.forEach((n) => io.observe(n));
  };

  /* ===========================
     Scrollspy for home anchors
     =========================== */

  const initScrollSpy = () => {
    // Only applies if there are in-page anchors
    const spyLinks = qsa("[data_scrollspy]");
    if (!spyLinks.length) return;

    const linkMap = new Map();
    spyLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const id = href.slice(1);
        const section = qs(`#${CSS.escape(id)}`);
        if (section) linkMap.set(section, a);
      }
    });

    if (!linkMap.size) return;

    const sections = Array.from(linkMap.keys());

    const setCurrent = (activeSection) => {
      linkMap.forEach((link) => link.removeAttribute("aria-current"));
      const activeLink = linkMap.get(activeSection);
      if (activeLink) activeLink.setAttribute("aria-current", "true");
    };

    const io = new IntersectionObserver(
      (entries) => {
        // Find the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setCurrent(visible.target);
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0.12, 0.18, 0.25, 0.35, 0.5, 0.7],
      }
    );

    sections.forEach((s) => io.observe(s));
  };

  /* ===========================
     Modals (Image + Project)
     Accessible: focus trap, escape, click overlay
     =========================== */

  const initModals = () => {
    const modals = qsa(".modal[data_modal]");
    if (!modals.length) return;

    let lastFocus = null;

    const getFocusable = (root) => {
      const selectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ];
      return qsa(selectors.join(","), root).filter((el) => el.offsetParent !== null);
    };

    const openModal = (modal) => {
      if (!modal) return;
      lastFocus = document.activeElement;

      modal.classList.add("is_open");
      modal.setAttribute("aria-hidden", "false");

      // Prevent background scroll
      document.body.style.overflow = "hidden";

      const focusable = getFocusable(modal);
      if (focusable.length) focusable[0].focus();
    };

    const closeModal = (modal) => {
      if (!modal) return;

      modal.classList.remove("is_open");
      modal.setAttribute("aria-hidden", "true");

      document.body.style.overflow = "";

      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
      lastFocus = null;
    };

    // Global close handlers inside modals
    qsa("[data_modal_close]").forEach((el) => {
      el.addEventListener("click", () => {
        const modal = el.closest(".modal");
        closeModal(modal);
      });
    });

    // Escape closes the topmost open modal
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const open = qs(".modal.is_open");
      if (open) closeModal(open);
    });

    // Focus trap
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;

      const modal = qs(".modal.is_open");
      if (!modal) return;

      const focusable = getFocusable(modal);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    /* ---------- Image modal wiring ---------- */

    const imageModal = qs('.modal[data_modal="image"]');
    const imageModalImg = qs("#image_modal_img");
    const imageModalCaption = qs("#image_modal_caption");
    const imageModalTitle = qs("#image_modal_title");

    qsa("[data_image_open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!imageModal || !imageModalImg) return;

        const src = btn.getAttribute("data_image_src") || "";
        const alt = btn.getAttribute("data_image_alt") || "Image";
        const caption = btn.getAttribute("data_image_caption") || "";

        imageModalImg.src = src;
        imageModalImg.alt = alt;

        if (imageModalCaption) imageModalCaption.textContent = caption;
        if (imageModalTitle) imageModalTitle.textContent = "Image";

        openModal(imageModal);
      });
    });

    /* ---------- Project quick view wiring ---------- */

    const projectModal = qs('.modal[data_modal="project"]');
    const pmTitle = qs("#project_modal_title");
    const pmImg = qs("#project_modal_img");
    const pmDesc = qs("#project_modal_description");
    const pmProblem = qs("#project_modal_problem");
    const pmApproach = qs("#project_modal_approach");
    const pmResult = qs("#project_modal_result");

    qsa("[data_project_quickview]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!projectModal) return;
        const card = btn.closest("[data_project_card]");
        if (!card) return;

        const hidden = qs(".project_hidden", card);
        if (!hidden) return;

        const getText = (sel) => {
          const el = qs(sel, hidden);
          return el ? el.textContent.trim() : "";
        };

        const title = getText("[data_qv_title]") || "Project";
        const desc = getText("[data_qv_description]");
        const prob = getText("[data_qv_problem]");
        const appr = getText("[data_qv_approach]");
        const res = getText("[data_qv_result]");
        const img = getText("[data_qv_image]");

        if (pmTitle) pmTitle.textContent = title;
        if (pmDesc) pmDesc.textContent = desc;
        if (pmProblem) pmProblem.textContent = prob;
        if (pmApproach) pmApproach.textContent = appr;
        if (pmResult) pmResult.textContent = res;

        if (pmImg) {
          pmImg.src = img || "";
          pmImg.alt = "";
        }

        openModal(projectModal);
      });
    });

    // Expose closeModal for optional use later
    window.__siteCloseModal = () => {
      const open = qs(".modal.is_open");
      if (open) closeModal(open);
    };
  };

  /* ===========================
     Projects filters (projects.html)
     Works with manual cards too.
     =========================== */

  const initProjectFilters = () => {
    const grid = qs("[data_projects_grid]");
    if (!grid) return;

    const searchInput = qs("[data_project_search]");
    const categorySelect = qs("[data_filter_category]");
    const yearSelect = qs("[data_filter_year]");
    const sortSelect = qs("[data_sort_projects]");
    const skillRow = qs("[data_filter_skills]");
    const emptyMsg = qs("[data_projects_empty]");

    const cards = qsa("[data_project_card]", grid);

    // Skills selected
    const selectedSkills = new Set();

    const readCardText = (card) => {
      return (card.textContent || "").toLowerCase();
    };

    // Optional data attributes you can add later:
    // data_category="formula_sae"
    // data_year="2025"
    // data_skills="cad,testing,manufacturing"
    const getCardCategory = (card) => card.getAttribute("data_category") || "all";
    const getCardYear = (card) => card.getAttribute("data_year") || "all";
    const getCardSkills = (card) => {
      const raw = card.getAttribute("data_skills") || "";
      return raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    };

    const scoreImpact = (card) => {
      // NOTE: If you want custom scoring later, add data_impact="1-100"
      const raw = card.getAttribute("data_impact");
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) ? n : 0;
    };

    const scoreTechnical = (card) => {
      // NOTE: If you want custom scoring later, add data_technical="1-100"
      const raw = card.getAttribute("data_technical");
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) ? n : 0;
    };

    const matchesFilters = (card) => {
      const q = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();
      if (q) {
        const hay = readCardText(card);
        if (!hay.includes(q)) return false;
      }

      const cat = categorySelect ? categorySelect.value : "all";
      if (cat !== "all") {
        const cardCat = getCardCategory(card);
        if (cardCat !== cat) return false;
      }

      const year = yearSelect ? yearSelect.value : "all";
      if (year !== "all") {
        const cardYear = getCardYear(card);
        if (cardYear !== year) return false;
      }

      if (selectedSkills.size) {
        const skills = getCardSkills(card);
        // Require all selected skills to be present
        for (const s of selectedSkills) {
          if (!skills.includes(s)) return false;
        }
      }

      return true;
    };

    const apply = () => {
      const visible = [];

      cards.forEach((card) => {
        const ok = matchesFilters(card);
        card.style.display = ok ? "" : "none";
        if (ok) visible.push(card);
      });

      // Sorting (only affects visible ordering)
      const sort = sortSelect ? sortSelect.value : "recent";
      const sorted = visible.slice();

      if (sort === "impact") {
        sorted.sort((a, b) => scoreImpact(b) - scoreImpact(a));
      } else if (sort === "technical") {
        sorted.sort((a, b) => scoreTechnical(b) - scoreTechnical(a));
      } else {
        // Recent: if data_year exists, sort desc by year, else keep as-is
        sorted.sort((a, b) => {
          const ay = Number(getCardYear(a));
          const by = Number(getCardYear(b));
          const aOk = Number.isFinite(ay);
          const bOk = Number.isFinite(by);
          if (aOk && bOk) return by - ay;
          if (aOk && !bOk) return -1;
          if (!aOk && bOk) return 1;
          return 0;
        });
      }

      // Reorder DOM
      sorted.forEach((card) => grid.appendChild(card));

      if (emptyMsg) {
        emptyMsg.hidden = visible.length !== 0;
      }
    };

    // Wire inputs
    if (searchInput) searchInput.addEventListener("input", apply);
    if (categorySelect) categorySelect.addEventListener("change", apply);
    if (yearSelect) yearSelect.addEventListener("change", apply);
    if (sortSelect) sortSelect.addEventListener("change", apply);

    // Skill chip toggles
    if (skillRow) {
      qsa("[data_skill]", skillRow).forEach((chip) => {
        chip.addEventListener("click", () => {
          const skill = (chip.getAttribute("data_skill") || "").toLowerCase().trim();
          if (!skill) return;

          if (selectedSkills.has(skill)) {
            selectedSkills.delete(skill);
            chip.classList.remove("is_active");
          } else {
            selectedSkills.add(skill);
            chip.classList.add("is_active");
          }
          apply();
        });
      });
    }

    apply();
  };

  /* ===========================
     Gallery filter chips (optional)
     =========================== */

  const initGalleryFilters = () => {
    const chips = qsa("[data_gallery_filter]");
    if (!chips.length) return;

    const items = qsa("[data_image_open][data_image_type]");
    if (!items.length) return;

    const setActive = (active) => {
      chips.forEach((c) => c.classList.toggle("is_active", c.getAttribute("data_gallery_filter") === active));
    };

    const apply = (filter) => {
      items.forEach((btn) => {
        const t = btn.getAttribute("data_image_type") || "all";
        const show = filter === "all" ? true : t === filter;
        btn.style.display = show ? "" : "none";
      });
    };

    chips.forEach((c) => {
      c.addEventListener("click", () => {
        const f = c.getAttribute("data_gallery_filter") || "all";
        setActive(f);
        apply(f);
      });
    });

    // Default
    setActive("all");
    apply("all");
  };

  /* ===========================
     Footer year
     =========================== */

  const initFooterYear = () => {
    const y = qs("#footer_year");
    if (!y) return;
    y.textContent = String(new Date().getFullYear());
  };

  /* ===========================
     Init
     =========================== */

  const init = () => {
    initThemeAndMotion();
    updateToggleLabels();

    initThemeToggle();
    initMotionToggle();

    initNav();
    initScrollProgress();
    initScrollAnimations();
    initCountUp();
    initScrollSpy();

    initModals();
    initProjectFilters();
    initGalleryFilters();

    initFooterYear();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
