fetch("components/section-trust.html")
  .then(res => res.text())
  .then(data => {

    const container =
      document.getElementById("trust-section");

    if (!container) return;

    container.innerHTML = data;

    const trustSection =
      container.querySelector(".fade-on-scroll");

    if (!trustSection) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(trustSection);

  })
  .catch(err => {
    console.error("Trust Section Error:", err);
  });
