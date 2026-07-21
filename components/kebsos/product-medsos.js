/* ===== HELPER FUNCTIONS ===== */
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

/* ===== FETCH & RENDER DATA ===== */
fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PRODUCT_KEBSOS")
  .then(r => {
    if (!r.ok) throw new Error("Fetch data gagal");
    return r.json();
  })
  .then(data => {
    const wrap = document.getElementById("product-cards");
    if (!wrap) return;

    // Sortir data berdasarkan urutan card_order
    data.sort((a, b) => {
      const orderA = a.card_order !== undefined && a.card_order !== "" ? Number(a.card_order) : 999;
      const orderB = b.card_order !== undefined && b.card_order !== "" ? Number(b.card_order) : 999;
      return orderA - orderB;
    });

    let html = "";

    data.forEach(item => {
      let cardCls = "glass-card";
      let cardClickHandler = "";
      let cardTapeHTML = "";
      // CARI BAGIAN INI (sekitar baris 60 & 70):
let actionButtonHTML = `
  <a href="preview-kebsos.html?product_id=${item.product_id}" class="btn-detail">
    <i class="fa-solid fa-box-archive"></i> Detail produk...
  </a>
`;

      // Cek apakah status badgecard_status diisi untuk menonaktifkan card
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

      // Render data note jika tersedia di baris sheet
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

    /* ===== INTERSECTION OBSERVER (REVEAL ANIMATION) ===== */
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
  .catch(err => { console.error("Error mengambil database sheet:", err); });
