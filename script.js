// ============================================================
// PRISM — sklep z telefonami | interakcje
// ============================================================

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ------------------------------------------------------------
  // Rok w stopce
  // ------------------------------------------------------------
  $("#year").textContent = new Date().getFullYear();

  // ------------------------------------------------------------
  // Nagłówek — stan po przewinięciu
  // ------------------------------------------------------------
  const header = $("#siteHeader");

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ------------------------------------------------------------
  // Menu mobilne
  // ------------------------------------------------------------
  const menuToggle = $("#menuToggle");

  menuToggle.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  $$("#mainNav a").forEach((link) =>
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
    })
  );

  // ------------------------------------------------------------
  // Wyszukiwarka — filtrowanie produktów na żywo
  // ------------------------------------------------------------
  const searchInput = $("#searchInput");
  const cards = $$(".product-card");
  const searchInfo = $("#searchInfo");
  const emptyState = $("#emptyState");
  const emptyQuery = $("#emptyQuery");
  const productsSection = $("#sklep");

  const modelWord = (n) => {
    if (n === 1) return "model";
    const d = n % 10, h = n % 100;
    return d >= 2 && d <= 4 && (h < 12 || h > 14) ? "modele" : "modeli";
  };

  let scrolledToResults = false;

  const applyFilter = () => {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const haystack = (card.dataset.search || "") + " " + card.textContent.toLowerCase();
      const match = !query || haystack.includes(query);
      card.classList.toggle("hidden", !match);
      if (match) visible++;
    });

    if (query) {
      searchInfo.textContent = `Znaleziono: ${visible} ${modelWord(visible)}`;
      emptyQuery.textContent = searchInput.value.trim();
      emptyState.hidden = visible > 0;

      // przy pierwszym wpisaniu przewiń do listy produktów
      if (!scrolledToResults) {
        scrolledToResults = true;
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      searchInfo.textContent = `${cards.length} ${modelWord(cards.length)} w ofercie`;
      emptyState.hidden = true;
      scrolledToResults = false;
    }
  };

  searchInput.addEventListener("input", applyFilter);

  $("#clearSearch").addEventListener("click", () => {
    searchInput.value = "";
    applyFilter();
    searchInput.focus();
  });

  // ------------------------------------------------------------
  // Koszyk + toast
  // ------------------------------------------------------------
  const cartCount = $("#cartCount");
  const toast = $("#toast");
  let itemsInCart = 0;
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  };

  $$(".add-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      itemsInCart++;
      cartCount.textContent = itemsInCart;
      cartCount.hidden = false;
      cartCount.classList.remove("pop");
      void cartCount.offsetWidth; // restart animacji
      cartCount.classList.add("pop");

      const name = $(".p-name", btn.closest(".product-card")).textContent;
      showToast(`Dodano do koszyka: ${name} ✓`);

      const original = btn.textContent;
      btn.textContent = "Dodano ✓";
      btn.classList.add("added");
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("added");
        btn.disabled = false;
      }, 1600);
    })
  );

  $("#cartBtn").addEventListener("click", () => {
    showToast(
      itemsInCart > 0
        ? `W koszyku: ${itemsInCart} szt. — kasa wkrótce ✦`
        : "Koszyk jest pusty — dodaj coś ✦"
    );
  });

  // ------------------------------------------------------------
  // Odliczanie promocji (kończy się za 3 dni o 23:59)
  // ------------------------------------------------------------
  const target = new Date();
  target.setDate(target.getDate() + 3);
  target.setHours(23, 59, 59, 999);

  const pad = (n) => String(n).padStart(2, "0");
  const cd = {
    days: $("#cd-days"),
    hours: $("#cd-hours"),
    mins: $("#cd-mins"),
    secs: $("#cd-secs"),
  };

  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    const s = Math.floor(diff / 1000);
    cd.days.textContent = pad(Math.floor(s / 86400));
    cd.hours.textContent = pad(Math.floor(s / 3600) % 24);
    cd.mins.textContent = pad(Math.floor(s / 60) % 60);
    cd.secs.textContent = pad(s % 60);
  };

  tick();
  setInterval(tick, 1000);

  // ------------------------------------------------------------
  // Zegar i data na ekranie telefonu w hero
  // ------------------------------------------------------------
  const screenClock = $("#screenClock");
  const screenDate = $("#screenDate");

  const updateScreen = () => {
    const now = new Date();
    screenClock.textContent = now.toLocaleTimeString("pl-PL", {
      hour: "numeric",
      minute: "2-digit",
    });
    screenDate.textContent = now.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  updateScreen();
  setInterval(updateScreen, 30_000);

  // ------------------------------------------------------------
  // Animacje wejścia przy przewijaniu
  // ------------------------------------------------------------
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal").forEach((el) => revealObserver.observe(el));

  // ------------------------------------------------------------
  // Delikatny efekt 3D na kartach produktów (tylko mysz)
  // ------------------------------------------------------------
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (finePointer && !reducedMotion) {
    cards.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) translateY(-8px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
        // refleks świetlny podąża za kursorem
        card.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
        card.style.setProperty("--my", `${(y + 0.5) * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
      });
    });
  }

  // ------------------------------------------------------------
  // Soczewki kropli — indywidualna mapa załamań dla każdego szkła.
  // Kanały R/G mapy kodują wektor przesunięcia próbkowania tła:
  // środek neutralny (128), krawędzie zaginają obraz do wewnątrz
  // jak brzeg kropli wody rozlanej na ekranie.
  // ------------------------------------------------------------
  const SVG_NS = "http://www.w3.org/2000/svg";
  const lensDefs = $(".lg-defs");
  const LENS_MARGIN = 12; // musi odpowiadać inset: -12px w .glass::before
  const lensRegistry = new Map();
  let lensCounter = 0;

  const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const makeLensMap = (w, h) => {
    const W = w + LENS_MARGIN * 2;
    const H = h + LENS_MARGIN * 2;
    const ds = 2; // połowa rozdzielczości — szybciej, a soczewka gładsza
    const cw = Math.max(2, Math.round(W / ds));
    const ch = Math.max(2, Math.round(H / ds));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(cw, ch);
    const px = img.data;
    let i = 0;
    for (let cy = 0; cy < ch; cy++) {
      const y = cy * ds + ds / 2 - LENS_MARGIN;
      const ny = (y / h) * 2 - 1;
      for (let cx = 0; cx < cw; cx++) {
        const x = cx * ds + ds / 2 - LENS_MARGIN;
        const nx = (x / w) * 2 - 1;
        let r = 128, g = 128;
        if (nx >= -1 && nx <= 1 && ny >= -1 && ny <= 1) {
          // superelipsa ≈ zaokrąglony prostokąt; d: 0 w środku → 1 na brzegu
          const d = Math.pow(nx ** 4 + ny ** 4, 0.25);
          const t = smoothstep(0.62, 1, Math.min(d, 1));
          if (t > 0) {
            const gx = nx ** 3;
            const gy = ny ** 3;
            const len = Math.hypot(gx, gy) || 1;
            // znak ujemny: krawędź próbkuje obraz DO WEWNĄTRZ elementu,
            // więc nigdy nie sięga poza dostępne tło — czysty brzeg bez smug
            r -= (gx / len) * t * 127;
            g -= (gy / len) * t * 127;
          }
        }
        px[i++] = r;
        px[i++] = g;
        px[i++] = 128;
        px[i++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  };

  const fe = (name, attrs) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  const buildLens = (el) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 24 || h < 24) return; // ukryte lub zbyt małe
    let rec = lensRegistry.get(el);
    if (rec && Math.abs(rec.w - w) < 2 && Math.abs(rec.h - h) < 2) return;

    if (!rec) {
      const id = `lens-${lensCounter++}`;
      const filter = fe("filter", {
        id,
        x: "-5%", y: "-5%", width: "110%", height: "110%",
        "color-interpolation-filters": "sRGB",
      });
      const image = fe("feImage", { x: 0, y: 0, result: "map", preserveAspectRatio: "none" });
      // lekkie rozmycie MAPY (nie obrazu) usuwa schodki i ziarno z soczewki
      const smooth = fe("feGaussianBlur", { in: "map", stdDeviation: 1, result: "smap" });
      const bend = fe("feDisplacementMap", {
        in: "SourceGraphic", in2: "smap",
        xChannelSelector: "R", yChannelSelector: "G",
      });
      filter.append(image, smooth, bend);
      lensDefs.appendChild(filter);
      rec = { image, bend, w: 0, h: 0 };
      lensRegistry.set(el, rec);
      el.style.setProperty("--lens", `url(#${id})`);
    }

    rec.w = w;
    rec.h = h;
    rec.image.setAttribute("width", w + LENS_MARGIN * 2);
    rec.image.setAttribute("height", h + LENS_MARGIN * 2);
    const url = makeLensMap(w, h);
    rec.image.setAttribute("href", url);
    rec.image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url);
    // siła załamania rośnie z rozmiarem, z górnym limitem
    rec.bend.setAttribute("scale", Math.min(36, Math.min(w, h) * 0.35));
  };

  const lensTargets = $$(".glass:not(.no-warp)");
  lensTargets.forEach(buildLens);

  // przebuduj soczewki po zmianie rozmiaru elementów (debounce)
  let lensTimer;
  const lensQueue = new Set();
  const lensObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => lensQueue.add(entry.target));
    clearTimeout(lensTimer);
    lensTimer = setTimeout(() => {
      lensQueue.forEach(buildLens);
      lensQueue.clear();
    }, 150);
  });
  lensTargets.forEach((el) => lensObserver.observe(el));

  // ------------------------------------------------------------
  // Lepka kapsuła przelewająca się między linkami nawigacji
  // ------------------------------------------------------------
  const mainNavEl = $("#mainNav");
  const navList = $("#mainNav ul");
  const navBlob = document.createElement("span");
  navBlob.className = "nav-blob";
  navList.appendChild(navBlob);
  const desktopNav = window.matchMedia("(min-width: 881px)");

  const moveBlob = (link) => {
    navBlob.style.left = `${link.offsetLeft}px`;
    navBlob.style.width = `${link.offsetWidth}px`;
  };

  $$("#mainNav a").forEach((link) =>
    link.addEventListener("pointerenter", () => {
      if (!desktopNav.matches) return;
      if (!mainNavEl.classList.contains("blob-on")) {
        // pierwsze pojawienie: ustaw od razu, bez przelotu przez pasek
        navBlob.style.transition = "none";
        moveBlob(link);
        void navBlob.offsetWidth;
        navBlob.style.transition = "";
      }
      mainNavEl.classList.add("blob-on");
      moveBlob(link);
    })
  );

  navList.addEventListener("pointerleave", () => mainNavEl.classList.remove("blob-on"));

  // ------------------------------------------------------------
  // Plusk wody w miejscu kliknięcia przycisku
  // ------------------------------------------------------------
  if (!reducedMotion) {
    $$(".btn, .add-btn").forEach((btn) =>
      btn.addEventListener("pointerdown", (e) => {
        const rect = btn.getBoundingClientRect();
        const drop = document.createElement("span");
        drop.className = "splash";
        drop.style.left = `${e.clientX - rect.left}px`;
        drop.style.top = `${e.clientY - rect.top}px`;
        btn.appendChild(drop);
        drop.addEventListener("animationend", () => drop.remove());
      })
    );
  }

  // ------------------------------------------------------------
  // Newsletter (demo — bez wysyłki)
  // ------------------------------------------------------------
  const newsletterForm = $("#newsletterForm");
  const newsletterEmail = $("#newsletterEmail");
  const newsletterMsg = $("#newsletterMsg");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newsletterEmail.focus();
      showToast("Podaj poprawny adres e-mail");
      return;
    }

    newsletterMsg.hidden = false;
    newsletterForm.reset();
    showToast("Zapisano do newslettera ✦");
  });
})();
