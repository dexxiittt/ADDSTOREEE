/* ===== HELPER FUNCTIONS ===== */
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

// Helper untuk animasi reveal kartu
function applyRevealAnimation(container) {
  const cards = container.querySelectorAll(".glass-card");
  cards.forEach((card, i) => { card.dataset.delay = (i % 4) + 1; });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(card => observer.observe(card));
}

/* ===== CACHE MEMORI SUPAYA SMOOTH BEBAS RELOAD ===== */
let cachedPremiumHTML = "";

/* ===== LOAD KEBUTUHAN MEDSOS CARDS ===== */
function loadMedsosCards() {
  const wrap = document.getElementById("preview-card-grid");
  if (!wrap) return;

  // Simpan HTML APK Premium bawaan sebelum diganti
  if (!cachedPremiumHTML && wrap.children.length > 0) {
    cachedPremiumHTML = wrap.innerHTML;
  }

  wrap.innerHTML = `<div style="text-align:center; padding: 40px; color: #888; grid-column: 1/-1;">Memuat data Kebutuhan Medsos...</div>`;

  fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PRODUCT_KEBSOS")
    .then(r => r.json())
    .then(data => {
      data.sort((a, b) => {
        const orderA = a.card_order !== undefined && a.card_order !== "" ? Number(a.card_order) : 999;
        const orderB = b.card_order !== undefined && b.card_order !== "" ? Number(b.card_order) : 999;
        return orderA - orderB;
      });

      const limit = window.HOMEPAGE_LIMIT || 4;
      const renderProducts = data.slice(0, limit);

      let html = "";
      renderProducts.forEach(item => {
        let cardCls = "glass-card";
        let cardClickHandler = "";
        let cardTapeHTML = "";
        let actionButtonHTML = `
          <a href="preview-kebsos.html?product_id=${item.product_id}" class="btn-detail">
            <i class="fa-solid fa-box-archive"></i> Detail produk...
          </a>
        `;

        if (item.badgecard_status && item.badgecard_status.trim() !== "") {
          const statusText = item.badgecard_status.trim();
          cardCls += " card-disabled";
          cardTapeHTML = `<div class="badge-card-tape"><span>${statusText}</span></div>`;
          cardClickHandler = `onclick="showDisabledToast(event, '${statusText.replace(/'/g, "\\'")}')"`;

          actionButtonHTML = `
            <a href="#" class="btn-detail" onclick="event.preventDefault();">
              <i class="fa-solid fa-box-archive"></i> Detail produk...
            </a>
          `;
        }

        let noteHTML = item.note && item.note.trim() !== "" ? `<p class="product-note">${item.note.trim()}</p>` : "";

        html += `
          <div class="${cardCls}" ${cardClickHandler}>
            ${cardTapeHTML}
            
            <div class="product-image">
              <img src="${item.image_url}" alt="${item.title}">
              ${renderBadges(item.badge)}
            </div>

            <h3>${item.title}</h3>
            ${noteHTML}
            
            ${actionButtonHTML}
          </div>
        `;
      });

      wrap.innerHTML = html;
      applyRevealAnimation(wrap);
    })
    .catch(err => {
      console.error("Error loading Medsos:", err);
      wrap.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444; grid-column: 1/-1;">Gagal memuat produk Medsos.</div>`;
    });
}

/* ===== LOAD APK PREMIUM (DARI CACHE MEMORI) ===== */
function loadPremiumCards() {
  const wrap = document.getElementById("preview-card-grid");
  if (!wrap) return;

  // Jika sudah ada di cache memori, langsung tampilkan tanpa re-fetch/reload!
  if (cachedPremiumHTML) {
    wrap.innerHTML = cachedPremiumHTML;
    applyRevealAnimation(wrap);
  }
}

/* ===== TAB SWITCHER LOGIC ===== */
function initPreviewCategory() {
  const tabs = document.querySelectorAll(".preview-tabs button");
  const previewTitle = document.querySelector(".preview-title");
  const previewBtn = document.querySelector(".preview-button");

  // Simpan HTML awal (APK Premium) saat pertama kali di-load
  setTimeout(() => {
    const wrap = document.getElementById("preview-card-grid");
    if (wrap && wrap.children.length > 0 && !cachedPremiumHTML) {
      cachedPremiumHTML = wrap.innerHTML;
    }
  }, 1000);

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const category = tab.dataset.category;

      if (category === "medsos") {
        if (previewTitle) previewTitle.textContent = "Kebutuhan Medsos Populer";
        if (previewBtn) {
          previewBtn.style.display = "flex"; // Tampilkan tombol untuk Medsos
          previewBtn.href = "kebutuhan-medsos.html";
          previewBtn.childNodes[0].nodeValue = "Lihat Semua Medsos ";
        }
        loadMedsosCards();

      } else if (category === "premium") {
        if (previewTitle) previewTitle.textContent = "Aplikasi Premium Populer";
        if (previewBtn) {
          previewBtn.style.display = "flex"; // Tampilkan tombol untuk APK Premium
          previewBtn.href = "semua-aplikasi.html";
          previewBtn.childNodes[0].nodeValue = "Lihat Semua Aplikasi ";
        }
        loadPremiumCards();

      } else if (category === "game") {
        if (previewTitle) previewTitle.textContent = "Topup Game Populer";
        if (previewBtn) {
          previewBtn.style.display = "none"; // SEMBUNYIKAN TOMBOL JIKA PRODUK KOSONG / SEGERA HADIR
        }
        const wrap = document.getElementById("preview-card-grid");
        if (wrap) {
          if (!cachedPremiumHTML && wrap.children.length > 0) {
            cachedPremiumHTML = wrap.innerHTML;
          }
          wrap.innerHTML = `<div style="text-align:center; padding: 40px; color: #888; grid-column: 1/-1;">Layanan Topup Game segera hadir!</div>`;
        }
      }
    };
  });
}
