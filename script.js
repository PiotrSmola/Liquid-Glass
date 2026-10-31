// ============================================================
// PRISM — sklep z telefonami | interakcje
// Kolejność ma znaczenie: najpierw renderujemy treść z katalogu,
// potem budujemy soczewki szkła — tak każdy element .glass
// (także wygenerowany z danych) dostaje własną mapę załamań.
// ============================================================

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ------------------------------------------------------------
  // Język — teksty statyczne tłumaczy i18n.js, tu komunikaty z JS
  // ------------------------------------------------------------
  const LANG = window.PRISM_LANG === "en" ? "en" : "pl";
  window.PRISM_APPLY_I18N?.();

  const STR = {
    pl: {
      locale: "pl-PL",
      from: "od",
      colors: "kolory",
      addToCart: "Do koszyka",
      added: "Dodano ✓",
      addedToast: "Dodano do koszyka: {name}",
      cartEmpty1: "Pusto jak na plaży w listopadzie.",
      cartEmpty2: "Dodaj telefon, a pojawi się tutaj.",
      less: "Mniej",
      more: "Więcej",
      remove: "Usuń",
      checkoutDemo: "Kasa w budowie — to projekt demonstracyjny",
      checkoutEmpty: "Najpierw dodaj coś do koszyka",
      found: "Znaleziono: {n} {word}",
      inStock: "{n} {word} w ofercie",
      monthly: "lub 20 rat × {price}<br>bez odsetek",
      instToast: "Raty 0%: 20 × {price}",
      badEmail: "Podaj poprawny adres e-mail",
      subscribed: "Zapisano do newslettera",
      open: "Salon otwarty, zamykamy o {h}:00",
      closed: "Teraz zamknięte, otwieramy {when}",
      today: "dziś",
      tomorrow: "jutro",
      at: "o",
      soon: "wkrótce",
      days: ["nd.", "pn.", "wt.", "śr.", "czw.", "pt.", "sob."],
      fillFields: "Uzupełnij zaznaczone pola",
      sent: "Wiadomość wysłana, odpiszemy w ciągu 24 h",
      specs: {},
    },
    en: {
      locale: "en-GB",
      from: "from",
      colors: "colours",
      addToCart: "Add to cart",
      added: "Added ✓",
      addedToast: "Added to cart: {name}",
      cartEmpty1: "Empty as a beach in November.",
      cartEmpty2: "Add a phone and it will show up here.",
      less: "Fewer",
      more: "More",
      remove: "Remove",
      checkoutDemo: "Checkout under construction — this is a demo project",
      checkoutEmpty: "Add something to your cart first",
      found: "Found: {n} {word}",
      inStock: "{n} {word} in stock",
      monthly: "or 20 × {price}<br>interest-free",
      instToast: "0% instalments: 20 × {price}",
      badEmail: "Please enter a valid e-mail address",
      subscribed: "Subscribed to the newsletter",
      open: "Studio open, we close at {h}:00",
      closed: "Closed now, we open {when}",
      today: "today",
      tomorrow: "tomorrow",
      at: "at",
      soon: "soon",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      fillFields: "Please fill in the highlighted fields",
      sent: "Message sent, we'll reply within 24 h",
      specs: { Ekran: "Display", Procesor: "Chip", Aparat: "Camera", Bateria: "Battery", Waga: "Weight" },
    },
  }[LANG];

  const t = (key, vars = {}) => STR[key].replace(/\{(\w+)\}/g, (_, k) => vars[k]);

  // katalog w wybranym języku: nadpisania tekstów, etykiety specyfikacji, kropka dziesiętna
  const PRODUCTS = (window.PRISM_PRODUCTS || []).map((p) => {
    if (LANG === "pl") return p;
    const en = (window.PRISM_PRODUCTS_EN || {})[p.id] || {};
    return {
      ...p,
      tagline: en.tagline || p.tagline,
      badge: p.badge && (en.badge || p.badge),
      colors: p.colors.map((c, i) => ({ ...c, name: en.colors?.[i] || c.name })),
      specs: p.specs.map(([k, v]) => [STR.specs[k] || k, v.replace(/(\d),(\d)/g, "$1.$2")]),
    };
  });

  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = (n) => String(n).padStart(2, "0");
  const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, LANG === "en" ? "," : " ");
  const fmt = (n) => (LANG === "en" ? `PLN ${group(n)}` : `${group(n)} zł`);
  const storageLabel = (gb) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);
  const STORAGE_STEP = 600; // dopłata za każdy wyższy wariant pamięci
  const priceOf = (p, s = 0) => p.price + s * STORAGE_STEP;
  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

  // ------------------------------------------------------------
  // Rok w stopce
  // ------------------------------------------------------------
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  // ------------------------------------------------------------
  // Telefon 3D — bryła z frontu, tyłu i plastrów rantu.
  // Dotychczasowa zawartość elementu trafia na ekran.
  // ------------------------------------------------------------
  const buildPhone = (el, { body, screen } = {}) => {
    el.classList.add("phone3d");
    if (body) el.style.setProperty("--body", body);
    const t = parseFloat(getComputedStyle(el).getPropertyValue("--t")) || 16;

    const front = document.createElement("div");
    front.className = "ph-front";
    const scr = document.createElement("div");
    scr.className = "ph-screen";
    if (screen) scr.style.setProperty("--screen", screen);
    scr.innerHTML = '<span class="ph-island"></span>';
    while (el.firstChild) scr.appendChild(el.firstChild);
    front.appendChild(scr);

    const layers = 7;
    for (let k = 0; k < layers; k++) {
      const edge = document.createElement("div");
      edge.className = "ph-edge";
      edge.style.setProperty("--z", `${-t / 2 + 1 + (k * (t - 2)) / (layers - 1)}px`);
      el.appendChild(edge);
    }

    const back = document.createElement("div");
    back.className = "ph-back";
    back.innerHTML = '<div class="ph-cam"><i></i><i></i><i></i></div><span class="ph-logo">P</span>';
    const floor = document.createElement("span");
    floor.className = "ph-floor";
    el.append(back, front, floor);
    return el;
  };

  // płynny obrót bryły: cel ustawia logika strony, tu tylko wygładzanie
  const makeSpinner = (el, ease = 0.08) => {
    const s = { rx: 0, ry: 0, trx: 0, try: 0, running: false };
    const frame = () => {
      s.rx = lerp(s.rx, s.trx, ease);
      s.ry = lerp(s.ry, s.try, ease);
      el.style.setProperty("--rx", `${s.rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${s.ry.toFixed(2)}deg`);
      // refleks na szybie wędruje wraz z kątem
      const turn = ((s.ry % 360) + 360) % 360;
      el.style.setProperty("--glare", `${(100 - (turn / 360) * 200 + 200) % 200 - 50}%`);
      if (s.tick) s.tick();
      if (s.running) requestAnimationFrame(frame);
    };
    s.start = () => {
      if (s.running) return;
      s.running = true;
      requestAnimationFrame(frame);
    };
    s.stop = () => (s.running = false);
    // animuj tylko, gdy bryła jest na ekranie
    new IntersectionObserver(([e]) => (e.isIntersecting ? s.start() : s.stop())).observe(el);
    return s;
  };

  // ------------------------------------------------------------
  // Karta produktu (sklep, „zobacz też”)
  // ------------------------------------------------------------
  const badgeHTML = (p) =>
    p.badge ? `<span class="p-badge${p.badgeType ? ` p-badge-${p.badgeType}` : ""}">${p.badge}</span>` : "";

  const cardHTML = (p, i) => {
    const screenSize = p.specs[0][1].split(" ")[0];
    return `
      <article class="product-card glass reveal" style="--d:${(i % 3) * 0.08}s"
        data-id="${p.id}" data-brand="${p.brand}" data-price="${p.price}"
        data-search="${`${p.brand} ${p.name} ${p.specs.map((s) => s[1]).join(" ")} ${p.storage.join(" gb ")} gb`.toLowerCase()}">
        <span class="p-index">${pad(PRODUCTS.indexOf(p) + 1)}</span>
        ${badgeHTML(p)}
        <div class="p-visual"><div class="p-phone" style="--screen:${p.screen}"></div></div>
        <div class="p-info">
          <span class="p-brand">${p.brand}</span>
          <h3 class="p-name"><a class="p-link" href="produkt.html?id=${p.id}">${p.name}</a></h3>
          <p class="p-specs">${screenSize} · ${p.specs[1][1]} · ${t("from")} ${storageLabel(p.storage[0])}</p>
          <div class="p-swatches" aria-label="${p.colors.length} ${t("colors")}">${p.colors.map((c) => `<i style="--c:${c.hex}" title="${c.name}"></i>`).join("")}</div>
          <div class="p-row">
            <p class="p-price">${p.old ? `<s>${fmt(p.old)}</s>` : ""}<strong>${fmt(p.price)}</strong></p>
            <button class="add-btn glass" type="button" data-add="${p.id}">${t("addToCart")}</button>
          </div>
        </div>
      </article>`;
  };

  // ------------------------------------------------------------
  // RENDER: sklep
  // ------------------------------------------------------------
  const productsGrid = $("#productsGrid");
  if (productsGrid && page === "shop") {
    productsGrid.innerHTML = PRODUCTS.map(cardHTML).join("");
    const brands = [...new Set(PRODUCTS.map((p) => p.brand))];
    $("#filters").insertAdjacentHTML(
      "beforeend",
      brands.map((b) => `<button class="filter" type="button" data-brand="${b}">${b}</button>`).join("")
    );
    $("#modelCount").textContent = pad(PRODUCTS.length);
  }

  // ------------------------------------------------------------
  // RENDER: karta produktu
  // ------------------------------------------------------------
  const product = page === "product" ? findProduct(params.get("id")) || PRODUCTS[0] : null;

  if (product) {
    document.title = `${product.name} — Prism`;
    $("#crumbBrand").textContent = product.brand;
    $("#crumbName").textContent = product.name;
    $("#pdpBrand").textContent = product.brand;
    $("#pdpTitle").textContent = product.name;
    $("#pdpTagline").textContent = product.tagline;
    $("#viewerWord").textContent = product.brand;
    $("#pdpPhoneName").textContent = product.name;

    $("#swatches").innerHTML = product.colors
      .map((c, i) => `<button class="swatch" type="button" style="--c:${c.hex}" aria-label="${c.name}" aria-pressed="${i === 0}" data-i="${i}"></button>`)
      .join("");

    $("#storage").insertAdjacentHTML(
      "beforeend",
      product.storage
        .map((gb, i) => `<button type="button" aria-pressed="${i === 0}" data-i="${i}">${storageLabel(gb)}</button>`)
        .join("")
    );

    $("#specs").innerHTML = product.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    const others = PRODUCTS.filter((p) => p !== product);
    const start = PRODUCTS.indexOf(product) % others.length;
    const related = [0, 1, 2].map((k) => others[(start + k) % others.length]);
    $("#relatedGrid").innerHTML = related.map(cardHTML).join("");
  }

  // ------------------------------------------------------------
  // RENDER: pierścień modeli na stronie głównej
  // ------------------------------------------------------------
  const ring = $("#ring");
  if (ring) {
    ring.style.setProperty("--step", `${360 / PRODUCTS.length}deg`);
    ring.innerHTML = PRODUCTS.map(
      (p, i) => `<div class="ring-item" style="--i:${i}" data-id="${p.id}"><div class="p-phone" style="--screen:${p.screen}"></div></div>`
    ).join("");
  }

  // ------------------------------------------------------------
  // Bryły telefonów 3D
  // ------------------------------------------------------------
  const heroPhone = $("#heroPhone");
  if (heroPhone) buildPhone(heroPhone, { body: "#4a4560" });

  const storyPhone = $("#storyPhone");
  if (storyPhone) buildPhone(storyPhone, { body: "#c9b39a" });

  const pdpPhone = $("#pdpPhone");
  if (pdpPhone && product) buildPhone(pdpPhone, { body: product.colors[0].hex, screen: product.screen });

  // ------------------------------------------------------------
  // Nagłówki rozbite na słowa (wjeżdżają spod maski)
  // ------------------------------------------------------------
  const splitWords = (el) => {
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const outer = document.createElement("span");
            outer.className = "sw";
            const inner = document.createElement("span");
            inner.className = "sw-i";
            inner.style.setProperty("--wd", n++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  };

  $$("[data-split]").forEach((el) => {
    splitWords(el);
    el.classList.add("split");
  });

  // ------------------------------------------------------------
  // Nagłówek — stan po przewinięciu, chowanie przy zjeździe
  // ------------------------------------------------------------
  const header = $("#siteHeader");
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 24);
    if (!header.classList.contains("nav-open")) {
      header.classList.toggle("hide", y > 500 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove("hide");
    }
    lastY = y;
  };
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
  // Toast
  // ------------------------------------------------------------
  const toast = $("#toast");
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  };

  // ------------------------------------------------------------
  // Koszyk — zapisywany w localStorage, wspólny dla podstron
  // ------------------------------------------------------------
  const CART_KEY = "prism-cart-v1";
  const cartCount = $("#cartCount");
  const drawerItems = $("#drawerItems");
  const drawerTotal = $("#drawerTotal");
  const drawerQty = $("#drawerQty");

  const loadCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(raw) ? raw.filter((it) => findProduct(it.id)) : [];
    } catch {
      return [];
    }
  };

  let cart = loadCart();

  const saveCart = () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* tryb prywatny — koszyk działa do odświeżenia */
    }
  };

  const renderCart = (bump = false) => {
    const qty = cart.reduce((n, it) => n + it.qty, 0);
    cartCount.textContent = qty;
    cartCount.hidden = qty === 0;
    if (bump) {
      cartCount.classList.remove("pop");
      void cartCount.offsetWidth; // restart animacji
      cartCount.classList.add("pop");
    }
    drawerQty.textContent = qty ? `(${qty})` : "";

    if (!cart.length) {
      drawerItems.innerHTML = `
        <div class="drawer-empty"><div>
          <p>${t("cartEmpty1")}</p>
          <p>${t("cartEmpty2")}</p>
        </div></div>`;
      drawerTotal.textContent = fmt(0);
      return;
    }

    let total = 0;
    drawerItems.innerHTML = cart
      .map((it, i) => {
        const p = findProduct(it.id);
        const line = priceOf(p, it.s) * it.qty;
        total += line;
        return `
          <div class="drawer-item">
            <div class="drawer-thumb" style="--body:${p.colors[it.c].hex};--screen:${p.screen}"><i></i></div>
            <div>
              <h3>${p.name}</h3>
              <p>${p.colors[it.c].name} · ${storageLabel(p.storage[it.s])}</p>
              <div class="qty">
                <button type="button" data-qty="-1" data-i="${i}" aria-label="${t("less")}">−</button>
                <span>${it.qty}</span>
                <button type="button" data-qty="1" data-i="${i}" aria-label="${t("more")}">+</button>
              </div>
            </div>
            <div class="drawer-price">${fmt(line)}<button type="button" data-remove="${i}">${t("remove")}</button></div>
          </div>`;
      })
      .join("");
    drawerTotal.textContent = fmt(total);
  };

  const addToCart = (id, c = 0, s = 0) => {
    const found = cart.find((it) => it.id === id && it.c === c && it.s === s);
    if (found) found.qty++;
    else cart.push({ id, c, s, qty: 1 });
    saveCart();
    renderCart(true);
    showToast(t("addedToast", { name: findProduct(id).name }));
  };

  drawerItems.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const i = Number(btn.dataset.i ?? btn.dataset.remove);
    if (btn.dataset.qty) {
      cart[i].qty += Number(btn.dataset.qty);
      if (cart[i].qty < 1) cart.splice(i, 1);
    } else if (btn.dataset.remove !== undefined) {
      cart.splice(i, 1);
    }
    saveCart();
    renderCart();
  });

  const openDrawer = () => {
    document.body.classList.add("drawer-open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#drawerClose").focus({ preventScroll: true });
  };

  const closeDrawer = () => {
    document.body.classList.remove("drawer-open");
    $("#drawer").setAttribute("aria-hidden", "true");
  };

  $("#cartBtn").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

  $("#checkoutBtn").addEventListener("click", () =>
    showToast(t(cart.length ? "checkoutDemo" : "checkoutEmpty"))
  );

  // szybkie dodanie z karty: pierwszy kolor, najmniejsza pamięć
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    addToCart(btn.dataset.add);
    const original = btn.textContent;
    btn.textContent = t("added");
    btn.classList.add("added");
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("added");
      btn.disabled = false;
    }, 1600);
  });

  renderCart();

  // ------------------------------------------------------------
  // Przejścia między podstronami — kurtyna
  // ------------------------------------------------------------
  const navigate = (url) => {
    if (reducedMotion) {
      location.href = url;
      return;
    }
    document.documentElement.classList.add("is-leaving");
    setTimeout(() => (location.href = url), 620);
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // kotwice na tej samej stronie
    e.preventDefault();
    navigate(url.href);
  });

  // ------------------------------------------------------------
  // Przełącznik PL / EN — zapis wyboru i przeładowanie przez kurtynę
  // (tłumaczenie musi zadziałać przed rozbiciem nagłówków na słowa)
  // ------------------------------------------------------------
  const langSwitch = $("#langSwitch");
  langSwitch.dataset.active = LANG;
  langSwitch.addEventListener("click", () => {
    const next = LANG === "pl" ? "en" : "pl";
    const url = new URL(location.href);
    url.searchParams.delete("lang");
    try {
      localStorage.setItem("prism-lang", next);
    } catch {
      url.searchParams.set("lang", next); // bez localStorage język niesie adres
    }
    navigate(url.href);
  });

  // powrót przyciskiem „wstecz” z bfcache — zdejmij kurtynę
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) document.documentElement.classList.remove("is-leaving");
  });

  // ------------------------------------------------------------
  // Wyszukiwarka — na stronie sklepu filtruje na żywo,
  // na pozostałych Enter przenosi do sklepu z zapytaniem
  // ------------------------------------------------------------
  const searchInput = $("#searchInput");

  if (page !== "shop") {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = searchInput.value.trim();
      navigate(`sklep.html${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    });
  }

  if (page === "shop") {
    const cards = $$(".product-card", productsGrid);
    const searchInfo = $("#searchInfo");
    const emptyState = $("#emptyState");
    const emptyQuery = $("#emptyQuery");
    const filters = $("#filters");
    const filterBlob = $(".filter-blob", filters);
    let brand = "all";

    const modelWord = (n) => {
      if (n === 1) return "model";
      if (LANG === "en") return "models";
      const d = n % 10, h = n % 100;
      return d >= 2 && d <= 4 && (h < 12 || h > 14) ? "modele" : "modeli";
    };

    const applyFilter = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const haystack = card.dataset.search + " " + card.textContent.toLowerCase();
        const match = (!query || haystack.includes(query)) && (brand === "all" || card.dataset.brand === brand);
        card.classList.toggle("hidden", !match);
        if (match) visible++;
      });

      searchInfo.textContent = query || brand !== "all"
        ? t("found", { n: visible, word: modelWord(visible) })
        : t("inStock", { n: cards.length, word: modelWord(cards.length) });
      emptyQuery.textContent = searchInput.value.trim() || brand;
      emptyState.hidden = visible > 0;
    };

    const moveFilterBlob = (btn) => {
      filterBlob.style.left = `${btn.offsetLeft}px`;
      filterBlob.style.width = `${btn.offsetWidth}px`;
    };

    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      $$(".filter", filters).forEach((f) => f.classList.toggle("active", f === btn));
      brand = btn.dataset.brand;
      moveFilterBlob(btn);
      applyFilter();
    });

    const placeBlob = () => moveFilterBlob($(".filter.active", filters));
    placeBlob();
    document.fonts?.ready.then(placeBlob);
    window.addEventListener("resize", placeBlob);

    $("#sortSelect").addEventListener("change", (e) => {
      const mode = e.target.value;
      const sorted = [...cards].sort((a, b) => {
        if (mode === "asc") return a.dataset.price - b.dataset.price;
        if (mode === "desc") return b.dataset.price - a.dataset.price;
        return PRODUCTS.findIndex((p) => p.id === a.dataset.id) - PRODUCTS.findIndex((p) => p.id === b.dataset.id);
      });
      sorted.forEach((c) => productsGrid.appendChild(c));
    });

    searchInput.addEventListener("input", applyFilter);

    $("#clearSearch").addEventListener("click", () => {
      searchInput.value = "";
      $(".filter[data-brand='all']", filters).click();
      searchInput.focus();
    });

    if (params.get("q")) searchInput.value = params.get("q");
    applyFilter();
  }

  // ------------------------------------------------------------
  // Odliczanie promocji (kończy się za 3 dni o 23:59)
  // ------------------------------------------------------------
  if ($("#cd-days")) {
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(23, 59, 59, 999);

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
  }

  // ------------------------------------------------------------
  // Zegar i data na ekranach telefonów
  // ------------------------------------------------------------
  const updateScreens = () => {
    const now = new Date();
    $$(".js-clock").forEach((el) => {
      el.textContent = now.toLocaleTimeString(STR.locale, { hour: "numeric", minute: "2-digit" });
    });
    $$(".js-date").forEach((el) => {
      el.textContent = now.toLocaleDateString(STR.locale, { weekday: "long", day: "numeric", month: "long" });
    });
  };

  updateScreens();
  setInterval(updateScreens, 30_000);

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

  $$(".reveal, .split").forEach((el) => revealObserver.observe(el));

  // ------------------------------------------------------------
  // Delikatny efekt 3D na kartach produktów (tylko mysz)
  // ------------------------------------------------------------
  if (finePointer && !reducedMotion) {
    $$(".product-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
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

  // kursor-kropla tylko dla myszy
  const cursorLens = $("#cursorLens");
  if (cursorLens && (!finePointer || reducedMotion)) cursorLens.remove();

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
  // Lepka kapsuła przelewająca się między linkami nawigacji;
  // gdy kursor odejdzie, wraca na link bieżącej podstrony
  // ------------------------------------------------------------
  const mainNavEl = $("#mainNav");
  const navList = $("#mainNav ul");
  const navBlob = document.createElement("span");
  navBlob.className = "nav-blob";
  navList.appendChild(navBlob);
  const desktopNav = window.matchMedia("(min-width: 881px)");
  const activeLink = $("#mainNav a[aria-current='page']");

  const moveBlob = (link) => {
    navBlob.style.left = `${link.offsetLeft}px`;
    navBlob.style.width = `${link.offsetWidth}px`;
  };

  const placeInstantly = (link) => {
    navBlob.style.transition = "none";
    moveBlob(link);
    void navBlob.offsetWidth;
    navBlob.style.transition = "";
  };

  const restBlob = () => {
    if (activeLink && desktopNav.matches) {
      moveBlob(activeLink);
      mainNavEl.classList.add("blob-on");
    } else {
      mainNavEl.classList.remove("blob-on");
    }
  };

  $$("#mainNav a").forEach((link) =>
    link.addEventListener("pointerenter", () => {
      if (!desktopNav.matches) return;
      // pierwsze pojawienie: ustaw od razu, bez przelotu przez pasek
      if (!mainNavEl.classList.contains("blob-on")) placeInstantly(link);
      mainNavEl.classList.add("blob-on");
      moveBlob(link);
    })
  );

  navList.addEventListener("pointerleave", restBlob);
  if (activeLink) placeInstantly(activeLink);
  restBlob();
  document.fonts?.ready.then(() => activeLink && placeInstantly(activeLink));
  window.addEventListener("resize", restBlob);

  // ------------------------------------------------------------
  // Plusk wody w miejscu kliknięcia przycisku
  // ------------------------------------------------------------
  if (!reducedMotion) {
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".btn, .add-btn, .round-btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const drop = document.createElement("span");
      drop.className = "splash";
      drop.style.left = `${e.clientX - rect.left}px`;
      drop.style.top = `${e.clientY - rect.top}px`;
      btn.appendChild(drop);
      drop.addEventListener("animationend", () => drop.remove());
    });
  }

  // ------------------------------------------------------------
  // Newsletter (demo — bez wysyłki)
  // ------------------------------------------------------------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const newsletterForm = $("#newsletterForm");
  const newsletterEmail = $("#newsletterEmail");
  const newsletterMsg = $("#newsletterMsg");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();

    if (!EMAIL_RE.test(email)) {
      newsletterEmail.focus();
      showToast(t("badEmail"));
      return;
    }

    newsletterMsg.hidden = false;
    newsletterForm.reset();
    showToast(t("subscribed"));
  });

  // ------------------------------------------------------------
  // Śledzenie wskaźnika (wspólne dla scen 3D)
  // ------------------------------------------------------------
  const pointer = { x: 0, y: 0 }; // −0.5 … 0.5 względem okna
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    },
    { passive: true }
  );

  // postęp przewinięcia sekcji: 0 gdy jej góra dotyka góry okna,
  // 1 gdy jej dół dotyka dołu okna
  const sectionProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight));
  };

  // ------------------------------------------------------------
  // HERO — telefon podąża za kursorem i obraca się przy przewijaniu
  // ------------------------------------------------------------
  if (heroPhone) {
    const spin = makeSpinner(heroPhone, 0.07);
    const hero = $(".hero");
    spin.tick = () => {
      const scrolled = clamp(window.scrollY / hero.offsetHeight);
      const sway = reducedMotion ? 0 : Math.sin(performance.now() / 1800) * 6;
      spin.try = -16 + pointer.x * 34 + scrolled * 200 + sway;
      spin.trx = 6 - pointer.y * 16;
    };
  }

  // ------------------------------------------------------------
  // KOLEKCJA — pierścień 3D: przeciągnij, strzałki lub autoodtwarzanie
  // ------------------------------------------------------------
  if (ring) {
    const stage = $("#ringStage");
    const items = $$(".ring-item", ring);
    const n = items.length;
    const step = 360 / n;
    const info = $("#ringInfo");
    const count = $("#ringCount");
    let angle = 0;
    let target = 0;
    let current = -1;
    let drag = null;
    let lastInteraction = 0;

    const frontIndex = () => ((-Math.round(target / step) % n) + n) % n;

    const showInfo = () => {
      const i = frontIndex();
      if (i === current) return;
      current = i;
      const p = PRODUCTS[i];
      items.forEach((it, k) => it.classList.toggle("front", k === i));
      $(".r-text", info).innerHTML = `
        <span class="r-brand">${p.brand}</span>
        <span class="r-name">${p.name}</span>
        <span class="r-price">${p.old ? `<s>${fmt(p.old)}</s> ` : ""}${fmt(p.price)}</span>`;
      $("a", info).href = `produkt.html?id=${p.id}`;
      count.innerHTML = `<b>${pad(i + 1)}</b> / ${pad(n)}`;
    };

    const frame = () => {
      angle = lerp(angle, target, 0.08);
      ring.style.setProperty("--a", `${angle.toFixed(2)}deg`);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    showInfo();

    const go = (dir) => {
      target = Math.round(target / step) * step - dir * step;
      lastInteraction = Date.now();
      showInfo();
    };

    $("#ringPrev").addEventListener("click", () => go(-1));
    $("#ringNext").addEventListener("click", () => go(1));

    stage.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, start: target, moved: false };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("dragging");
    });

    stage.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5) drag.moved = true;
      target = drag.start + dx * 0.3;
      showInfo();
    });

    const endDrag = (e) => {
      if (!drag) return;
      stage.classList.remove("dragging");
      target = Math.round(target / step) * step;
      lastInteraction = Date.now();
      showInfo();
      // krótkie kliknięcie w telefon z przodu otwiera jego kartę
      if (!drag.moved && e.type === "pointerup") {
        const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest(".ring-item.front");
        if (hit) navigate(`produkt.html?id=${hit.dataset.id}`);
      }
      drag = null;
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    let ringVisible = false;
    new IntersectionObserver(([e]) => (ringVisible = e.isIntersecting)).observe(stage);

    if (!reducedMotion) {
      setInterval(() => {
        if (ringVisible && !drag && Date.now() - lastInteraction > 5000) go(1);
      }, 3800);
    }
  }

  // ------------------------------------------------------------
  // OPOWIEŚĆ — przyklejony telefon obraca się z rozdziałami
  // ------------------------------------------------------------
  if (storyPhone) {
    const story = $(".story");
    const chapters = $$(".chapter", story);
    const screens = $$(".scr", storyPhone);
    const bars = $$(".story-progress i", story);
    const battery = $(".battery", storyPhone);
    const batteryLabel = $("#batteryLabel");
    const spin = makeSpinner(storyPhone, 0.09);
    const stacked = window.matchMedia("(max-width: 880px)");
    let active = -1;

    spin.tick = () => {
      if (stacked.matches) {
        spin.try = -18 + pointer.x * 30 + Math.sin(performance.now() / 2000) * 10;
        spin.trx = 4;
        return;
      }
      const p = sectionProgress(story);
      // 0 → przód, 0.5 → tył (aparat), 1 → znów przód pod kątem
      spin.try = -22 + p * 380 + pointer.x * 12;
      spin.trx = 6 - pointer.y * 10;

      const idx = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
      bars.forEach((b, k) => b.style.setProperty("--fill", clamp(p * chapters.length - k)));
      if (battery) {
        const charge = Math.round(clamp((p - 0.66) / 0.3) * 80 + 20);
        battery.style.setProperty("--charge", `${charge}%`);
        batteryLabel.textContent = `${charge}%`;
      }
      if (idx === active) return;
      active = idx;
      chapters.forEach((c, k) => {
        c.classList.toggle("active", k === idx);
        c.classList.toggle("past", k < idx);
      });
      screens.forEach((s) => s.classList.toggle("on", Number(s.dataset.ch) === idx));
    };
  }

  // ------------------------------------------------------------
  // GŁOSY — cytaty zmieniają się słowo po słowie
  // ------------------------------------------------------------
  const voices = $$(".voice");
  if (voices.length) {
    // bez JS widać pierwszy cytat; z JS wjeżdża dopiero, gdy sekcja pojawi się na ekranie
    voices.forEach((v) => {
      splitWords($("blockquote", v));
      v.classList.remove("active");
    });
    const counter = $("#voiceCount");
    let vi = 0;
    let paused = false;

    const showVoice = (next) => {
      const prev = voices[vi];
      vi = (next + voices.length) % voices.length;
      const cur = voices[vi];
      if (prev !== cur) prev.classList.remove("active");
      cur.classList.add("enter");
      void cur.offsetWidth;
      cur.classList.remove("enter");
      cur.classList.add("active");
      counter.textContent = `${pad(vi + 1)} / ${pad(voices.length)}`;
    };

    $("#voicePrev").addEventListener("click", () => showVoice(vi - 1));
    $("#voiceNext").addEventListener("click", () => showVoice(vi + 1));
    const wrap = $(".voice-wrap");
    wrap.addEventListener("pointerenter", () => (paused = true));
    wrap.addEventListener("pointerleave", () => (paused = false));

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !voices[vi].classList.contains("active")) showVoice(vi);
    }, { threshold: 0.3 }).observe(wrap);

    if (!reducedMotion) setInterval(() => !paused && voices[vi].classList.contains("active") && showVoice(vi + 1), 7000);
  }

  // ------------------------------------------------------------
  // KARTA PRODUKTU — obrót 360°, kolory, pamięć
  // ------------------------------------------------------------
  if (pdpPhone && product) {
    const viewer = $("#viewer");
    const angleLabel = $("#viewerAngle");
    const spin = makeSpinner(pdpPhone, 0.1);
    let userAngle = -24;
    let drag = null;
    let idleSince = 0;
    let colorIdx = 0;
    let storageIdx = 0;

    spin.tick = () => {
      if (!drag && !reducedMotion && Date.now() - idleSince > 2500) userAngle += 0.18;
      spin.try = userAngle;
      spin.trx = drag ? spin.trx : 4 - pointer.y * 8;
      const deg = Math.round(((spin.ry % 360) + 360) % 360);
      angleLabel.textContent = `${String(deg).padStart(3, "0")}°`;
    };

    viewer.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, a: userAngle, rx: spin.trx };
      viewer.setPointerCapture(e.pointerId);
      viewer.classList.add("dragging");
    });

    viewer.addEventListener("pointermove", (e) => {
      if (!drag) return;
      userAngle = drag.a + (e.clientX - drag.x) * 0.6;
      spin.trx = clamp(drag.rx - (e.clientY - drag.y) * 0.25, -30, 30);
    });

    const release = () => {
      drag = null;
      idleSince = Date.now();
      viewer.classList.remove("dragging");
    };
    viewer.addEventListener("pointerup", release);
    viewer.addEventListener("pointercancel", release);

    const colorName = $("#colorName");
    colorName.textContent = product.colors[0].name;

    $("#swatches").addEventListener("click", (e) => {
      const sw = e.target.closest(".swatch");
      if (!sw) return;
      colorIdx = Number(sw.dataset.i);
      $$(".swatch").forEach((s) => s.setAttribute("aria-pressed", String(s === sw)));
      colorName.textContent = product.colors[colorIdx].name;
      pdpPhone.style.setProperty("--body", product.colors[colorIdx].hex);
      // pokaż tył w nowym kolorze
      userAngle = Math.round((userAngle - 180) / 360) * 360 + 180;
      idleSince = Date.now();
    });

    const segmented = $("#storage");
    const segBlob = $(".seg-blob", segmented);
    const moveSeg = () => {
      const btn = $("button[aria-pressed='true']", segmented);
      segBlob.style.left = `${btn.offsetLeft}px`;
      segBlob.style.width = `${btn.offsetWidth}px`;
    };

    const priceEl = $("#pdpPrice");
    const oldEl = $("#pdpOld");
    const monthly = $("#pdpMonthly");
    const updatePrice = () => {
      const price = priceOf(product, storageIdx);
      priceEl.textContent = fmt(price);
      oldEl.textContent = product.old ? fmt(product.old + storageIdx * STORAGE_STEP) : "";
      monthly.innerHTML = t("monthly", { price: fmt(Math.ceil(price / 20)) });
    };

    segmented.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      storageIdx = Number(btn.dataset.i);
      $$("button", segmented).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      moveSeg();
      updatePrice();
    });

    moveSeg();
    document.fonts?.ready.then(moveSeg);
    window.addEventListener("resize", moveSeg);
    updatePrice();

    $("#pdpAdd").addEventListener("click", () => addToCart(product.id, colorIdx, storageIdx));
    $("#pdpInstallments").addEventListener("click", () =>
      showToast(t("instToast", { price: fmt(Math.ceil(priceOf(product, storageIdx) / 20)) }))
    );
  }

  // ------------------------------------------------------------
  // MANIFEST — tekst zapalany przewijaniem, liczniki, oś czasu
  // ------------------------------------------------------------
  const scrub = $("[data-scrub]");
  if (scrub) {
    const words = [];
    const walk = (node, acc) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
            const w = document.createElement("span");
            w.className = acc ? "wd acc" : "wd";
            w.textContent = part;
            words.push(w);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child, acc || child.tagName === "EM");
        }
      });
    };
    walk(scrub, false);

    const sec = scrub.closest("section");
    const update = () => {
      const r = sec.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.75 - r.top) / (r.height * 0.85));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  const counters = $$("[data-count]");
  if (counters.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const el = entry.target;
        const end = Number(el.dataset.count);
        const dec = Number(el.dataset.dec || 0);
        const suffix = el.dataset.suffix || "";
        const t0 = performance.now();
        const dur = reducedMotion ? 1 : 1800;
        const step = (now) => {
          const k = clamp((now - t0) / dur);
          const v = end * (1 - Math.pow(1 - k, 4));
          const txt = dec ? v.toFixed(dec).replace(".", LANG === "en" ? "." : ",") : group(Math.round(v));
          el.textContent = txt + suffix;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => io.observe(c));
  }

  // przeciąganie osi czasu myszą
  const track = $(".tl-track");
  if (track && finePointer) {
    let d = null;
    track.addEventListener("pointerdown", (e) => {
      d = { x: e.clientX, left: track.scrollLeft };
      track.classList.add("dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (d) track.scrollLeft = d.left - (e.clientX - d.x);
    });
    window.addEventListener("pointerup", () => {
      d = null;
      track.classList.remove("dragging");
    });
  }

  // tafle szkła w hero manifestu lekko odpływają od kursora
  const panes = $(".panes");
  if (panes && finePointer && !reducedMotion) {
    let px = 0, py = 0;
    const loop = () => {
      px = lerp(px, pointer.x * -40, 0.05);
      py = lerp(py, pointer.y * -30, 0.05);
      panes.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------
  // KONTAKT — status salonu na żywo, formularz
  // ------------------------------------------------------------
  const statusPill = $("#statusPill");
  if (statusPill) {
    // [otwarcie, zamknięcie] w godzinach; indeks = getDay() (0 = niedziela)
    const HOURS = [null, [10, 19], [10, 19], [10, 19], [10, 19], [10, 19], [10, 15]];
    const statusText = $("#statusText");
    const statusTime = $("#statusTime");

    const nextOpening = (now) => {
      for (let k = 0; k < 8; k++) {
        const day = (now.getDay() + k) % 7;
        const h = HOURS[day];
        if (!h) continue;
        if (k === 0 && now.getHours() >= h[0]) continue;
        return `${k === 0 ? t("today") : k === 1 ? t("tomorrow") : STR.days[day]} ${t("at")} ${h[0]}:00`;
      }
      return t("soon");
    };

    const updateStatus = () => {
      const now = new Date();
      const h = HOURS[now.getDay()];
      const hour = now.getHours() + now.getMinutes() / 60;
      const open = h && hour >= h[0] && hour < h[1];
      statusPill.classList.toggle("closed", !open);
      statusText.textContent = open ? t("open", { h: h[1] }) : t("closed", { when: nextOpening(now) });
      statusTime.textContent = now.toLocaleTimeString(STR.locale, { hour: "2-digit", minute: "2-digit" });
    };

    updateStatus();
    setInterval(updateStatus, 30_000);
    $$(".hours [data-day]").forEach((row) =>
      row.classList.toggle("today", Number(row.dataset.day) === new Date().getDay())
    );
  }

  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[required]", contactForm).forEach((input) => {
        const bad = input.type === "email" ? !EMAIL_RE.test(input.value.trim()) : !input.value.trim();
        input.closest(".field").classList.toggle("invalid", bad);
        if (bad && ok) {
          input.focus();
          ok = false;
        }
      });
      if (!ok) {
        showToast(t("fillFields"));
        return;
      }
      contactForm.reset();
      showToast(t("sent"));
    });

    contactForm.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));
  }

  // ------------------------------------------------------------
  // Kursor-kropla: ciekłe szkło sunące za wskaźnikiem
  // ------------------------------------------------------------
  if (cursorLens && cursorLens.isConnected) {
    let cx = -200, cy = -200, tx = -200, ty = -200;
    let shown = false;

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        cx = tx;
        cy = ty;
        shown = true;
      }
      const over = e.target.closest("a, button, select, label, summary, .ring-stage, .viewer");
      const typing = e.target.closest("input, textarea");
      cursorLens.style.scale = typing ? "0" : over ? "1.45" : "1";
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () => (cursorLens.style.scale = "0"));

    const follow = () => {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      cursorLens.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }
})();
