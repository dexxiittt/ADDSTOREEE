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

fetch(
  "https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL"
)

.then(response => response.json())

.then(rows => {

  const data = rows.find(
    item => item.package_id === packageId
  );

  if (!data) {

    console.error("Package tidak ditemukan.");

    alert("Paket tidak ditemukan.");

    return;

  }

  renderPackage(data);

})

.catch(error => {

  console.error("Gagal mengambil data package.", error);

  alert("Terjadi kesalahan saat memuat data.");

})

.finally(() => {

  payBtn?.classList.remove("is-loading");

});

/* =========================
   RENDER PACKAGE
========================= */

function renderPackage(data) {

  /* Hilangkan Skeleton */
  sk?.remove();

  /* Aktifkan kembali tombol */
  payBtn?.classList.remove("is-loading");

  /* Tema dari Spreadsheet */
  renderTheme(data);

  /* Informasi Produk */
  renderInfo(data);

  /* Harga • Durasi • Garansi */
  renderMeta(data);

  /* Trust Badge */
  renderTrust(data);

  /* Informasi Paket */
  renderProductNote(data);

  /* Catatan Penting */
  renderLegalNote(data);

  /* Tombol Pembayaran */
  renderButton(data);

  /* Sticky CTA */
  initStickyCTA();

}



/* =========================
   RENDER THEME
========================= */

function renderTheme(data) {

  const root = document.documentElement;

  /* Warna Harga */
  if (data.price_color) {
    root.style.setProperty(
      "--price-color",
      data.price_color
    );
  }

  /* Badge Diskon */
  if (data.discount_color) {

    document.documentElement.style.setProperty(
      "--discount-color",
      data.discount_color
    );

  }

}



/* =========================
   RENDER INFO
========================= */

function renderInfo(data){

  document
  .getElementById("pkg-image")
  .src = data.image_url;

  const title = document.getElementById("pkg-title");

  if(data.badge_icon){

    title.innerHTML = `
      ${data.title}
      <span class="badge-icon">
        ${data.badge_icon.split("|")[0]}
      </span>
    `;

  }else{

    title.textContent = data.title;

  }

  document
  .getElementById("pkg-subtitle")
  .textContent = data.subtitle;

}


/* =========================
   RENDER META
========================= */

function renderMeta(data){

  document
  .getElementById("pkg-duration")
  .textContent = data.duration;

  const guarantee =
  document.getElementById("pkg-guarantee");

  if(

    data.guarantee &&
    data.guarantee.toLowerCase()=="nogar"

  ){

    guarantee.innerHTML=
    `<span class="guarantee-badge">NoGar</span>`;

  }else{

    guarantee.textContent=data.guarantee;

  }

  const price = Number(data.price)||0;

  const discount =
  parseDiscount(data.discount);

  const finalPrice =
  discount>0
  ? Math.round(price-(price*discount/100))
  : price;

  const priceEl =
  document.getElementById("pkg-price");

  if(discount>0){

    priceEl.innerHTML=`

      <span style="
      text-decoration:line-through;
      opacity:.6;
      font-size:13px;
      ">

      ${formatRupiah(price)}

      </span>

      <span class="price-main">

      ${formatRupiah(finalPrice)}

      </span>

      <span class="discount-badge">

      -${discount}%

      </span>

    `;

  }else{

    priceEl.innerHTML=`

      <span class="price-main">

      ${formatRupiah(price)}

      </span>

    `;

  }

}


/* =========================
   RENDER TRUST
========================= */

function renderTrust(data){

  const wrap =
  document.getElementById("pkg-trust");

  if(
    !wrap ||
    !data.trust_points
  ) return;

  const points =
  data.trust_points
  .split("|")
  .map(i=>i.trim());

  const icons =
  (data.trust_icons||"")
  .split("|")
  .map(i=>i.trim());

  wrap.innerHTML =

  points.map((text,index)=>`

    <span>

      ${icons[index] || "✔"}

      ${text}

    </span>

  `).join("");

}



