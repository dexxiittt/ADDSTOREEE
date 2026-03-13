fetch("navbar.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("navbar-placeholder").innerHTML = data;

    const navbar = document.querySelector(".main-navbar");
    const toggle = document.getElementById("navToggle");
    const dropdown = document.getElementById("navDropdown");

    // TOGGLE
    toggle.addEventListener("click", function (e) {
  e.stopPropagation();
  dropdown.classList.toggle("open");
  toggle.classList.toggle("active"); // ← TAMBAHAN INI
});

    document.addEventListener("click", function (e) {
  if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
    dropdown.classList.remove("open");
    toggle.classList.remove("active"); // ← TAMBAHAN INI
  }
});

   // ===== ACTIVE LINK AUTO DETECT =====
const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-dropdown a").forEach(link => {
  const linkPage = link.getAttribute("href");

  if (linkPage === currentPage) {
    link.classList.add("active");
  }
});

    // SCROLL EFFECT
    window.addEventListener("scroll", function () {
      navbar.classList.toggle("scrolled", window.scrollY > 30);
    });
  });
