fetch("components/premium-cta.html")
.then(res => res.text())
.then(data => {
document.getElementById("premium-cta").innerHTML = data;
});
