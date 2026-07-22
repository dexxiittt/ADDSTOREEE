fetch("./footer.html")
  .then(res => res.text())
  .then(data => {
    const container = document.getElementById("footer-container");
    if (container) {
      container.innerHTML = data;
    }
  })
  .catch(err => console.error("Footer gagal load:", err));
