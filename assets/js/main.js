// Clave de Web3Forms: los pedidos de oración llegan a cfcpnoracion@gmail.com
const PRAYER_FORM_KEY = "fb337859-a971-4894-a4b3-ddd0065aedb3";

const header = document.getElementById("header");
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const toast = document.getElementById("toast");

document.getElementById("year").textContent = new Date().getFullYear();

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 10);
}, { passive: true });

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", open);
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2500);
}

// ---------- Novedades ----------
// Las novedades se cargan a mano en novedades.json (una por reunión o evento, con sus fotos en Imagenes/novedades/).
// Si la lista está vacía, la sección y el link del menú quedan escondidos.
// En la compu (localhost) se usan las de ejemplo de novedades-ejemplo.json, que no se suben a GitHub.
const NEWS_URL = "novedades.json";
const NEWS_SAMPLE_URL = "novedades-ejemplo.json";
const NEWS_FIRST = 4; // la grande + 3 al costado; el resto aparece con "Ver más novedades"

const newsSection = document.getElementById("novedades");
const newsNavLink = document.getElementById("navNovedades");
const newsGrid = document.getElementById("news");
const newsMore = document.getElementById("newsMore");
const newsModal = document.getElementById("newsModal");
const byId = (id) => document.getElementById(id);
const absUrl = (path) => new URL(path, document.baseURI).href;
const toDate = (iso) => new Date(`${iso}T12:00:00-03:00`);
const newsDate = (iso) => toDate(iso).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isVideo = (path) => /\.(mp4|webm|mov)$/i.test(path);
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let newsPosts = [];

const stamp = (iso) => { const d = toDate(iso); return `<span class="n-stamp"><b>${String(d.getDate()).padStart(2, "0")}</b><small>${MONTHS[d.getMonth()]}</small></span>`; };
const cover = (post) => post.fotos.find((f) => !isVideo(f)) || post.fotos[0];
const bg = (post) => `<span class="n-bg" style="--img: url('${absUrl(cover(post))}')"></span>`;
const play = (post) => (post.fotos.some(isVideo) ? '<span class="n-play" aria-label="Tiene video">▶</span>' : "");
const count = (post) => {
  const photos = post.fotos.filter((f) => !isVideo(f)).length;
  return photos > 1 ? `<span class="n-count"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l2-2h6l2 2h3v12H4zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>${photos} fotos</span>` : "";
};
const read = '<span class="n-read">Ver la novedad <i aria-hidden="true">→</i></span>';
const item = (i, cls, inner) => `<button type="button" class="n-item n-anim ${cls}" data-i="${i}" style="--i:${i}">${inner}</button>`;

// Diseño "revista": la última novedad grande y las anteriores en una lista al costado
function renderNews() {
  const [main, ...others] = newsPosts;
  const row = (p, i) => item(i, "nr__row", `
    <span class="nr__thumb">${bg(p)}${play(p)}</span>
    <span class="nr__row-body">
      <span class="n-tag">${esc(p.categoria)}</span>
      <span class="nr__row-title">${esc(p.titulo)}</span>
      <span class="n-date">${esc(newsDate(p.fecha))}</span>
    </span>`);
  newsGrid.innerHTML = `
    <div class="nr">
      ${item(0, "nr__feature", `${bg(main)}<span class="n-shade"></span>${play(main)}${count(main)}
        <span class="nr__content">
          ${stamp(main.fecha)}
          <span class="nr__kicker">${esc(main.categoria)}</span>
          <span class="nr__title">${esc(main.titulo)}</span>
          <span class="nr__rest">${esc(main.texto)}</span>
          ${read}
        </span>`)}
      ${others.length ? `<div class="nr__side">${others.slice(0, NEWS_FIRST - 1).map((p, k) => row(p, k + 1)).join("")}</div>` : ""}
    </div>
    ${others.length >= NEWS_FIRST ? `<div class="nr__more n-extra">${others.slice(NEWS_FIRST - 1).map((p, k) => row(p, k + NEWS_FIRST)).join("")}</div>` : ""}`;
  newsGrid.classList.toggle("news--single", !others.length);
  newsMore.hidden = !newsGrid.querySelector(".n-extra");
}

async function loadNews() {
  const get = async (url) => {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      return res.ok ? await res.json() : [];
    } catch { return []; }
  };
  let posts = await get(NEWS_URL);
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (!posts.length && local) posts = await get(NEWS_SAMPLE_URL);
  newsPosts = posts
    .filter((p) => p.fecha && p.titulo && p.fotos?.length)
    .map((p) => ({ ...p, categoria: p.categoria || "Novedades", texto: p.texto || "", id: p.id || `${p.fecha}-${slug(p.titulo)}` }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const empty = !newsPosts.length;
  newsSection.hidden = empty;
  newsNavLink.hidden = empty;
  if (empty) return;
  renderNews();

  // Si alguien abre un link compartido (cfcpn.com.ar/#novedad-...), se abre esa novedad
  const shared = location.hash.startsWith("#novedad-") && newsPosts.findIndex((p) => `#novedad-${p.id}` === location.hash);
  if (shared >= 0) { newsSection.scrollIntoView(); openNews(shared); }
}

newsGrid.addEventListener("click", (e) => {
  const card = e.target.closest("[data-i]");
  if (card) openNews(Number(card.dataset.i));
});

newsMore.addEventListener("click", () => {
  newsGrid.classList.add("show-all");
  newsMore.hidden = true;
});

// Las novedades aparecen con el mismo fundido que el resto cuando la sección entra en pantalla
new IntersectionObserver((entries, obs) => {
  if (!entries[0].isIntersecting) return;
  newsGrid.classList.add("is-shown");
  obs.disconnect();
}, { threshold: 0.12 }).observe(newsGrid);

// ---------- Ventana de cada novedad: galería de fotos, texto, compartir y pasar a otra ----------
let newsOpen = 0;
let photoOpen = 0;
const gallery = byId("newsGallery");

function showPhoto(index) {
  const files = newsPosts[newsOpen].fotos;
  photoOpen = (index + files.length) % files.length;
  const file = files[photoOpen];
  gallery.querySelector("video")?.pause();
  gallery.style.setProperty("--img", `url('${absUrl(isVideo(file) ? cover(newsPosts[newsOpen]) : file)}')`);
  byId("newsPhoto").innerHTML = isVideo(file)
    ? `<video src="${esc(absUrl(file))}" poster="${esc(absUrl(cover(newsPosts[newsOpen])))}" controls playsinline preload="metadata"></video>`
    : `<img src="${esc(absUrl(file))}" alt="Foto ${photoOpen + 1} de ${files.length}">`;
  byId("newsPhotoCount").textContent = `${photoOpen + 1} / ${files.length}`;
  byId("newsDots").querySelectorAll("button").forEach((d, i) => d.classList.toggle("is-on", i === photoOpen));
  // Se precarga la foto siguiente para que pase sin esperar
  const next = files[(photoOpen + 1) % files.length];
  if (!isVideo(next)) new Image().src = absUrl(next);
}

function newsStep(button, index, label) {
  const post = newsPosts[index];
  button.hidden = !post;
  if (!post) return;
  button.dataset.target = index;
  button.innerHTML = `<span class="news-modal__thumb" style="--img: url('${absUrl(cover(post))}')"></span>
    <span class="news-modal__step-text"><small>${label}</small><span>${esc(post.titulo)}</span></span>`;
}

function openNews(index) {
  const post = newsPosts[index];
  if (!post) return;
  newsOpen = index;

  // Galería: flechas y puntitos solo si hay más de una foto
  const many = post.fotos.length > 1;
  gallery.classList.toggle("is-single", !many);
  byId("newsDots").innerHTML = many && post.fotos.length <= 20
    ? post.fotos.map((_, i) => `<button type="button" aria-label="Foto ${i + 1}" data-photo="${i}"></button>`).join("")
    : "";
  showPhoto(0);

  byId("newsModalStamp").innerHTML = stamp(post.fecha);
  byId("newsModalTag").textContent = post.categoria;
  byId("newsModalDate").textContent = newsDate(post.fecha);
  byId("newsModalTitle").textContent = post.titulo;
  // Cada párrafo (separados por un renglón en blanco) va en su propio bloque
  byId("newsModalText").innerHTML = post.texto.split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${esc(p.trim())}</p>`).join("");

  newsStep(byId("newsPrev"), index - 1, "← Más reciente");
  newsStep(byId("newsNext"), index + 1, "Anterior →");

  // Se reinicia la animación de entrada cada vez que cambia la novedad
  newsModal.classList.remove("is-in");
  void newsModal.offsetWidth;
  newsModal.classList.add("is-in");
  byId("newsModalBody").scrollTop = 0;
  newsModal.scrollTop = 0;
  if (!newsModal.open) newsModal.showModal();
  history.replaceState(null, "", `#novedad-${post.id}`);
}

function closeNews() {
  newsModal.close();
}

gallery.addEventListener("click", (e) => {
  const arrow = e.target.closest("[data-move]");
  const dot = e.target.closest("[data-photo]");
  if (arrow) showPhoto(photoOpen + Number(arrow.dataset.move));
  if (dot) showPhoto(Number(dot.dataset.photo));
});

// En el celular, las fotos se pasan deslizando el dedo
let swipeX = null;
gallery.addEventListener("touchstart", (e) => { swipeX = e.touches[0].clientX; }, { passive: true });
gallery.addEventListener("touchend", (e) => {
  if (swipeX === null) return;
  const dx = e.changedTouches[0].clientX - swipeX;
  if (Math.abs(dx) > 40 && newsPosts[newsOpen].fotos.length > 1) showPhoto(photoOpen + (dx < 0 ? 1 : -1));
  swipeX = null;
});

newsModal.querySelector(".news-modal__nav").addEventListener("click", (e) => {
  const step = e.target.closest("[data-target]");
  if (step) openNews(Number(step.dataset.target));
});

// Con el teclado: las flechas pasan las fotos
newsModal.addEventListener("keydown", (e) => {
  if (e.target.closest("video")) return;
  if (e.key === "ArrowLeft") showPhoto(photoOpen - 1);
  if (e.key === "ArrowRight") showPhoto(photoOpen + 1);
});

// Botón Compartir: en el celular abre el menú del teléfono; si el navegador no lo tiene, copia el link
byId("newsModalShare").addEventListener("click", async () => {
  const post = newsPosts[newsOpen];
  const url = `${location.origin}${location.pathname}#novedad-${post.id}`;
  if (navigator.share) {
    try { await navigator.share({ title: post.titulo, text: `${post.titulo} · Centro Familiar Cristiano para las Naciones`, url }); } catch {}
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    newsModal.append(toast); // la ventana tapa todo lo demás: el aviso tiene que ir adentro para verse
    showToast("Link copiado. Ya lo podés pegar donde quieras.");
  } catch {}
});

// Se cierra con la X, con Escape o tocando afuera del recuadro
newsModal.addEventListener("click", (e) => { if (e.target === newsModal || e.target.closest("[data-close]")) closeNews(); });
newsModal.addEventListener("close", () => {
  gallery.querySelector("video")?.pause();
  document.body.append(toast);
  if (location.hash.startsWith("#novedad-")) history.replaceState(null, "", location.pathname + location.search);
});

loadNews();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Qué elementos aparecen con fundido al bajar y cuántos segundos se espera entre uno y el siguiente del mismo grupo
const animations = [
  [".section__head > *", 0.12],
  [".split__text > *", 0.12],
  [".contact__info > *", 0.12],
  [".schedule__item", 0.15],
  [".sede, .sedes__label", 0.1],
  [".sedes__map", 0],
  [".photo, .video, .contact__map", 0],
  [".radio, .photo-bg", 0],
  [".give__card, .give__alert", 0.15],
  [".form", 0],
];

if (!reduceMotion) {
  document.documentElement.classList.add("js-anim");

  animations.forEach(([selector, stagger]) => {
    const groups = new Map();
    document.querySelectorAll(selector).forEach((el) => {
      const siblings = groups.get(el.parentElement) || [];
      el.dataset.anim = "";
      el.style.setProperty("--delay", `${siblings.length * stagger}s`);
      groups.set(el.parentElement, [...siblings, el]);
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll("[data-anim]").forEach((el) => revealObserver.observe(el));
}

// Mapa de "Dónde estamos": al pasar el mouse por una tarjeta se ilumina su punto en el mapa, y al revés
document.querySelectorAll("[data-city]").forEach((el) => {
  const linked = document.querySelectorAll(`[data-city="${el.dataset.city}"]`);
  el.addEventListener("mouseenter", () => linked.forEach((l) => l.classList.add("is-hot")));
  el.addEventListener("mouseleave", () => linked.forEach((l) => l.classList.remove("is-hot")));
});

const SLIDE_TIME = 6000;
// Carpeta de las fotos de la portada: el sitio muestra todo lo que haya ahí, ordenado por nombre
const CAROUSEL_FOLDER = "Imagenes/carrusel";
const CAROUSEL_API = `https://api.github.com/repos/dany9515/cfcpn/contents/${CAROUSEL_FOLDER}?ref=main`;
const CAROUSEL_CACHE_MIN = 10;
const heroSlidesBox = document.getElementById("heroSlides");
const dotsBox = document.getElementById("heroDots");
dotsBox.style.setProperty("--slide-time", `${SLIDE_TIME}ms`);
let slides = [];
let dots = [];
let current = 0;
let slideTimer;

// Pide a GitHub la lista de fotos de la carpeta. La guarda unos minutos para no consultar en cada visita
// (GitHub permite 60 consultas por hora desde cada conexión)
async function fetchCarouselFiles() {
  try {
    const saved = JSON.parse(localStorage.getItem("carrusel") || "null");
    if (saved && Date.now() - saved.time < CAROUSEL_CACHE_MIN * 60000) return saved.files;
  } catch {}
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 2500);
  const res = await fetch(CAROUSEL_API, { signal: controller.signal });
  if (!res.ok) throw new Error(res.status);
  const files = (await res.json())
    .filter((f) => f.type === "file" && /\.(jpe?g|png|webp)$/i.test(f.name))
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  try { localStorage.setItem("carrusel", JSON.stringify({ time: Date.now(), files })); } catch {}
  return files;
}

// Arma las fotos con la lista de la carpeta. Si una foto ya estaba en el HTML, conserva su data-pos
function buildSlides(files) {
  const savedPos = new Map([...heroSlidesBox.querySelectorAll(".hero__slide")].map((s) => [s.dataset.bg, s.dataset.pos]));
  heroSlidesBox.replaceChildren(...files.map((name) => {
    const slide = document.createElement("div");
    slide.className = "hero__slide";
    slide.dataset.bg = `${CAROUSEL_FOLDER}/${name}`;
    const pos = savedPos.get(slide.dataset.bg);
    if (pos) slide.dataset.pos = pos;
    return slide;
  }));
}

// Cada foto se descarga recién cuando le toca o está por tocarle, para no cargar todas al abrir la página.
// Al descargarla se ve si es vertical; si no existe (por ejemplo, recién subida y GitHub todavía no la publicó) se saltea
function loadSlide(slide) {
  if (slide.dataset.loaded) return;
  slide.dataset.loaded = "1";
  // Ruta absoluta: un url() relativo dentro de una variable CSS se resolvería contra la carpeta del CSS
  const url = new URL(slide.dataset.bg, document.baseURI).href;
  const img = new Image();
  img.onload = () => {
    slide.classList.toggle("hero__slide--portrait", img.naturalHeight > img.naturalWidth);
    if (slide.dataset.pos) slide.style.setProperty("--pos", slide.dataset.pos);
    slide.style.setProperty("--img", `url("${url}")`);
  };
  img.onerror = () => {
    slide.dataset.broken = "1";
    if (slide === slides[current]) showSlide(nextSlide(current));
  };
  img.src = url;
}

function nextSlide(from) {
  for (let step = 1; step <= slides.length; step++) {
    const i = (from + step) % slides.length;
    if (!slides[i].dataset.broken) return i;
  }
  return from;
}

function showSlide(index) {
  loadSlide(slides[index]);
  loadSlide(slides[nextSlide(index)]);
  slides[current].classList.remove("is-active");
  dots[current].classList.remove("is-active");
  current = index;
  slides[current].classList.add("is-active");
  // Reinicia la barrita aunque se vuelva a marcar la misma
  void dots[current].offsetWidth;
  dots[current].classList.add("is-active");
  clearTimeout(slideTimer);
  slideTimer = setTimeout(() => showSlide(nextSlide(current)), SLIDE_TIME);
}

function startCarousel() {
  slides = [...heroSlidesBox.querySelectorAll(".hero__slide")];
  if (!slides.length) return;
  dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.className = "hero__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Ver foto ${i + 1}`);
    dot.addEventListener("click", () => showSlide(i));
    dotsBox.append(dot);
    return dot;
  });
  showSlide(0);
}

// Si GitHub no responde, se usa la lista que está en el HTML
fetchCarouselFiles()
  .then((files) => { if (files.length) buildSlides(files); })
  .catch(() => {})
  .finally(startCarousel);

// day: 0 = domingo … 6 = sábado. Duración en minutos.
const MEETINGS = [
  { name: "Reunión general", day: 0, hour: 19, min: 20, duration: 120, live: true },
];
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Argentina es UTC-3 todo el año: se trabaja con la hora local de la iglesia aunque el visitante esté en otro país
const AR_OFFSET = -3 * 3600e3;
const DAY_MS = 86400e3;

const cd = {
  label: document.getElementById("cdLabel"),
  name: document.getElementById("cdName"),
  when: document.getElementById("cdWhen"),
  clock: document.getElementById("cdClock"),
  live: document.getElementById("cdLive"),
  days: document.getElementById("cdDays"),
  hours: document.getElementById("cdHours"),
  mins: document.getElementById("cdMins"),
  secs: document.getElementById("cdSecs"),
};

function nextMeeting() {
  const now = Date.now() + AR_OFFSET;
  const today = new Date(now);
  const midnight = now - (now % DAY_MS);

  return MEETINGS.map((m) => {
    let start = midnight + ((m.day - today.getUTCDay() + 7) % 7) * DAY_MS + (m.hour * 60 + m.min) * 60e3;
    if (start + m.duration * 60e3 <= now) start += 7 * DAY_MS;
    return { ...m, start, now, ongoing: start <= now };
  }).sort((a, b) => b.ongoing - a.ongoing || a.start - b.start)[0];
}

const pad = (n) => String(n).padStart(2, "0");

function updateCountdown() {
  const m = nextMeeting();
  const time = `${pad(m.hour)}:${pad(m.min)} hs`;
  cd.name.textContent = m.name;

  if (m.ongoing) {
    cd.label.textContent = "En este momento";
    cd.when.textContent = `${DAY_NAMES[m.day]} · desde las ${time}`;
    cd.clock.hidden = true;
    cd.live.hidden = !m.live;
    return;
  }

  const diff = m.start - m.now;
  const isToday = diff < DAY_MS && new Date(m.start).getUTCDay() === new Date(m.now).getUTCDay();
  cd.label.textContent = "Próxima reunión";
  cd.when.textContent = `${isToday ? "Hoy" : DAY_NAMES[m.day]} · ${time}`;
  cd.clock.hidden = false;
  cd.live.hidden = true;
  cd.days.textContent = Math.floor(diff / DAY_MS);
  cd.hours.textContent = pad(Math.floor((diff % DAY_MS) / 3600e3));
  cd.mins.textContent = pad(Math.floor((diff % 3600e3) / 60e3));
  cd.secs.textContent = pad(Math.floor((diff % 60e3) / 1e3));
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------- En vivo ---------- */
// Dirección del "portero" en Cloudflare (cloudflare/worker-en-vivo.js), que responde { live, url }
const LIVE_API = "https://cfcpn-en-vivo.dany1234491.workers.dev";
const LIVE_CHECK_EVERY = 90e3;
// Si el portero no responde, los botones se muestran igual los domingos de 19:20 a 22:00 (hora de Argentina)
const LIVE_FALLBACK = { day: 0, from: 19 * 60 + 20, to: 22 * 60 };
// Reuniones especiales, solo ese día (también hora de Argentina)
const LIVE_EXTRA = [
  { date: "2026-10-09", from: 20 * 60, to: 23 * 60 }, // Jóvenes con Carlos Carpintieri
];
const liveLinks = document.querySelectorAll("[data-live-link]");

function inFallbackWindow() {
  const now = new Date(Date.now() + AR_OFFSET);
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const today = now.toISOString().slice(0, 10);
  if (LIVE_EXTRA.some((w) => w.date === today && mins >= w.from && mins < w.to)) return true;
  return now.getUTCDay() === LIVE_FALLBACK.day && mins >= LIVE_FALLBACK.from && mins < LIVE_FALLBACK.to;
}

function showLive(live, url) {
  liveLinks.forEach((link) => {
    link.hidden = !live;
    if (url) link.href = url;
  });
}

async function checkLive() {
  try {
    if (!LIVE_API) throw new Error("sin portero");
    const res = await fetch(LIVE_API, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.error) throw new Error("el portero no pudo ver YouTube");
    showLive(data.live, data.url);
  } catch {
    showLive(inFallbackWindow());
  }
}

checkLive();
setInterval(checkLive, LIVE_CHECK_EVERY);

const progress = document.getElementById("progress");
const hero = document.querySelector(".hero");
const heroSlides = document.getElementById("heroSlides");
let ticking = false;
let maxScroll = 0;
let heroHeight = 0;

// Las medidas se leen solo al cargar o cambiar el tamaño; leerlas en cada scroll fuerza al navegador a recalcular la página
function measure() {
  maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  heroHeight = hero.offsetHeight;
}

function onScroll() {
  const y = window.scrollY;
  progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0})`;

  if (!reduceMotion && y < heroHeight) {
    heroSlides.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
  }
  ticking = false;
}

measure();
window.addEventListener("resize", () => { measure(); onScroll(); });
window.addEventListener("load", measure);
document.fonts?.ready.then(measure);

// El video y el mapa se cargan en segundo plano poco después de abrir, para que no traben el scroll al llegar a ellos
setTimeout(() => {
  document.querySelectorAll("iframe[data-src]").forEach((frame) => { frame.src = frame.dataset.src; });
}, 1200);

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });
onScroll();

const radioAudio = document.getElementById("radioAudio");
const radioBtn = document.getElementById("radioBtn");
const radioWave = document.getElementById("radioWave");
const radioStatus = document.getElementById("radioStatus");

function setRadioState(playing, label) {
  radioBtn.textContent = playing ? "❚❚" : "▶";
  radioBtn.setAttribute("aria-label", playing ? "Pausar Radio Vida" : "Escuchar Radio Vida en vivo");
  radioWave.classList.toggle("is-playing", playing);
  radioStatus.textContent = label;
}

// Es una transmisión en vivo: al pausar se corta la conexión y al volver se reconecta,
// así se escucha lo que suena ahora y no lo que quedó guardado
async function playRadio() {
  setRadioState(false, "Conectando…");
  radioAudio.src = `${radioAudio.dataset.stream}?t=${Date.now()}`;
  try {
    await radioAudio.play();
    setRadioState(true, "En vivo");
  } catch {
    setRadioState(false, "Sin señal");
    showToast("No se pudo conectar con la radio. Probá de nuevo en un momento.");
  }
}

function stopRadio() {
  radioAudio.pause();
  radioAudio.removeAttribute("src");
  radioAudio.load();
  setRadioState(false, "En pausa");
}

radioBtn.addEventListener("click", () => (radioAudio.paused ? playRadio() : stopRadio()));
radioAudio.addEventListener("waiting", () => { if (!radioAudio.paused) radioStatus.textContent = "Cargando…"; });
radioAudio.addEventListener("playing", () => setRadioState(true, "En vivo"));

// Controles en la pantalla bloqueada y en la barra de reproducción del celular
if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: "Radio Vida 98.1 FM",
    artist: "Pico Truncado · En vivo",
    artwork: [{ src: new URL("assets/img/radio-vida.png", document.baseURI).href, sizes: "320x320", type: "image/png" }],
  });
  navigator.mediaSession.setActionHandler("play", playRadio);
  navigator.mediaSession.setActionHandler("pause", stopRadio);
  navigator.mediaSession.setActionHandler("stop", stopRadio);
}

document.querySelectorAll(".copy").forEach((el) => {
  el.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(el.dataset.copy);
      showToast("¡Copiado!");
    } catch {
      showToast("No se pudo copiar, seleccionalo manualmente");
    }
  });
});

document.getElementById("prayerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector("button[type=submit]");
  const data = new FormData(form);
  data.append("access_key", PRAYER_FORM_KEY);
  data.append("subject", `${data.get("tipo")} de ${data.get("nombre")} (sitio web)`);
  data.append("from_name", "Sitio web CFCPN");

  button.disabled = true;
  button.textContent = "Enviando...";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
    });
    const result = await res.json();
    if (!res.ok || String(result.success) !== "true") throw new Error(result.message);
    form.reset();
    showToast("¡Gracias! Recibimos tu mensaje y vamos a orar por vos");
  } catch {
    showToast("No se pudo enviar. Probá de nuevo en un momento");
  } finally {
    button.disabled = false;
    button.textContent = "Enviar mensaje";
  }
});
