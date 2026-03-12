fetch("components/premium-cta.html")
  .then(res => {
    if(!res.ok) throw new Error("CTA load error");
    return res.text();
  })
  .then(data => {
    document.getElementById("premium-cta").innerHTML = data;
  })
  .catch(err => console.error(err));
