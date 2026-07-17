/* =========================
   ELEMENT & URL
========================= */
const sk = document.getElementById("skeleton-wrap");
const params = new URLSearchParams(window.location.search);
const packageId = params.get("package_id");
const payBtn = document.getElementById("pay-btn");
const stickyPay = document.getElementById("sticky-pay");

/* =========================
   VALIDASI
========================= */
if (!packageId) {
  console.error("package_id tidak ditemukan.");
  alert("Link tidak valid.");
  window.location.href = "index.html";
}

/* =========================
   HELPER
========================= */
/* Parse diskon dari Spreadsheet */
function parseDiscount(value) {
  if (!value) return 0;
  return Number(
    String(value)
      .replace("%", "")
      .replace(",", ".")
      .trim()
  ) || 0;
}

/* Ubah HEX menjadi RGBA */
function hexToRgba(hex, alpha = 1) {
  if (!hex || !hex.startsWith("#")) return "";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* Format Rupiah */
function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
}

/* =========================
   LOAD PACKAGE
========================= */
payBtn?.classList.add("is-loading");

fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL")
  .then(response => response.json())
  .then(rows => {
    
    // Mengubah final_price menjadi discount secara otomatis
    const mappedRows = rows.map(item => {
      const price = Number(String(item.price).replace(/[^\d]/g, "")) || 0;
      const finalPrice = Number(String(item.final_price).replace(/[^\d]/g, "")) || 0;
      let discountStr = "0";

      if (finalPrice > 0 && finalPrice < price) {
        const pct = ((price - finalPrice) / price) * 100;
        discountStr = pct.toFixed(2); // Menghasilkan string "22.23"
      }

      return {
        ...item,
        discount: discountStr // Dioper sebagai properti 'discount' untuk sistem lama
      };
    });

    // Cari data dari hasil mappedRows, bukan dari rows langsung
    const data = mappedRows.find(item => item.package_id === packageId);
    if (!data) {
      console.error("Package tidak ditemukan.");
      alert("Paket tidak ditemukan.");
      return;
    }
    renderPackage(data);
  })
  .catch(error => {
    console.error(error);
    alert(error.message);
  })
  .finally(() => {
    payBtn?.classList.remove("is-loading");
  });

/* =========================
   RENDER PACKAGE
========================= */
function renderPackage(data) {
  console.log("1");
  sk?.remove();

  console.log("2");
  renderTheme(data);

  console.log("3");
  renderInfo(data);

  console.log("4");
  renderMeta(data);

  console.log("5");
  renderTrust(data);

  console.log("6");
  renderProductNote(data);

  console.log("7");
  renderLegalNote(data);

  console.log("8");
  renderButton(data);

  console.log("SELESAI");
}

/* =========================
   RENDER THEME
========================= */
function renderTheme(data) {
  const root = document.documentElement;

  /* Warna Harga */
  if (data.price_color) {
    root.style.setProperty("--price-color", data.price_color);
  }

  /* Warna Badge Diskon */
  if (data.discount_color) {
    root.style.setProperty("--discount-color", data.discount_color);
  }
     
  /* Warna Judul & Subtitle */
  if (data.color_title_subtitle) {
    const [titleColor, subtitleColor] = data.color_title_subtitle
      .split("|")
      .map(item => item.trim().toLowerCase());

    const colors = {
      white: "#ffffff",
      blue: "#60a5fa",
      orange: "#fb923c",
      purple: "#a78bfa",
      green: "#22c55e",
      red: "#ef4444",
      gold: "#fbbf24"
    };

    if (colors[titleColor]) {
      root.style.setProperty("--title-glow", hexToRgba(colors[titleColor], 0.75));
    }

    if (colors[subtitleColor]) {
      root.style.setProperty("--subtitle-glow", hexToRgba(colors[subtitleColor], 0.45));
    }
  }
}

/* =========================
   RENDER INFO
========================= */
function renderInfo(data) {
  document.getElementById("pkg-image").src = data.image_url;
  const title = document.getElementById("pkg-title");

  if (data.badge_icon) {
    const parts = data.badge_icon.split("|").map(item => item.trim());
    const icon = parts[0] || "";
    const color = (parts[1] || "").toLowerCase();
    const intensity = Number(parts[2]) || 0.55;

    const colors = {
      white: "#ffffff",
      blue: "#60a5fa",
      orange: "#fb923c",
      purple: "#a78bfa",
      green: "#22c55e",
      red: "#ef4444",
      gold: "#fbbf24"
    };

    if (colors[color]) {
      document.documentElement.style.setProperty("--badge-glow", hexToRgba(colors[color], intensity));
    }

    title.innerHTML = `
      ${data.title}
      <span class="badge-icon">
        ${icon}
      </span>
    `;
  } else {
    title.textContent = data.title;
  }

  document.getElementById("pkg-subtitle").textContent = data.subtitle;
}

/* =========================
   RENDER META
========================= */
function renderMeta(data) {
  document.getElementById("pkg-duration").textContent = data.duration;
  const guarantee = document.getElementById("pkg-guarantee");

  if (data.guarantee && data.guarantee.toLowerCase() == "nogar") {
    guarantee.innerHTML = `<span class="guarantee-badge">NoGar</span>`;
  } else {
    guarantee.textContent = data.guarantee;
  }

  const price = Number(data.price) || 0;
  const discount = parseDiscount(data.discount);
  const finalPrice = discount > 0 ? Math.round(price - (price * discount / 100)) : price;
  const priceEl = document.getElementById("pkg-price");

  if (discount > 0) {
    priceEl.innerHTML = `
      <span style="text-decoration:line-through; opacity:.6; font-size:13px;">
        ${formatRupiah(price)}
      </span>
      <span class="price-main">
        ${formatRupiah(finalPrice)}
      </span>
      <span class="discount-badge">
        -${discount}%
      </span>
    `;
  } else {
    priceEl.innerHTML = `
      <span class="price-main">
        ${formatRupiah(price)}
      </span>
    `;
  }
}

/* =========================
   RENDER TRUST
========================= */
function renderTrust(data) {
  const wrap = document.getElementById("pkg-trust");
  if (!wrap || !data.trust_points) return;

  const points = data.trust_points.split("|").map(i => i.trim());
  const icons = (data.trust_icons || "").split("|").map(i => i.trim());

  wrap.innerHTML = points.map((text, index) => `
    <span>
      ${icons[index] || "✔"}
      ${text}
    </span>
  `).join("");
}

/* =========================
   RENDER PRODUCT NOTE
========================= */
function renderProductNote(data) {
  const note = document.getElementById("pkg-product-note");
  if (!note) return;

  /* Tidak ada data */
  if (!data.not_product) {
    note.remove();
    return;
  }

  const items = data.not_product
    .split("|")
    .map(item => item.trim())
    .filter(item => item.length > 0);

  note.innerHTML = `
    <div class="product-note-title">Informasi Paket</div>
    ${items.map(item => `
      <div class="product-note-line">${item}</div>
    `).join("")}
  `;
}

/* =========================
   RENDER LEGAL NOTE
========================= */
function renderLegalNote(data) {
  const note = document.getElementById("pkg-note");
  if (!note) return;

  /* Tidak ada catatan */
  if (!data.not_legal) {
    note.remove();
    return;
  }

  const lines = data.not_legal
    .split("|")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const firstLine = lines[0] || "";
  const otherLines = lines.slice(1);

  note.innerHTML = `
    <div class="note-title">
      <span class="note-icon">ⓘ</span>
      Catatan Penting
    </div>
    <div class="note-line">
      ${firstLine}
    </div>
    <div class="note-extra">
      ${otherLines.map(line => `
        <div class="note-line">${line}</div>
      `).join("")}
    </div>
  `;

  /* Kalau hanya 1 baris, tidak perlu tombol */
  if (otherLines.length === 0) return;

  const button = document.createElement("button");
  button.className = "note-toggle";
  button.textContent = "Selengkapnya...";

  button.addEventListener("click", () => {
    const expanded = note.classList.toggle("expanded");
    button.textContent = expanded ? "Tutup" : "Selengkapnya...";
  });

  note.appendChild(button);
}

/* =========================
   RENDER BUTTON
========================= */
function renderButton(data) {
  const url = `opsi-pembayaran.html?package_id=${data.package_id}`;

  if (payBtn) {
    payBtn.href = url;
  }
  if (stickyPay) {
    stickyPay.href = url;
  }
}
