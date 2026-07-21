/* ===== INITIALIZATION ===== */
const params = new URLSearchParams(window.location.search);
const targetProductId = params.get("product_id");

const skeletonWrap = document.getElementById("skeleton-wrap");
const kebsosContent = document.getElementById("kebsos-content");

if (!targetProductId) {
  alert("Link tidak valid! product_id tidak ditemukan.");
  window.location.href = "kebutuhan-medsos.html";
}

/* ===== FETCH DATA DARI TAB KEBSOS_PREVIEW ===== */
fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/KEBSOS_PREVIEW")
  .then(res => {
    if (!res.ok) throw new Error("Gagal mengambil data produk");
    return res.json();
  })
  .then(rows => {
    /* ====================================================================
       LOGIKA FORWARD-FILL: Mengisi sel kosong jika di sheet hanya ditulis 
       di baris pertama untuk product_id, title, subtitle, image_url & category
       ==================================================================== */
    let currentProductId = "";
    let currentTitle = "";
    let currentSubtitle = "";
    let currentImageUrl = "";
    let currentCategory = "";

    const parsedData = rows.map(r => {
      if (r.product_id && r.product_id.trim() !== "") currentProductId = r.product_id.trim();
      if (r.title && r.title.trim() !== "") currentTitle = r.title.trim();
      if (r.subtitle && r.subtitle.trim() !== "") currentSubtitle = r.subtitle.trim();
      if (r.image_url && r.image_url.trim() !== "") currentImageUrl = r.image_url.trim();
      if (r.category && r.category.trim() !== "") currentCategory = r.category.trim();

      return {
        ...r,
        product_id: currentProductId,
        title: currentTitle,
        subtitle: currentSubtitle,
        image_url: currentImageUrl,
        category: currentCategory
      };
    });

    // Filter produk yang sesuai dengan parameter URL (misal: "instagram")
    const filteredProducts = parsedData.filter(
      item => item.product_id.toLowerCase() === targetProductId.toLowerCase()
    );

    if (!filteredProducts.length) {
      alert("Produk tidak ditemukan!");
      window.location.href = "kebutuhan-medsos.html";
      return;
    }

    renderPage(filteredProducts);
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Terjadi kesalahan saat memuat data.");
  });

/* ===== RENDER PAGE CONTENT ===== */
function renderPage(items) {
  // Sembunyikan Skeleton & Tampilkan Konten
  if (skeletonWrap) skeletonWrap.style.display = "none";
  if (kebsosContent) kebsosContent.style.display = "flex";

  const primaryItem = items[0];

  // Render Card 1 (Info Header)
  document.getElementById("kebsos-image").src = primaryItem.image_url;
  document.getElementById("kebsos-title").textContent = primaryItem.title;
  document.getElementById("kebsos-subtitle").textContent = primaryItem.subtitle;

  // Dapatkan daftar kategori unik (e.g. FOLLOWERS, LIKE, VIEW, INSIGHT)
  const uniqueCategories = [...new Set(items.map(i => i.category))].filter(Boolean);

  renderCategoryButtons(uniqueCategories, items);
}

/* ===== RENDER CTA CATEGORY BUTTONS ===== */
function renderCategoryButtons(categories, allItems) {
  const ctaWrap = document.getElementById("category-cta-wrap");
  if (!ctaWrap) return;

  ctaWrap.innerHTML = "";

  categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = `cta-cat-btn ${index === 0 ? "active" : ""}`;
    btn.textContent = cat;

    btn.addEventListener("click", function () {
      document.querySelectorAll(".cta-cat-btn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      renderPackageList(cat, allItems);
    });

    ctaWrap.appendChild(btn);
  });

  // Default tampilkan list dari kategori pertama
  if (categories.length > 0) {
    renderPackageList(categories[0], allItems);
  }
}

/* ===== RENDER PACKAGE LIST DALAM SCROLL BOX ===== */
function renderPackageList(selectedCategory, allItems) {
  const scrollBox = document.getElementById("package-scroll-box");
  if (!scrollBox) return;

  const filteredPackages = allItems.filter(i => i.category === selectedCategory);

  scrollBox.innerHTML = filteredPackages.map(pkg => {
    const price = Number(String(pkg.price).replace(/[^\d]/g, "")) || 0;
    const finalPrice = Number(String(pkg.final_price).replace(/[^\d]/g, "")) || 0;

    let priceHTML = `
      <div class="pkg-price-wrap">
        <span class="pkg-price-new">Rp${price.toLocaleString("id-ID")}</span>
      </div>
    `;

    // Jika ada harga diskon
    if (finalPrice > 0 && finalPrice < price) {
      const discountPercent = Math.round(((price - finalPrice) / price) * 100);
      priceHTML = `
        <div class="pkg-price-wrap">
          <span class="pkg-price-old">Rp${price.toLocaleString("id-ID")}</span>
          <span class="pkg-price-new">Rp${finalPrice.toLocaleString("id-ID")}</span>
          <span class="pkg-discount-badge">-${discountPercent}%</span>
        </div>
      `;
    }

    return `
      <a href="package.html?package_id=${pkg.package_id}" class="package-item-card">
        <span class="pkg-name">${pkg.package}</span>
        ${priceHTML}
      </a>
    `;
  }).join("");

  // Reset scroll ke atas saat kategori berganti
  scrollBox.scrollTop = 0;
}
