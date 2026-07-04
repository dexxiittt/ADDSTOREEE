const sk = document.getElementById("skeleton-wrap");
const q = new URLSearchParams(location.search);
const packageId = q.get("package_id");

if(!packageId){
  console.error("package_id tidak ada di URL");
  alert("Link tidak valid");
  window.location.href = "index.html"; // halaman produk
}

function parseDiscount(val) {
  if (!val) return 0;

  return Number(
    String(val)
      .replace('%', '')
      .replace(',', '.')
      .trim()
  ) || 0;
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

document.getElementById("pay-btn")?.classList.add("is-loading");
fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL")
.then(r=>r.json())
.then(rows=>{

const data = rows.find(
  i => i.package_id === packageId
);

if(!data){
  console.error("Package tidak ditemukan:", packageId);
  return;
}

const paket = data.title;
const durasi = data.duration;

sk?.remove();

  // ===== APPLY PRICE & DISCOUNT COLOR FROM SHEET =====
const root = document.documentElement;

// warna harga
if (data.price_color) {
  root.style.setProperty('--price-color', data.price_color);
}

// warna / background + shadow badge diskon
if (data.discount_color) {
  const style = document.createElement("style");

  // ambil warna utama (fallback kalau gradient)
  let shadowColor = data.discount_color;

  if (shadowColor.includes("gradient")) {
    const match = shadowColor.match(/#([0-9a-fA-F]{6})/);
    if (match) shadowColor = match[0];
  }

  style.innerHTML = `
    :root {
      --discount-shadow: ${hexToRgba(shadowColor, 0.65)};
    }
    .discount-badge {
      background: ${data.discount_color} !important;
    }
  `;

  document.head.appendChild(style);
}

   // ===== APPLY TITLE & SUBTITLE GLOW FROM SHEET =====
if (data.color_title_subtitle) {

  const [titleColor, subtitleColor] = 
    data.color_title_subtitle.split("|").map(c => c.trim());

  const colorMap = {
    white: "#ffffff",
    blue: "#60a5fa",
    orange: "#fb923c",
    purple: "#a78bfa"
  };

  const root = document.documentElement;

  if (colorMap[titleColor.toLowerCase()]) {
    root.style.setProperty(
      "--title-glow",
      hexToRgba(colorMap[titleColor.toLowerCase()], 0.75)
    );
  }

  if (colorMap[subtitleColor.toLowerCase()]) {
    root.style.setProperty(
      "--subtitle-glow",
      hexToRgba(colorMap[subtitleColor.toLowerCase()], 0.45)
    );
  }
}
  
  document.getElementById("pay-btn")?.classList.remove("is-loading");
  document.getElementById("pkg-image").src = data.image_url;
 
  const titleEl = document.getElementById("pkg-title");

if (data.badge_icon) {

  const parts = data.badge_icon.split("|").map(s => s.trim());

  const icon = parts[0];
  const iconColor = parts[1];
  const iconIntensity = parseFloat(parts[2]);

  const colorMap = {
    white: "#ffffff",
    blue: "#60a5fa",
    orange: "#fb923c",
    purple: "#a78bfa",
    green: "#22c55e",
    red: "#ef4444",
    gold: "#fbbf24"
  };

  // default intensitas elegan (lebih soft dari title)
  let intensity = 0.6;

  if (!isNaN(iconIntensity)) {
    intensity = Math.min(Math.max(iconIntensity, 0.1), 1);
  }

  if (iconColor && colorMap[iconColor.toLowerCase()]) {
    document.documentElement.style.setProperty(
      "--badge-glow",
      hexToRgba(colorMap[iconColor.toLowerCase()], intensity)
    );
  }

  titleEl.innerHTML = `
    ${data.title}
    <span class="badge-icon">${icon}</span>
  `;

} else {
  titleEl.textContent = data.title;
}

  document.getElementById("pkg-subtitle").textContent = data.subtitle;
  document.getElementById("pkg-duration").textContent = data.duration;
 
  const guaranteeEl = document.getElementById("pkg-guarantee");

if (data.guarantee && data.guarantee.toLowerCase() === "nogar") {
  guaranteeEl.innerHTML = `
    <span class="guarantee-badge">NoGar</span>
  `;
} else {
  guaranteeEl.textContent = data.guarantee;
}

  const trustWrap = document.getElementById("pkg-trust");

if (trustWrap && data.trust_points) {
  const points = data.trust_points.split("|").map(t => t.trim());
  const icons  = (data.trust_icons || "").split("|").map(i => i.trim());

  trustWrap.innerHTML = points.map((text, i) => {
    const icon = icons[i] || "✔";
    return `<span>${icon} ${text}</span>`;
  }).join("");

  trustWrap.querySelectorAll('span').forEach((el, i) => {
  el.style.setProperty('--i', i);
});
}
  
  // harga setelah diskon
const priceEl = document.getElementById("pkg-price");

const price = Number(data.price) || 0;
const discount = parseDiscount(data.discount);

const final = discount > 0
  ? Math.round(price - (price * discount / 100))
  : price;

const harga = final;

const stickyPay = document.getElementById("sticky-pay");
if (stickyPay) {
  stickyPay.href =
`opsi-pembayaran.html?package_id=${data.package_id}`
}

if (discount > 0) {
  priceEl.innerHTML = `
    <span style="
  font-size:12px;
  opacity:.6;
  text-decoration:line-through;
  margin-right:6px
">
      Rp${price.toLocaleString("id-ID")}
    </span>

    <span class="price-animate price-main">
      Rp${final.toLocaleString("id-ID")}
    </span>

    <span class="discount-badge">
  -${discount.toFixed(2).replace('.', ',')}%
    </span>
  `;
} else {
  priceEl.innerHTML = `
    <span class="price-animate" style="
      font-size:17px;
      font-weight:800;
    ">
      Rp${price.toLocaleString("id-ID")}
    </span>
  `;
}

  // ===== PRODUCT NOTE =====
const productNoteEl = document.getElementById("pkg-product-note");

if (data.not_product && productNoteEl) {

  const lines = data.not_product
    .split("|")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const feature = (data.is_featured || "").toLowerCase();

if (feature.includes("soft")) {
  productNoteEl.classList.add("soft-highlight");
}

if (feature.includes("glow")) {
  productNoteEl.classList.add("glow-highlight");
}

if (feature.includes("strong")) {
  productNoteEl.classList.add("premium-highlight");
}

  productNoteEl.innerHTML = `
    <div class="product-note-title">Informasi Paket</div>
    ${lines.map(line => `
      <div class="product-note-line">${line}</div>
    `).join("")}
  `;

} else {
  productNoteEl?.remove();
}
 
const noteEl = document.getElementById("pkg-note");

if (data.not_legal) {
  const lines = data.not_legal
  .split("|")
  .map(t => t.trim())
  .filter(t => t.length > 0); // ⬅️ ini penting

// render judul + baris
const firstLine = lines[0];
const restLines = lines.slice(1);

noteEl.innerHTML = `
  <div class="note-title">
  <span class="note-icon">ⓘ</span>Catatan Penting </div>
  <div class="note-line">${firstLine}</div>

  <div class="note-extra">
    ${restLines.map(line => `<div class="note-line">${line}</div>`).join("")}
  </div>
`;

  // kalau lebih dari 1 baris → collapse
  if (lines.length > 1) {
    noteEl.classList.add("collapsed");

    const toggle = document.createElement("button");
    toggle.className = "note-toggle";
    toggle.textContent = "Selengkapnya…";

    toggle.onclick = () => {
  const expanded = noteEl.classList.toggle("expanded");

  // reset animasi
  toggle.style.animation = "none";
  toggle.offsetHeight; // force reflow

  if (expanded) {
    noteEl.classList.remove("collapsed");
    toggle.textContent = "Tutup";
  } else {
    noteEl.classList.add("collapsed");
    toggle.textContent = "Selengkapnya…";
  }

        // trigger ulang animasi yg sama
  toggle.style.animation = "toggle-fade-in .35s ease forwards";
};

    noteEl.appendChild(toggle);
  }

} else {
  noteEl.remove();
}
  document.getElementById("pay-btn").href =
`opsi-pembayaran.html?package_id=${data.package_id}`
});

const mainCTA = document.getElementById("pay-btn");
const stickyCTA = document.getElementById("sticky-cta");

if (mainCTA && stickyCTA) {
  const obs = new IntersectionObserver(
    ([e]) => stickyCTA.style.opacity = e.isIntersecting ? "0" : "1",
    { threshold: 0.6 }
  );
  obs.observe(mainCTA);
}

const payBtn = document.getElementById("pay-btn");
const noteEl = document.getElementById("pkg-note");
const trustEl = document.getElementById("pkg-trust");

if (payBtn && noteEl) {
  payBtn.addEventListener("click", () => {
    // auto collapse not_legal
    noteEl.classList.remove("expanded");
    noteEl.classList.add("collapsed");

    // optional: collapse / hide trust
    if (trustEl) {
      trustEl.style.opacity = "0";
      trustEl.style.transform = "translateY(-6px)";
    }
  });
}
