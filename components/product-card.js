/* ===== HELPER FUNCTIONS ===== */

function garBadge(i) {
  const noGar = String(i.no_gar).toLowerCase();
  const until = i.until_gar ? String(i.until_gar) : "";

  // Tidak ada garansi
  if (noGar === "yes") {
    return `<em class="badge-nogar">NoGar</em>`;
  }

  // Ada garansi
  if (noGar === "no") {
    // kalau ada durasi → pisah badge
    if (until) {
      return `
        <span class="badge-wrap">
          <em class="badge-gar">Bergaransi</em>
          <em class="badge-time">${until}</em>
        </span>
      `;
    }
    return `<em class="badge-gar">Bergaransi</em>`;
  }

  return "";
}

function isNoGar(i) {
  return String(i.no_gar).toLowerCase() === "yes";
}

function parseDiscount(promo) {
  if (!promo) return null;

  const normalized = promo.replace(",", ".");
  const m = normalized.match(/(\d+(?:\.\d+)?)\s*%/);

  return m ? parseFloat(m[1]) : null;
}

function formatPrice(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

function renderBadges(badgeText) {
  if (!badgeText) return "";

  return badgeText
    .split(":")
    .map(b => b.trim())
    .filter(Boolean)
    .map((label, i) => {
      const key = label.toLowerCase();
      let colorClass = "";
      
      if (key === "hot") colorClass = "badge-hot-red";
      else if (key === "new") colorClass = "badge-hot-green";
      else if (key === "promo") colorClass = "badge-hot-orange";

      return `
        <span class="badge-hot badge-line-${i} ${colorClass}">
          ${label}
        </span>
      `;
    })
    .join("");
}

/* ===== FETCH DATA ===== */
fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PRODUCT_PACKAGES")
  .then(r => {
    if (!r.ok) throw new Error("Fetch gagal");
    return r.json();
  })
  .then(rawData => {
    
    // ====================================================================
    // JEMBATAN KONVERSI: Mengubah final_price dari Sheets menjadi promo_text
    // ====================================================================
    const data = rawData.map(i => {
      // Bersihkan format harga (buang titik/Rp jika ada)
      const price = Number(String(i.price).replace(/[^\d]/g, "")) || 0;
      const finalPrice = Number(String(i.final_price).replace(/[^\d]/g, "")) || 0;

      // Jika ada harga final dan harganya lebih murah dari harga awal
      if (finalPrice > 0 && finalPrice < price) {
        // Hitung persentase diskonnya secara otomatis di latar belakang
        const discountPercent = ((price - finalPrice) / price) * 100;
        
        // Ubah jadi format string "22,23%" agar match dengan fungsi parseDiscount() bawaanmu
        const discountString = discountPercent.toFixed(2).replace(".", ",") + "%";
        
        return {
          ...i,
          promo_text: discountString // Kita injeksikan hasilnya ke promo_text otomatis
        };
      }
      return i;
    });
    // ====================================================================

    /* ===== GROUPING ===== */
    const grouped = {};

    data.forEach(p => {
      if (!grouped[p.product_id]) {
        grouped[p.product_id] = {
          title: p.title,
          items: []
        };
      }
      grouped[p.product_id].items.push(p);
    });

    console.log("DATA GROUPED:", grouped);
    window.PRODUCT_DATA = grouped;

    /* ===== RENDER CARDS ===== */
    const wrap = document.getElementById("product-cards") || document.getElementById("preview-card-grid");
    if (!wrap) return;

    let html = "";
    const products = Object.values(grouped);

    // 1. Urutkan kotak/card produk berdasarkan card_order dari Sheet
    products.sort((a, b) => {
      const itemA = a.items.find(i => i.card_order !== undefined && i.card_order !== "");
      const itemB = b.items.find(i => i.card_order !== undefined && i.card_order !== "");
      const orderA = itemA ? Number(itemA.card_order) : 999;
      const orderB = itemB ? Number(itemB.card_order) : 999;
      return orderA - orderB;
    });

    const renderProducts = window.HOMEPAGE_LIMIT ? products.slice(0, window.HOMEPAGE_LIMIT) : products;

    renderProducts.forEach(prod => {
      const items = prod.items;
      const primaryItem = items.find(i => i.image_url) || items[0];

      html += `
        <div class="glass-card">
          <div class="product-image">
            <img src="${primaryItem.image_url}" alt="${prod.title}">
            ${renderBadges(primaryItem.badge)}
          </div>

          <h3>${prod.title}</h3>

          ${(() => {
            const sortedItems = [...prod.items];
            
            // 2. Urutkan mainItems di dalam card berdasarkan product_order
            const mainItems = sortedItems
              .filter(i => i.group === "main")
              .sort((a, b) => (Number(a.product_order) || 999) - (Number(b.product_order) || 999));
              
            // 3. Urutkan detailItems di dalam card berdasarkan product_order
            const detailItems = sortedItems
              .filter(i => i.group === "detail")
              .sort((a, b) => (Number(a.product_order) || 999) - (Number(b.product_order) || 999));

            return `
              ${mainItems.map(i => {
                let cls = "package-row";
                const price = Number(String(i.price).replace(/[^\d]/g, "")) || 0;
                const discount = parseDiscount(i.promo_text);
                let priceHTML = `<b>${formatPrice(price)}</b>`;

                if (discount !== null) {
                  // Ambil langsung harga final asli dari sheet (bersihkan formatnya)
                  const sheetFinalPrice = Number(String(i.final_price).replace(/[^\d]/g, "")) || 0;
                  
                  // Jika di sheet ada harganya, pakai itu. Jika tidak, baru hitung pakai rumus persenan
                  const finalPrice = sheetFinalPrice > 0 ? sheetFinalPrice : Math.round(price - (price * discount / 100));

                  priceHTML = `
                    <span class="discount-badge">${discount}%</span>
                    <div class="price-wrap">
                      <span class="price-old">${formatPrice(price)}</span>
                      <span class="price-new">${formatPrice(finalPrice)}</span>
                    </div>
                  `;
                }

                if (i.is_featured) {
                  const [color, glow] = i.is_featured.split(":");
                  cls += ` featured featured-${color}`;
                  if (glow) cls += ` glow-${glow}`;
                }

                if (isNoGar(i)) {
                  cls += " nogar";
                }

                // KODE BARU (Sudah mendukung badge_label & badge_icon)
return `
  <a href="package.html?package_id=${i.package_id}" class="${cls}">
    <span>
      ${i.package} ${i.duration}
      ${i.badge_label 
        ? `<em class="role-badge">
             ${i.badge_icon ?? ""} ${i.badge_label}
             ${garBadge(i)}
           </em>`
        : garBadge(i)
      }
    </span>
    <div class="price-line promo-left">
      ${priceHTML}
    </div>
  </a>
`;

              }).join("")}

              ${detailItems.length ? `<button class="toggle-detail">Selengkapnya...</button>` : ``}

              <div class="package-detail">
                <div class="role-section">
                  <div class="role-title">Role Access</div>

                  ${detailItems.map(i => {
                    let cls = "package-row role";

                    if (i.is_featured && !isNoGar(i)) {
                      const [color, glow] = i.is_featured.split(":");
                      cls += ` featured featured-${color}`;
                      if (glow) cls += ` glow-${glow}`;
                    }

                    if (isNoGar(i)) {
                      cls += " nogar";
                    }

                    const price = Number(String(i.price).replace(/[^\d]/g, "")) || 0;
                    const discount = parseDiscount(i.promo_text);
                    let priceHTML = `<b>${formatPrice(price)}</b>`;

                    if (discount !== null) {
                      // Ambil langsung harga final asli dari sheet
                      const sheetFinalPrice = Number(String(i.final_price).replace(/[^\d]/g, "")) || 0;
                      const finalPrice = sheetFinalPrice > 0 ? sheetFinalPrice : Math.round(price - (price * discount / 100));

                      priceHTML = `
                        <div class="price-line promo-left">
                          <span class="discount-badge">${discount}%</span>
                          <div class="price-wrap">
                            <span class="price-old">${formatPrice(price)}</span>
                            <span class="price-new">${formatPrice(finalPrice)}</span>
                          </div>
                        </div>
                      `;
                    }

                    return `
                      <a href="package.html?package_id=${i.package_id}" class="${cls}" onclick="event.stopPropagation();">
                        <span>
                          ${i.package} ${i.duration}
                          ${i.badge_label 
                            ? `<em class="role-badge">
                                 ${i.badge_icon ?? ""} ${i.badge_label}
                                 ${garBadge(i)}
                               </em>`
                            : garBadge(i)
                          }
                        </span>
                        ${priceHTML}
                      </a>
                    `;
                  }).join("")}
                </div>
              </div>
            `;
          })()}

${(() => {
  const g = prod.items.find(i => i.guarantee)?.guarantee?.toLowerCase();
  if (!g) return "";

  if (g.includes("full")) {
    return `<div class="note has-guarantee"><i class="fa-solid fa-check"></i> Full Garansi</div>`;
  }
  if (g.includes("mixed")) {
    return `<div class="note mixed-guarantee"><i class="fa-solid fa-circle-half-stroke"></i> Mixed Garansi</div>`;
  }
  if (g.includes("tidak") || g.includes("no")) {
    return `<div class="note no-guarantee"><i class="fa-solid fa-xmark"></i> Tidak Bergaransi</div>`;
  }
  return "";
})()}
        </div>
      `;
    });
    
    wrap.innerHTML = html;

    /* ===== REVEAL SYSTEM ===== */
    const cards = document.querySelectorAll(".glass-card");
    cards.forEach((card, i) => {
      card.dataset.delay = (i % 4) + 1;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    });

    cards.forEach(card => observer.observe(card));
  })
  .catch(err => {
    console.error("Sheet error:", err);
  });

/* ===== EVENT LISTENERS ===== */
document.addEventListener("click", function(e) {
  const btn = e.target.closest(".toggle-detail");
  if (!btn) return;

  const card = btn.closest(".glass-card");
  const detail = card.querySelector(".package-detail");
  if (!detail) return;

  const isOpen = detail.classList.contains("open");

  /* tutup semua */
  document.querySelectorAll(".package-detail.open").forEach(d => {
    d.classList.remove("open");
  });

  document.querySelectorAll(".toggle-detail").forEach(b => {
    b.textContent = "Selengkapnya...";
  });

  /* buka kalau belum */
  if (!isOpen) {
    detail.classList.add("open");
    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    btn.textContent = "Tutup";
  }
});

document.documentElement.style.scrollBehavior = "smooth";

let scrollTimeout;
window.addEventListener("scroll", () => {
  document.body.classList.add("is-scrolling");
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove("is-scrolling");
  }, 120);
});
