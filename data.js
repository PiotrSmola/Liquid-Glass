// ============================================================
// PRISM — katalog modeli (wspólny dla wszystkich podstron)
// ============================================================

window.PRISM_PRODUCTS = [
  {
    id: "iphone-16-pro",
    brand: "Apple",
    name: "iPhone 16 Pro",
    tagline: "Tytan, który łapie światło pod każdym kątem.",
    price: 5999,
    old: 6499,
    badge: "Bestseller",
    screen: "linear-gradient(160deg,#312e81,#7c3aed 55%,#22d3ee)",
    colors: [
      { name: "Tytan pustynny", hex: "#c9b39a" },
      { name: "Tytan czarny", hex: "#3b3b41" },
      { name: "Tytan biały", hex: "#e8e5e0" },
      { name: "Tytan naturalny", hex: "#a39f97" },
    ],
    storage: [256, 512, 1024],
    specs: [
      ["Ekran", "6,3″ OLED · 120 Hz"],
      ["Procesor", "A18 Pro"],
      ["Aparat", "48 + 48 + 12 Mpx"],
      ["Bateria", "3582 mAh"],
      ["Waga", "199 g"],
    ],
  },
  {
    id: "galaxy-s25-ultra",
    brand: "Samsung",
    name: "Galaxy S25 Ultra",
    tagline: "Rysik, zoom 100× i ekran jak okno na świat.",
    price: 6299,
    badge: "Nowość",
    badgeType: "new",
    screen: "linear-gradient(160deg,#0f172a,#0ea5e9 60%,#a5f3fc)",
    colors: [
      { name: "Tytanowy szary", hex: "#6d6f73" },
      { name: "Tytanowy srebrny", hex: "#cfd3d8" },
      { name: "Tytanowy granat", hex: "#2b3550" },
    ],
    storage: [256, 512, 1024],
    specs: [
      ["Ekran", "6,9″ AMOLED · 120 Hz"],
      ["Procesor", "Snapdragon 8 Elite"],
      ["Aparat", "200 + 50 + 50 + 10 Mpx"],
      ["Bateria", "5000 mAh"],
      ["Waga", "218 g"],
    ],
  },
  {
    id: "pixel-9-pro",
    brand: "Google",
    name: "Pixel 9 Pro",
    tagline: "Zdjęcia, które wyglądają jak wspomnienia.",
    price: 4399,
    old: 4799,
    badge: "Promocja",
    badgeType: "sale",
    screen: "linear-gradient(160deg,#134e4a,#10b981 55%,#fde68a)",
    colors: [
      { name: "Porcelana", hex: "#ece6dc" },
      { name: "Obsydian", hex: "#2a2b2e" },
      { name: "Szałwia", hex: "#a7b8a0" },
      { name: "Różowy kwarc", hex: "#e8c4c4" },
    ],
    storage: [128, 256, 512],
    specs: [
      ["Ekran", "6,3″ OLED · 120 Hz"],
      ["Procesor", "Tensor G4"],
      ["Aparat", "50 + 48 + 48 Mpx"],
      ["Bateria", "4700 mAh"],
      ["Waga", "199 g"],
    ],
  },
  {
    id: "xiaomi-15",
    brand: "Xiaomi",
    name: "Xiaomi 15",
    tagline: "Kompaktowy, a z optyką Leica w środku.",
    price: 3799,
    screen: "linear-gradient(160deg,#3b0764,#d946ef 60%,#fbcfe8)",
    colors: [
      { name: "Czarny", hex: "#26262a" },
      { name: "Biały", hex: "#efefee" },
      { name: "Zielony", hex: "#8fa894" },
    ],
    storage: [256, 512],
    specs: [
      ["Ekran", "6,36″ AMOLED · 120 Hz"],
      ["Procesor", "Snapdragon 8 Elite"],
      ["Aparat", "50 + 50 + 50 Mpx"],
      ["Bateria", "5240 mAh"],
      ["Waga", "191 g"],
    ],
  },
  {
    id: "oneplus-13",
    brand: "OnePlus",
    name: "OnePlus 13",
    tagline: "Ładowanie szybsze niż poranna kawa.",
    price: 3999,
    screen: "linear-gradient(160deg,#7f1d1d,#f97316 60%,#fef3c7)",
    colors: [
      { name: "Północny ocean", hex: "#1f3350" },
      { name: "Czarny eclipse", hex: "#1d1d20" },
      { name: "Arktyczny świt", hex: "#e3e1ea" },
    ],
    storage: [256, 512],
    specs: [
      ["Ekran", "6,82″ AMOLED · 120 Hz"],
      ["Procesor", "Snapdragon 8 Elite"],
      ["Aparat", "50 + 50 + 50 Mpx"],
      ["Bateria", "6000 mAh"],
      ["Waga", "210 g"],
    ],
  },
  {
    id: "nothing-phone-3",
    brand: "Nothing",
    name: "Phone (3)",
    tagline: "Przezroczysty z natury. Glyph mówi za niego.",
    price: 2899,
    badge: "Hit ceny",
    badgeType: "sale",
    screen: "linear-gradient(160deg,#111827,#6b7280 55%,#e5e7eb)",
    colors: [
      { name: "Biały", hex: "#e4e4e2" },
      { name: "Czarny", hex: "#222225" },
    ],
    storage: [256, 512],
    specs: [
      ["Ekran", "6,7″ OLED · 120 Hz"],
      ["Procesor", "Snapdragon 8s Gen 4"],
      ["Aparat", "50 + 50 + 50 Mpx"],
      ["Bateria", "5150 mAh"],
      ["Waga", "218 g"],
    ],
  },
];

// Wersja angielska: tylko pola z tekstem (reszta jak w PL)
window.PRISM_PRODUCTS_EN = {
  "iphone-16-pro": {
    tagline: "Titanium that catches the light from every angle.",
    badge: "Bestseller",
    colors: ["Desert Titanium", "Black Titanium", "White Titanium", "Natural Titanium"],
  },
  "galaxy-s25-ultra": {
    tagline: "A stylus, 100× zoom and a screen like a window to the world.",
    badge: "New",
    colors: ["Titanium Gray", "Titanium Silver", "Titanium Navy"],
  },
  "pixel-9-pro": {
    tagline: "Photos that look like memories.",
    badge: "Sale",
    colors: ["Porcelain", "Obsidian", "Hazel", "Rose Quartz"],
  },
  "xiaomi-15": {
    tagline: "Compact, with Leica optics inside.",
    colors: ["Black", "White", "Green"],
  },
  "oneplus-13": {
    tagline: "Charges faster than your morning coffee.",
    colors: ["Midnight Ocean", "Black Eclipse", "Arctic Dawn"],
  },
  "nothing-phone-3": {
    tagline: "Transparent by nature. The Glyph speaks for it.",
    badge: "Price hit",
    colors: ["White", "Black"],
  },
};
