/* ===== HELPER FUNCTIONS ===== */

// Fungsi untuk memunculkan Toast Premium dari bawah (Tetap dipertahankan)
function showDisabledToast(event, statusText) {
  event.preventDefault();
  event.stopPropagation();
  
  let toastContainer = document.getElementById('custom-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'custom-toast-container';
    document.body.appendChild(toastContainer);
  }
  
  toastContainer.innerHTML = `
    <div class="premium-toast animate-toast">
      <div class="toast-icon"><i class="fa-solid fa-xmark"></i></div>
      <span class="toast-text">Produk sedang tidak bisa diakses (${statusText})</span>
    </div>
  `;
  
  setTimeout(() => {
    const toast = toastContainer.querySelector('.premium-toast');
    if (toast) {
      toast.classList.add('fade-out');
      setTimeout(() => { toastContainer.innerHTML = ''; }, 400);
    }
  }, 3000);
}

function garBadge(i) {
  const noGar = String(i.no_gar).toLowerCase();
  const until = i.until_gar ? String(i.until_gar) : "";

  if (noGar === "yes") {
    return `<em class="badge-nogar">NoGar</em>`;
  }

  if (noGar === "no") {
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
    
    const data = rawData.map(i => {
      const price = Number(String(i.price).replace(/[^\d]/g, "")) || 0;
      const finalPrice = Number(String(i.final_price).replace(/[^\d]/g, "")) || 0;

      if (finalPrice > 0 && finalPrice < price) {
        const discountPercent = ((price - finalPrice) / price) * 100;
        const discountString = discountPercent.toFixed(2).replace(".", ",") + "%";
        
        return {
          ...i,
          promo_text: discountString
        };
      }
      return i;
    });

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

    window.PRODUCT_DATA = grouped;

    /* ===== RENDER CARDS ===== */
    const wrap = document.getElementById("product-cards") || document.getElementById("preview-card-grid");
    if (!wrap) return;

    let html = "";
    const products = Object.values(grouped);

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

      // ====================================================================
      // BARU: Cek status dari baris awal/item yang memiliki badgecard_status
      // ====================================================================
      let cardCls = "glass-card";
      let cardClickHandler = "";
      let cardTapeHTML = "";
      
      const targetStatus = items.find(i => i.badgecard_status && i.badgecard_status.trim() !== "");
      if (targetStatus) {
        const statusText = targetStatus.badgecard_status.trim();
        cardCls += " card-disabled";
        cardTapeHTML = `<div class="badge-card-tape"><span>${statusText}</span></div>`;
        cardClickHandler = `onclick="showDisabledToast(event, '${statusText.replace(/'/g, "\\'")}')"`;
      }
      // ====================================================================

      html += `
        <div class="${cardCls}" ${cardClickHandler}>
          ${cardTapeHTML}
          
          <div class="product-image">
            <img src="${primaryItem.image_url}" alt="${prod.title}">
            ${renderBadges(primaryItem.badge)}
          </div>

          <h3>${prod.title}</h3>

            ${(() => {
            const sortedItems = [...prod.items];
            
            const mainItems = sortedItems
              .filter(i => i.group === "main")
              .sort((a, b) => (Number(a.product_order) || 999) - (Number(b.product_order) || 999));
              
            const detailItems = sortedItems
              .filter(i => i.group === "detail")
              .sort((a, b) => (Number(a.product_order) || 999) - (Number(b.product_order) || 999));

            // Ambil hanya 1 paket pertama untuk ditampilkan awal
            const firstMainItem = mainItems[0] || detailItems[0];
            const hiddenMainItems = mainItems.slice(1);
            const hiddenDetailItems = mainItems[0] ? detailItems : detailItems.slice(1);
            const hasMore = hiddenMainItems.length > 0 || hiddenDetailItems.length > 0;

            // Helper function untuk render baris paket
            const renderPackageRow = (i, isDetailRow = false) => {
              let cls = isDetailRow ? "package-row role" : "package-row";
              const price = Number(String(i.price).replace(/[^\d]/g, "")) || 0;
              const discount = parseDiscount(i.promo_text);
              let priceHTML = `<b>${formatPrice(price)}</b>`;

              if (discount !== null) {
                const sheetFinalPrice = Number(String(i.final_price).replace(/[^\d]/g, "")) || 0;
                const finalPrice = sheetFinalPrice > 0 ? sheetFinalPrice : Math.round(price - (price * discount / 100));

                if (isDetailRow) {
                  priceHTML = `
                    <div class="price-line promo-left">
                      <span class="discount-badge">${discount}%</span>
                      <div class="price-wrap">
                        <span class="price-old">${formatPrice(price)}</span>
                        <span class="price-new">${formatPrice(finalPrice)}</span>
                      </div>
                    </div>
                  `;
                } else {
                  priceHTML = `
                    <span class="discount-badge">${discount}%</span>
                    <div class="price-wrap">
                      <span class="price-old">${formatPrice(price)}</span>
                      <span class="price-new">${formatPrice(finalPrice)}</span>
                    </div>
                  `;
                }
              }

              if (i.is_featured && (!isDetailRow || !isNoGar(i))) {
                const [color, glow] = i.is_featured.split(":");
                cls += ` featured featured-${color}`;
                if (glow) cls += ` glow-${glow}`;
              }

              if (isNoGar(i)) cls += " nogar";

              let badgeStatusHTML = "";
              if (i.badge_status) {
                const statusKey = String(i.badge_status).toLowerCase().trim();
                if (statusKey === "soldout" || statusKey === "sold out") {
                  cls += " soldout";
                  badgeStatusHTML = `<span class="badge-tape tape-blue">Sold Out</span>`;
                } else if (statusKey === "expired") {
                  cls += " expired";
                  badgeStatusHTML = `<span class="badge-tape tape-red">Expired</span>`;
                }
              }

              return `
                <a href="package.html?package_id=${i.package_id}" class="${cls}">
                  ${badgeStatusHTML}
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
                  ${isDetailRow ? priceHTML : `<div class="price-line promo-left">${priceHTML}</div>`}
                </a>
              `;
            };

            return `
              <div class="package-wrapper">
                <!-- Paket Pertama (Selalu Keluar) -->
                ${firstMainItem ? renderPackageRow(firstMainItem, false) : ''}
                
                <!-- Efek Fade Memudar ke Bawah -->
                ${hasMore ? `<div class="card-fade-overlay"></div>` : ''}

                <!-- Paket Sisa yang Tersembunyi -->
                <div class="package-detail">
                  <div>
                    ${hiddenMainItems.map(i => renderPackageRow(i, false)).join("")}

                    ${hiddenDetailItems.length ? `
                      <div class="role-section">
                        <div class="role-title">Role Access</div>
                        ${hiddenDetailItems.map(i => renderPackageRow(i, true)).join("")}
                      </div>
                    ` : ``}
                  </div>
                </div>
              </div>

              ${hasMore ? `<button class="toggle-detail">Selengkapnya...</button>` : ``}
            `;
          })()}

          ${(() => {
            const g = prod.items.find(i => i.guarantee)?.guarantee?.toLowerCase();
            if (!g) return "";
            if (g.includes("full")) return `<div class="note has-guarantee"><i class="fa-solid fa-check"></i> Full Garansi</div>`;
            if (g.includes("mixed")) return `<div class="note mixed-guarantee"><i class="fa-solid fa-circle-half-stroke"></i> Mixed Garansi</div>`;
            if (g.includes("tidak") || g.includes("no")) return `<div class="note no-guarantee"><i class="fa-solid fa-xmark"></i> Tidak Bergaransi</div>`;
            return "";
          })()}
        </div>
      `;
    });
    
    wrap.innerHTML = html;

    /* ===== REVEAL SYSTEM ===== */
    const cards = document.querySelectorAll(".glass-card");
    cards.forEach((card, i) => { card.dataset.delay = (i % 4) + 1; });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    cards.forEach(card => observer.observe(card));
  })
  .catch(err => { console.error("Sheet error:", err); });

/* ===== EVENT LISTENERS (CLICK CARD / TOGGLE) ===== */
document.addEventListener("click", function(e) {
  // 1. Jika yang diklik adalah link paket langsung (<a>), biarkan membuka halaman paket
  if (e.target.closest("a")) return;

  // 2. Ambil card terdekat
  const card = e.target.closest(".glass-card");
  if (!card || card.classList.contains("card-disabled")) return;

  const detail = card.querySelector(".package-detail");
  const btn = card.querySelector(".toggle-detail");
  if (!detail) return;

  const isOpen = detail.classList.contains("open");

  // 3. Tutup SEMUA card lain yang sedang terbuka (Efek Accordion)
  document.querySelectorAll(".glass-card").forEach(c => {
    if (c !== card) {
      c.classList.remove("is-expanded");
      const d = c.querySelector(".package-detail");
      const b = c.querySelector(".toggle-detail");
      if (d) d.classList.remove("open");
      if (b) b.textContent = "Selengkapnya...";
    }
  });

  // 4. Buka / Tutup Card yang diklik
  if (isOpen) {
    detail.classList.remove("open");
    card.classList.remove("is-expanded");
    if (btn) btn.textContent = "Selengkapnya...";
  } else {
    detail.classList.add("open");
    card.classList.add("is-expanded");
    if (btn) btn.textContent = "Tutup";
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

