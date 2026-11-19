import "./style.css";

const root = document.documentElement;
root.classList.add("js");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 768px)").matches;
const saveData =
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/* Hero intro: split the title into words that rise from a mask. Once per session. */
function initIntro(): void {
  const title = document.querySelector<HTMLElement>("[data-split]");
  if (!title || reduced) return;
  if (sessionStorageGet("intro-seen")) return;
  sessionStorageSet("intro-seen", "1");

  const words = (title.textContent ?? "").trim().split(/\s+/);
  title.setAttribute("aria-label", title.textContent?.trim() ?? "");
  title.textContent = "";
  words.forEach((w, i) => {
    const outer = document.createElement("span");
    outer.className = "word";
    outer.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = w.replace(/ /g, " ");
    inner.style.setProperty("--i", String(i));
    outer.append(inner);
    title.append(outer, document.createTextNode(" "));
  });
  document.querySelector(".hero")?.classList.add("intro");
}

function sessionStorageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function sessionStorageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
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
    video.addEventListener(
      "playing",
      () => video.classList.add("is-playing"),
      { once: true },
    );
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 },
    );
    io.observe(hero);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
    });
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(start, { timeout: 1500 });
  } else {
    setTimeout(start, 600);
  }
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
    const y = scrollY;
    items.forEach((el) => {
      const k = Number(el.dataset.parallax ?? 0);
      el.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0)`;
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

/* Reveal on scroll with a small stagger for siblings that enter together. */
function initReveals(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      let n = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.style.setProperty("--d", String(Math.min(n, 4) * 60));
        el.classList.add("is-in");
        io.unobserve(el);
        n++;
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

/* Header gets a surface once you leave the top. */
function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const hero = document.querySelector<HTMLElement>(".hero-copy");
  if (!header || !hero) return;
  new IntersectionObserver(
    ([e]) => header.classList.toggle("is-scrolled", !e.isIntersecting),
    { rootMargin: "-80px 0px 0px 0px" },
  ).observe(hero);
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

initIntro();
initReveals();
initHeader();
initMenu();
initFilters();
initParallax();
initSky();
