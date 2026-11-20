const state = {
  query: "",
  cat: "",
  city: "",
  favoritesOnly: false,
  favorites: new Set(JSON.parse(localStorage.getItem("dukon-favs") || "[]"))
};

const cardsEl = document.getElementById("cards");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const cityEl = document.getElementById("city-select");
const catListEl = document.getElementById("cat-list");
const countEl = document.getElementById("results-count");
const modalEl = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const favToggle = document.getElementById("fav-toggle");

const CITIES = [...new Set(SHOPS.map(s => s.city))].sort((a, b) => a.localeCompare(b, "ru"));

function saveFavorites() {
  localStorage.setItem("dukon-favs", JSON.stringify([...state.favorites]));
}

function matches(s) {
  if (state.cat && s.cat !== state.cat) return false;
  if (state.city && s.city !== state.city) return false;
  if (state.favoritesOnly && !state.favorites.has(s.name)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = [s.name, s.city, s.desc, CATEGORIES[s.cat].label].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function cardHTML(s, i) {
  const c = CATEGORIES[s.cat];
  const fav = state.favorites.has(s.name) ? " on" : "";
  const site = s.site
    ? `<a class="card-site" href="${s.site}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${s.site.replace(/^https?:\/\//, "")}</a>`
    : "";
  return `
    <article class="card" data-i="${i}" onclick="openModal(${i})">
      <div class="card-top">
        <span class="card-title">${s.name}</span>
        <span class="card-emoji">${c.emoji}</span>
      </div>
      <span class="card-cat">${c.label}</span>
      <span class="card-city">📍 ${s.city}</span>
      <p class="card-desc">${s.desc}</p>
      ${site}
      <button class="fav-star${fav}" data-fav="${s.name}" onclick="toggleFav(event, '${s.name.replace(/'/g, "\\'")}')" aria-label="В избранное">⭐</button>
    </article>`;
}

function render() {
  const list = SHOPS.map((s, i) => ({ s, i })).filter(o => matches(o.s));
  cardsEl.innerHTML = list.map(o => cardHTML(o.s, o.i)).join("");
  emptyEl.classList.toggle("hidden", list.length > 0);
  countEl.textContent = `Найдено: ${list.length}`;
  document.getElementById("results-title").textContent = state.favoritesOnly
    ? "Избранное ⭐"
    : (state.cat ? CATEGORIES[state.cat].label : "Каталог магазинов");
  renderCatCounts();
}

function renderCatCounts() {
  document.querySelectorAll(".cat-btn").forEach(btn => {
    const c = btn.dataset.cat;
    const n = SHOPS.filter(s => (!c || s.cat === c) && (!state.city || s.city === state.city)).length;
    btn.querySelector(".count").textContent = n;
  });
}

function renderCats() {
  const allBtn = `<button class="cat-btn active" data-cat="">Все категории <span class="count">${SHOPS.length}</span></button>`;
  const btns = Object.entries(CATEGORIES).map(([key, c]) => {
    const n = SHOPS.filter(s => s.cat === key).length;
    return `<button class="cat-btn" data-cat="${key}">${c.emoji} ${c.label} <span class="count">${n}</span></button>`;
  }).join("");
  catListEl.innerHTML = allBtn + btns;

  catListEl.addEventListener("click", e => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.cat = btn.dataset.cat;
    render();
  });
}

CITIES.forEach(c => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  cityEl.appendChild(opt);
});

searchEl.addEventListener("input", () => {
  state.query = searchEl.value.trim();
  render();
});
cityEl.addEventListener("change", () => {
  state.city = cityEl.value;
  render();
});

favToggle.addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  favToggle.textContent = state.favoritesOnly ? "🔁 Показать все магазины" : "⭐ Показать избранное";
  render();
});

function toggleFav(e, name) {
  e.stopPropagation();
  if (state.favorites.has(name)) state.favorites.delete(name);
  else state.favorites.add(name);
  saveFavorites();
  render();
}
window.toggleFav = toggleFav;

function openModal(i) {
  const s = SHOPS[i];
  const c = CATEGORIES[s.cat];
  const siteRow = s.site
    ? `<div class="modal-row"><b>Сайт</b><a class="card-site" href="${s.site}" target="_blank" rel="noopener">${s.site.replace(/^https?:\/\//, "")}</a></div>`
    : "";
  modalBody.innerHTML = `
    <span class="modal-cat">${c.emoji} ${c.label}</span>
    <h3>${s.name}</h3>
    <p class="modal-desc">${s.desc}</p>
    <div class="modal-rows">
      <div class="modal-row"><b> Город</b><span>📍 ${s.city}, Таджикистан</span></div>
      ${siteRow}
      <div class="modal-row"><b>Режим</b><span>Уточняйте на месте или на официальном сайте</span></div>
    </div>
    ${s.site ? `<a class="modal-site" href="${s.site}" target="_blank" rel="noopener">Перейти на сайт →</a>` : ""}`;
  modalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
window.openModal = openModal;

function closeModal() {
  modalEl.classList.add("hidden");
  document.body.style.overflow = "";
}
modalEl.addEventListener("click", e => {
  if (e.target.matches("[data-close]")) closeModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

document.getElementById("reset").addEventListener("click", () => {
  state.query = "";
  state.cat = "";
  state.city = "";
  state.favoritesOnly = false;
  searchEl.value = "";
  cityEl.value = "";
  favToggle.textContent = "⭐ Показать избранное";
  document.querySelectorAll(".cat-btn").forEach((b, idx) => b.classList.toggle("active", idx === 0));
  render();
  searchEl.focus();
});

const toTop = document.getElementById("to-top");
window.addEventListener("scroll", () => {
  toTop.classList.toggle("show", window.scrollY > 500);
});
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

document.getElementById("stat-shops").textContent = SHOPS.length;
document.getElementById("stat-cities").textContent = CITIES.length;
document.getElementById("stat-cats").textContent = Object.keys(CATEGORIES).length;

renderCats();
render();
