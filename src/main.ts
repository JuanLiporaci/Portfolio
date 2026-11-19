import "./style.css";

const root = document.documentElement;
root.classList.add("js");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 768px)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const saveData =
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function session(key: string, value?: string): string | null {
  try {
    if (value !== undefined) sessionStorage.setItem(key, value);
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/* Split a heading into words that rise from a mask. */
function splitWords(el: HTMLElement): void {
  const text = (el.textContent ?? "").trim();
  el.setAttribute("aria-label", text);
  el.textContent = "";
  text.split(/\s+/).forEach((w, i) => {
    const outer = document.createElement("span");
    outer.className = "word";
    outer.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = w.replace(/ /g, " ");
    inner.style.setProperty("--i", String(i));
    outer.append(inner);
    el.append(outer, document.createTextNode(" "));
  });
}

/* Loader: counts to 100 while fonts and the hero poster load, then lifts like a curtain. */
function runPreloader(): Promise<void> {
  const pl = document.querySelector<HTMLElement>("#preloader");
  const count = document.querySelector<HTMLElement>("[data-pl-count]");
  const bar = pl?.querySelector<HTMLElement>(".pl-bar span");
  if (!pl || !count || !bar || reduced) {
    pl?.remove();
    return Promise.resolve();
  }
  document.body.classList.add("is-loading");
  const repeat = session("seen") === "1";
  session("seen", "1");
  const duration = repeat ? 650 : mobile ? 1100 : 1500;

  const ready = Promise.race([
    Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((r) => {
        const img = new Image();
        img.onload = img.onerror = () => r();
        img.src = "/img/sky-poster.webp";
      }),
    ]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      const p = easeInOut(t);
      count.textContent = String(Math.round(p * 100));
      bar.style.setProperty("--p", String(p));
      if (t < 1) requestAnimationFrame(tick);
      else
        void ready.then(() => {
          pl.classList.add("is-done");
          document.body.classList.remove("is-loading");
          setTimeout(resolve, 380);
          setTimeout(() => pl.remove(), 1000);
        });
    };
    requestAnimationFrame(tick);
  });
}

/* Custom cursor: a dot that follows exactly and a ring that trails with lerp. */
function initCursor(): void {
  if (!finePointer || reduced) return;
  const wrap = document.querySelector<HTMLElement>(".cursor");
  const dot = wrap?.querySelector<HTMLElement>(".cursor-dot");
  const ring = wrap?.querySelector<HTMLElement>(".cursor-ring");
  const label = wrap?.querySelector<HTMLElement>(".cursor-label");
  if (!wrap || !dot || !ring || !label) return;
  root.classList.add("has-cursor");

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let rx = mx;
  let ry = my;
  let running = false;

  const loop = (): void => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(loop);
    else running = false;
  };

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      wrap.classList.remove("is-hidden");
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => wrap.classList.add("is-hidden"));
  addEventListener("pointerdown", () => wrap.classList.add("is-down"));
  addEventListener("pointerup", () => wrap.classList.remove("is-down"));

  document.addEventListener("pointerover", (e) => {
    const t = e.target as HTMLElement;
    const card = t.closest<HTMLElement>("[data-cursor]");
    const link = t.closest("a, button, summary");
    const onCardLink = card && link && link.classList.contains("card-link");
    wrap.classList.toggle("is-label", Boolean(onCardLink));
    wrap.classList.toggle("is-hover", Boolean(link) && !onCardLink);
    if (onCardLink) label.textContent = `${card.dataset.cursor} ↗`;
  });
}

/* Buttons lean toward the pointer and settle back. */
function initMagnetic(): void {
  if (!finePointer || reduced) return;
  document.querySelectorAll<HTMLElement>(".btn").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transition = "translate 120ms ease-out, scale 150ms ease-out";
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "translate 600ms cubic-bezier(0.34, 1.4, 0.64, 1), scale 150ms ease-out";
      el.style.translate = "0 0";
    });
  });
}

/* Numbers count up once when they appear. */
function countUp(el: HTMLElement): void {
  const target = Number(el.dataset.count ?? 0);
  const prefix = el.dataset.prefix ?? "";
  const suffix = el.dataset.suffix ?? "";
  const fmt = (n: number): string => `${prefix}${Math.round(n).toLocaleString("en-US")}${suffix}`;
  if (reduced) {
    el.textContent = fmt(target);
    return;
  }
  const duration = target > 100 ? 1800 : 1200;
  const start = performance.now();
  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = fmt(target * easeOutExpo(t));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = fmt(0);
  requestAnimationFrame(tick);
}

function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-count]");
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countUp(e.target as HTMLElement);
        io.unobserve(e.target);
      }),
    { threshold: 0.6 },
  );
  els.forEach((el) => {
    el.style.fontVariantNumeric = "tabular-nums";
    io.observe(el);
  });
}

/* Reveal on scroll: titles split into words, cards curtain in, lines draw. */
function initReveals(): void {
  document
    .querySelectorAll<HTMLElement>("[data-split]:not(.hero-title)")
    .forEach((el) => !reduced && splitWords(el));

  const els = document.querySelectorAll<HTMLElement>("[data-reveal], [data-split]:not(.hero-title)");
  if (reduced) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      let n = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.style.setProperty("--d", String(Math.min(n, 4) * 80));
        el.classList.add("is-in");
        io.unobserve(el);
        n++;
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

/* The About paragraph lights up word by word as you scroll through it. */
function initWordLight(): void {
  const el = document.querySelector<HTMLElement>("[data-words]");
  if (!el || reduced) return;
  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.textContent = "";
  const spans = words.map((w) => {
    const s = document.createElement("span");
    s.className = "w";
    s.textContent = w;
    el.append(s, document.createTextNode(" "));
    return s;
  });

  let visible = false;
  let ticking = false;
  const update = (): void => {
    ticking = false;
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const lit = p * spans.length;
    spans.forEach((s, i) => s.style.setProperty("--o", String(Math.min(1, Math.max(0.16, lit - i + 0.16)))));
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) update();
  }).observe(el);
  addEventListener(
    "scroll",
    () => {
      if (!visible || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}

/* Sky video: load after first paint, play only while the hero is visible. */
function initSky(): void {
  const video = document.querySelector<HTMLVideoElement>(".sky-video");
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!video || !hero || reduced || saveData) return;
  const src = mobile ? video.dataset.srcMobile : video.dataset.srcDesktop;
  if (!src) return;

  const start = (): void => {
    video.src = src;
    video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 },
    ).observe(hero);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
    });
  };
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 600);
}

/* Hands drift with scroll: transform only, one rAF, only while the hero is on screen. */
function initParallax(): void {
  if (reduced || mobile) return;
  const items = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!items.length || !hero) return;
  let visible = true;
  let ticking = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  }).observe(hero);
  const update = (): void => {
    ticking = false;
    items.forEach((el) => {
      const k = Number(el.dataset.parallax ?? 0);
      el.style.transform = `translate3d(0, ${(scrollY * k).toFixed(1)}px, 0)`;
    });
  };
  addEventListener(
    "scroll",
    () => {
      if (!visible || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}

function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const hero = document.querySelector<HTMLElement>(".hero-copy");
  if (!header || !hero) return;
  new IntersectionObserver(([e]) => header.classList.toggle("is-scrolled", !e.isIntersecting), {
    rootMargin: "-80px 0px 0px 0px",
  }).observe(hero);
}

function initMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
  const drawer = document.querySelector<HTMLElement>("#drawer");
  if (!toggle || !drawer) return;
  const set = (open: boolean): void => {
    toggle.setAttribute("aria-expanded", String(open));
    drawer.hidden = !open;
  };
  toggle.addEventListener("click", () => set(drawer.hidden));
  drawer.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) set(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
}

/* Work filter: sliding pill + View Transitions when the browser has them. */
function initFilters(): void {
  const bar = document.querySelector<HTMLElement>("[data-filters]");
  const grid = document.querySelector<HTMLElement>("[data-grid]");
  if (!bar || !grid) return;
  const pill = bar.querySelector<HTMLElement>(".filters-pill");
  const buttons = [...bar.querySelectorAll<HTMLButtonElement>("button[data-filter]")];
  const cards = [...grid.querySelectorAll<HTMLElement>(".card")];
  cards.forEach((c, i) => (c.style.viewTransitionName = `card-${i}`));

  const movePill = (btn: HTMLButtonElement): void => {
    if (!pill) return;
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.height = `${btn.offsetHeight}px`;
    pill.style.translate = `${btn.offsetLeft}px ${btn.offsetTop}px`;
  };
  const apply = (filter: string): void => {
    cards.forEach((c) => {
      const show = filter === "all" || c.dataset.cat === filter;
      c.hidden = !show;
      if (show) c.classList.add("is-in");
    });
  };
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      movePill(btn);
      const filter = btn.dataset.filter ?? "all";
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
      if (doc.startViewTransition && !reduced) doc.startViewTransition(() => apply(filter));
      else apply(filter);
    }),
  );
  const current = (): HTMLButtonElement =>
    buttons.find((b) => b.getAttribute("aria-pressed") === "true") ?? buttons[0];
  requestAnimationFrame(() => movePill(current()));
  addEventListener("resize", () => movePill(current()), { passive: true });
  document.fonts?.ready.then(() => movePill(current()));
}

async function boot(): Promise<void> {
  const title = document.querySelector<HTMLElement>(".hero-title");
  if (title && !reduced) splitWords(title);

  initCursor();
  initMenu();
  initHeader();
  initFilters();
  initSky();

  await runPreloader();

  document.querySelector(".hero")?.classList.add("intro");
  initReveals();
  initCounters();
  initWordLight();
  initParallax();
  initMagnetic();
}

void boot();
