fetch("components/category-tabs.html")
  .then(res => res.text())
  .then(data => {

    const container =
      document.getElementById(
        "category-tabs-section"
      );

    if (!container) return;

    container.innerHTML = data;

    document.dispatchEvent(
  new Event("categoryTabsReady")
);

    // Fade observer
    container
      .querySelectorAll(".fade-sync")
      .forEach(el => {
        fadeSyncObserver.observe(el);
      });

    // Tab handler
    container
      .querySelectorAll(".tab")
      .forEach(btn => {

        btn.addEventListener("click", () => {

          container
            .querySelectorAll(".tab")
            .forEach(t =>
              t.classList.remove("active")
            );

          container
            .querySelectorAll(".category-panel")
            .forEach(p =>
              p.classList.remove("active")
            );

          btn.classList.add("active");

          const panel =
            container.querySelector(
              "#" + btn.dataset.target
            );

          panel?.classList.add("active");

        });

      });

  });
