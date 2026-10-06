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

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Qué elementos aparecen con fundido al bajar y cuántos segundos se espera entre uno y el siguiente del mismo grupo
const animations = [
  [".section__head > *", 0.12],
  [".split__text > *", 0.12],
  [".contact__info > *", 0.12],
  [".schedule__item", 0.15],
  [".sede, .sedes__label", 0.1],
  [".photo, .video, .contact__map", 0],
  [".radio", 0],
  [".give__card", 0],
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

const SLIDE_TIME = 6000;
const slides = [...document.querySelectorAll(".hero__slide")];
const dotsBox = document.getElementById("heroDots");
dotsBox.style.setProperty("--slide-time", `${SLIDE_TIME}ms`);
let current = 0;
let slideTimer;

const dots = slides.map((_, i) => {
  const dot = document.createElement("button");
  dot.className = "hero__dot";
  dot.type = "button";
  dot.setAttribute("aria-label", `Ver foto ${i + 1}`);
  dot.addEventListener("click", () => showSlide(i));
  dotsBox.append(dot);
  return dot;
});

// Cada foto se descarga recién cuando le toca o está por tocarle, para no cargar todas al abrir la página
function loadSlide(slide) {
  if (slide.dataset.loaded) return;
  slide.dataset.loaded = "1";
  // Ruta absoluta: un url() relativo dentro de una variable CSS se resolvería contra la carpeta del CSS
  slide.style.setProperty("--img", `url("${new URL(slide.dataset.bg, document.baseURI).href}")`);
  if (slide.dataset.pos) slide.style.setProperty("--pos", slide.dataset.pos);
}

function showSlide(index) {
  loadSlide(slides[index]);
  loadSlide(slides[(index + 1) % slides.length]);
  slides[current].classList.remove("is-active");
  dots[current].classList.remove("is-active");
  current = index;
  slides[current].classList.add("is-active");
  // Reinicia la barrita aunque se vuelva a marcar la misma
  void dots[current].offsetWidth;
  dots[current].classList.add("is-active");
  clearTimeout(slideTimer);
  slideTimer = setTimeout(() => showSlide((current + 1) % slides.length), SLIDE_TIME);
}
showSlide(0);

// day: 0 = domingo … 6 = sábado. Duración en minutos.
const MEETINGS = [
  { name: "Reunión general", day: 0, hour: 19, min: 0, duration: 120, live: true },
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
