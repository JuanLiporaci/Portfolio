import "./style.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function waitForFonts(timeoutMs = 2500): Promise<void> {
  if (!document.fonts?.ready) return Promise.resolve();

  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function prepareHeroEyebrow(): void {
  const eyebrow = document.querySelector(".hero-eyebrow");
  if (!eyebrow || eyebrow.querySelector(".line-inner")) return;

  const text = eyebrow.textContent ?? "";
  eyebrow.textContent = "";
  const inner = document.createElement("span");
  inner.className = "line-inner";
  inner.textContent = text;
  eyebrow.appendChild(inner);
}

function setInitialAnimationStates(): void {
  prepareHeroEyebrow();

  gsap.set(".halftone-asset", { opacity: 0 });
  gsap.set(".hand-right", { x: 60, y: -40, rotation: 4 });
  gsap.set(".hand-left", { x: -70, y: 50, rotation: -5 });
  gsap.set(".vertical-label", { opacity: 0 });
  gsap.set(".hero-eyebrow .line-inner", { y: "110%" });
  gsap.set(".title-line", { opacity: 0, y: 28 });
  gsap.set(".hero-desc, .hero-cta", { opacity: 0, y: 20 });
  gsap.set(".ambient-deco", { opacity: 0 });
  gsap.set(".corner-eye", { opacity: 0 });
}

function setMobileInitialAnimationStates(): void {
  prepareHeroEyebrow();

  gsap.set(".halftone-asset", { opacity: 0 });
  gsap.set(".hero-eyebrow .line-inner", { y: "110%" });
  gsap.set(".title-line", { opacity: 0, y: 28 });
  gsap.set(".hero-desc, .hero-cta", { opacity: 0, y: 20 });
}

async function initPreloader(): Promise<void> {
  const preloader = document.querySelector<HTMLElement>("#preloader");
  const bar = document.querySelector<HTMLElement>(".preloader-bar span");
  const count = document.querySelector<HTMLElement>(".preloader-count");

  document.body.classList.add("is-loading");

  if (!preloader || !bar || !count || prefersReducedMotion()) {
    preloader?.classList.add("is-done");
    document.body.classList.remove("is-loading");
    return;
  }

  await waitForFonts();

  return new Promise((resolve) => {
    const counter = { value: 0 };

    gsap.to(counter, {
      value: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => {
        count.textContent = String(Math.round(counter.value));
      },
    });

    gsap.to(bar, {
      width: "100%",
      duration: 1.4,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(preloader, {
          opacity: 0,
          duration: 0.45,
          delay: 0.1,
          onComplete: () => {
            preloader.classList.add("is-done");
            document.body.classList.remove("is-loading");
            resolve();
          },
        });
      },
    });
  });
}

function initSmoothScroll(): Lenis | null {
  if (prefersReducedMotion() || isMobileViewport()) return null;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

function initCursor(): void {
  if (prefersReducedMotion() || window.matchMedia("(hover: none)").matches) {
    return;
  }

  const dot = document.querySelector<HTMLElement>("#cursor-dot");
  const ring = document.querySelector<HTMLElement>("#cursor-ring");
  if (!dot || !ring) return;

  gsap.set([dot, ring], { opacity: 1 });

  const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });

  window.addEventListener("mousemove", (e) => {
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  });

  document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      gsap.to(ring, { scale: 1.6, duration: 0.35, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(ring, { scale: 1, duration: 0.35, ease: "power3.out" });
    });
  });
}

function initMagnetic(): void {
  if (prefersReducedMotion()) return;

  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, {
        x: x * 0.18,
        y: y * 0.18,
        duration: 0.35,
        ease: "power3.out",
      });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    });
  });
}

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 768px)").matches;
}

function initHeroAnimations(): void {
  const mobile = isMobileViewport();
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (mobile) {
    tl.to(".halftone-asset", { opacity: 1, duration: 1.2, stagger: 0.15 }, 0);
  } else {
    gsap.set(".hand-right", { x: 60, y: -40, rotation: 4 });
    gsap.set(".hand-left", { x: -70, y: 50, rotation: -5 });

    tl.to(".halftone-asset", { opacity: 1, duration: 1.2, stagger: 0.15 }, 0);
    tl.to(".hand-right", { x: 0, y: 0, rotation: 0, duration: 1.5 }, 0.1);
    tl.to(".hand-left", { x: 0, y: 0, rotation: 0, duration: 1.5 }, 0.1);
  }

  tl.to(".vertical-label", { opacity: 1, duration: 0.8 }, mobile ? 0 : 0.35);
  tl.to(".hero-eyebrow .line-inner", { y: 0, duration: 0.85 }, 0.45);
  tl.to(
    ".title-line",
    { opacity: 1, y: 0, duration: 0.75, stagger: 0.12 },
    0.5,
  );
  tl.to(
    ".hero-desc, .hero-cta",
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
    0.75,
  );

  if (!prefersReducedMotion() && !mobile) {
    gsap.to(".hand-right", {
      y: -30,
      x: 12,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.4,
      },
    });
    gsap.to(".hand-left", {
      y: 40,
      x: -18,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.4,
      },
    });
  }
}

function initCloudDrift(mobile: boolean): void {
  const amp = mobile ? 0.6 : 1;
  const dur = mobile ? 1.2 : 1;

  const drifts: Array<{
    target: string;
    x: number;
    y: number;
    duration: number;
    delay?: number;
  }> = [
    { target: ".cloud-a", x: 45, y: -18, duration: 16 },
    { target: ".cloud-b", x: -50, y: 18, duration: 20 },
    { target: ".cloud-c", x: 35, y: -22, duration: 18 },
    { target: ".cloud-d", x: 28, y: 16, duration: 17 },
    { target: ".cloud-e", x: -32, y: -14, duration: 19 },
    { target: ".cloud-f", x: 40, y: 20, duration: 21 },
  ];

  drifts.forEach(({ target, x, y, duration, delay = 0 }) => {
    gsap.to(target, {
      x: x * amp,
      y: y * amp,
      duration: duration * dur,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay,
    });
  });
}

function initAmbientVideo(video: HTMLVideoElement, mobile: boolean): void {
  video.pause();
  video.muted = true;
  video.playsInline = true;

  if (mobile) {
    // Mobile browsers frequently recomposite video layers when scrolling stops.
    // Keep the animated atmosphere on CSS-only assets instead.
    video.removeAttribute("autoplay");
    video.removeAttribute("src");
    video.load();
    return;
  }

  const targetOpacity = 0.62;

  const revealVideo = (): void => {
    gsap.to(video, {
      opacity: targetOpacity,
      duration: 1.2,
      ease: "power2.out",
    });
  };

  const bindVideoScrub = (): void => {
    if (!video.duration || !Number.isFinite(video.duration)) return;

    video.currentTime = 0;

    ScrollTrigger.create({
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.65,
      onUpdate: (self) => {
        video.currentTime = Math.min(
          self.progress * video.duration,
          video.duration - 0.08,
        );
      },
    });
  };

  if (video.readyState >= 1) {
    revealVideo();
    bindVideoScrub();
  } else {
    video.addEventListener(
      "loadedmetadata",
      () => {
        revealVideo();
        bindVideoScrub();
      },
      { once: true },
    );
  }
}

function finalizeMobileAmbient(): void {
  document.querySelector<HTMLElement>("#ambient-bg")?.classList.add("is-ready");
}

function initAmbientScene(): void {
  const video = document.querySelector<HTMLVideoElement>("#sky-video");
  const decos = document.querySelectorAll<HTMLElement>(".ambient-deco");
  const reduced = prefersReducedMotion();
  const mobile = isMobileViewport();

  if (reduced) {
    gsap.set(decos, { opacity: 0.4 });
    initCornerEyes();
    if (video) {
      video.playbackRate = 0.35;
      void video.play().catch(() => {});
    }
    return;
  }

  const decoOpacity = mobile ? 0.45 : 0.72;

  if (mobile) {
    document.documentElement.classList.add("mobile-ambient-css");
    finalizeMobileAmbient();

    if (video) {
      initAmbientVideo(video, true);
    }

    return;
  }

  gsap.to(decos, {
    opacity: decoOpacity,
    duration: 1.8,
    stagger: 0.1,
    delay: 0.6,
    ease: "power2.out",
  });

  initCloudDrift(false);

  gsap.to(".butterfly", {
    y: -35,
    x: 25,
    rotation: 10,
    duration: 2.8,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  decos.forEach((el) => {
    const depth = Number.parseFloat(el.dataset.depth ?? "0.3");
    gsap.to(el, {
      y: () => window.innerHeight * depth * 1.35,
      ease: "none",
      scrollTrigger: {
        trigger: "main",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2 + depth * 2.5,
      },
    });
  });

  gsap.to(".edge-cloud-left", {
    x: 70,
    ease: "none",
    scrollTrigger: {
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.4,
    },
  });

  gsap.to(".edge-cloud-right", {
    x: -55,
    ease: "none",
    scrollTrigger: {
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1,
    },
  });

  initCornerEyes();

  if (video) {
    initAmbientVideo(video, false);
  }
}

function initCornerEyes(): void {
  const eyes = document.querySelectorAll<HTMLElement>(".corner-eye");
  if (!eyes.length) return;

  if (prefersReducedMotion()) {
    gsap.set(eyes, { opacity: 0.12 });
    return;
  }

  if (isMobileViewport()) {
    return;
  }

  gsap.to(eyes, {
    opacity: 0.14,
    duration: 1.4,
    stagger: 0.2,
    delay: 1.2,
    ease: "power2.out",
  });

  gsap.to(".corner-eye--tl", {
    y: -6,
    x: 4,
    rotation: -4,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to(".corner-eye--br", {
    y: 8,
    x: -5,
    rotation: 6,
    duration: 6.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.8,
  });
}

function initSectionEdges(): void {
  if (prefersReducedMotion() || isMobileViewport()) return;

  gsap.utils.toArray<HTMLElement>(".section-cloud").forEach((cloud) => {
    gsap.fromTo(
      cloud,
      { x: -30, opacity: 0.15 },
      {
        x: 20,
        opacity: 0.45,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cloud.closest("section") ?? cloud,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      },
    );
  });

  const sectionButterfly = document.querySelector<HTMLElement>(".section-butterfly");
  if (!sectionButterfly) return;

  gsap.fromTo(
    sectionButterfly,
    { x: 40, y: -20, rotation: -12, opacity: 0 },
    {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 0.45,
      duration: 1.4,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionButterfly.closest("section") ?? sectionButterfly,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    },
  );

  gsap.to(sectionButterfly, {
    y: -18,
    rotation: 8,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

function initServiceList(): void {
  document.querySelectorAll<HTMLElement>("[data-service]").forEach((row, i) => {
    const line = row.querySelector<HTMLElement>(".service-line");
    const trigger = row.querySelector<HTMLButtonElement>(".service-trigger");
    const panel = row.querySelector<HTMLElement>(".service-panel");

    if (line) {
      gsap.to(line, {
        scaleX: 1,
        duration: 0.85,
        delay: 0.8 + i * 0.1,
        ease: "power3.inOut",
      });
    }

    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const willOpen = !row.classList.contains("is-active");

      document.querySelectorAll<HTMLElement>("[data-service].is-active").forEach((openRow) => {
        if (openRow === row) return;
        openRow.classList.remove("is-active");
        openRow.querySelector(".service-trigger")?.setAttribute("aria-expanded", "false");
      });

      row.classList.toggle("is-active", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function initMarquee(): void {
  const inner = document.querySelector<HTMLElement>(".marquee-inner");
  if (!inner || prefersReducedMotion()) return;

  const width = inner.scrollWidth / 2;

  gsap.to(inner, {
    x: -width,
    duration: 32,
    ease: "none",
    repeat: -1,
  });
}

function initExperienceList(): void {
  const mobile = isMobileViewport();

  document.querySelectorAll<HTMLElement>("[data-experience]").forEach((item, i) => {
    const line = item.querySelector<HTMLElement>(".experience-line");
    if (line && !mobile) {
      gsap.to(line, {
        scaleX: 1,
        duration: 0.9,
        ease: "power3.inOut",
        delay: i * 0.08,
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    }

    if (mobile) return;

    gsap.from(item, {
      y: 36,
      opacity: 0,
      duration: 0.75,
      ease: "power3.out",
      scrollTrigger: {
        trigger: item,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });
}

function initWorkCards(): void {
  const scroll = document.querySelector<HTMLElement>(".work-scroll");
  const cards = gsap.utils.toArray<HTMLElement>("[data-project]");
  if (!scroll || !cards.length) return;

  gsap.set(cards, { opacity: 1, x: 0, clearProps: "transform" });

  if (prefersReducedMotion() || isMobileViewport()) return;

  gsap.fromTo(
    cards,
    { opacity: 0, x: 40 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      stagger: 0.07,
      ease: "power3.out",
      scrollTrigger: {
        trigger: scroll,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    },
  );
}

function getWorkScrollMax(scroll: HTMLElement): number {
  const lastCard = scroll.querySelector<HTMLElement>(".work-card:last-child");
  if (!lastCard) return 0;

  const scrollRect = scroll.getBoundingClientRect();
  const lastRect = lastCard.getBoundingClientRect();
  return Math.max(0, scroll.scrollLeft + (lastRect.right - scrollRect.right));
}

function clampWorkScroll(scroll: HTMLElement): void {
  const max = getWorkScrollMax(scroll);
  if (scroll.scrollLeft > max) scroll.scrollLeft = max;
  if (scroll.scrollLeft < 0) scroll.scrollLeft = 0;
}

function initWorkHorizontalScroll(): void {
  const workScroll = document.querySelector<HTMLElement>("[data-horizontal-scroll]");
  if (!workScroll) return;

  const clamp = (): void => clampWorkScroll(workScroll);

  clamp();
  workScroll.addEventListener("scroll", clamp, { passive: true });
  window.addEventListener("resize", clamp, { passive: true });

  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;
  let moved = false;

  workScroll.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if ((event.target as HTMLElement).closest("a, button")) return;

      isDragging = true;
      moved = false;
      startX = event.clientX;
      scrollStart = workScroll.scrollLeft;
      workScroll.setPointerCapture(event.pointerId);
      workScroll.classList.add("is-dragging");
    },
    { passive: true },
  );

  workScroll.addEventListener(
    "pointermove",
    (event) => {
      if (!isDragging) return;

      const delta = event.clientX - startX;
      if (Math.abs(delta) > 4) moved = true;
      if (!moved) return;

      event.preventDefault();
      const max = getWorkScrollMax(workScroll);
      workScroll.scrollLeft = Math.min(Math.max(0, scrollStart - delta), max);
    },
    { passive: false },
  );

  const endDrag = (event: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    clampWorkScroll(workScroll);
    workScroll.classList.remove("is-dragging");

    if (workScroll.hasPointerCapture(event.pointerId)) {
      workScroll.releasePointerCapture(event.pointerId);
    }
  };

  workScroll.addEventListener("pointerup", endDrag);
  workScroll.addEventListener("pointercancel", endDrag);
  workScroll.addEventListener("lostpointercapture", () => {
    isDragging = false;
    workScroll.classList.remove("is-dragging");
  });
}

function initScrollReveals(): void {
  if (isMobileViewport()) return;

  gsap.utils.toArray<HTMLElement>(".section-head").forEach((el) => {
    gsap.from(el.children, {
      y: 32,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });
}

function initStats(): void {
  document.querySelectorAll<HTMLElement>("[data-stat]").forEach((stat) => {
    const valueEl = stat.querySelector<HTMLElement>("[data-count]");
    if (!valueEl) return;

    const target = Number(valueEl.dataset.count ?? 0);
    const counter = { value: 0 };

    ScrollTrigger.create({
      trigger: stat,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            valueEl.textContent = String(Math.round(counter.value));
          },
        });
      },
    });
  });
}

function initNav(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileMenu();
    });
  });

  const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
  const drawer = document.querySelector<HTMLElement>(".mobile-drawer");

  toggle?.addEventListener("click", () => {
    const isOpen = drawer?.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (drawer) drawer.hidden = !isOpen;
  });
}

function closeMobileMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
  const drawer = document.querySelector<HTMLElement>(".mobile-drawer");
  drawer?.classList.remove("is-open");
  if (drawer) drawer.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
}

async function bootstrap(): Promise<void> {
  const reduced = prefersReducedMotion();
  const mobile = isMobileViewport();

  if (mobile) {
    ScrollTrigger.config({
      ignoreMobileResize: true,
      limitCallbacks: true,
    });
  }

  if (reduced) {
    prepareHeroEyebrow();
  } else if (mobile) {
    setMobileInitialAnimationStates();
  } else {
    setInitialAnimationStates();
  }

  await initPreloader();

  const lenis = initSmoothScroll();
  lenis?.scrollTo(0, { immediate: true });

  initCursor();
  initMagnetic();
  initAmbientScene();

  if (reduced) {
    gsap.set(
      ".title-line, .hero-desc, .hero-cta, .halftone-asset, .vertical-label, .ambient-deco, .corner-eye",
      { clearProps: "all" },
    );
    gsap.set("#sky-video", { opacity: 0.62 });
  } else {
    initHeroAnimations();
  }

  initServiceList();
  initMarquee();
  initWorkCards();
  initWorkHorizontalScroll();
  initExperienceList();
  initScrollReveals();
  initSectionEdges();
  initStats();
  initNav();

  if (!mobile) {
    ScrollTrigger.refresh();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
  });
} else {
  void bootstrap();
}
