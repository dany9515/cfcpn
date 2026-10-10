// "Portero" del vivo: se pega en un Worker de Cloudflare.
// Mira si el canal de YouTube de la iglesia está transmitiendo y responde { live, url }.
// Guarda la respuesta 90 segundos para no consultar a YouTube en cada visita.

const CHANNEL_ID = "UCexLcwMF-Z2LX_8uILdGoBw";
const CACHE_SECONDS = 90;

export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const key = new Request("https://cache.local/en-vivo");
    let response = await cache.match(key);

    if (!response) {
      const data = await checkYouTube();
      response = new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
        },
      });
      ctx.waitUntil(cache.put(key, response.clone()));
    }

    // Copia con permiso para que la página (cfcpn.com.ar o la prueba local) pueda leerla
    response = new Response(response.body, response);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cache-Control", "no-store");
    return response;
  },
};

async function checkYouTube() {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/live`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept-Language": "es-AR,es;q=0.9",
        // Evita la pantalla de "aceptar cookies" que YouTube muestra en algunos países
        "Cookie": "SOCS=CAI; CONSENT=YES+1",
      },
    });
    const html = await res.text();
    // Si hay vivo, la página /live apunta al video; si no, apunta al canal
    const video = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
    const channel = html.includes(`<link rel="canonical" href="https://www.youtube.com/channel/${CHANNEL_ID}"`);
    const info = {
      status: res.status,
      finalUrl: res.url,
      title: (html.match(/<title>([^<]*)/) || [])[1] || null,
      length: html.length,
      canonical: (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || null,
      isLive: html.includes('"isLive":true'),
      isUpcoming: html.includes('"isUpcoming":true'),
    };
    // Si YouTube no mostró ni el video ni el canal (pantalla de cookies, de "no sos un robot", etc.), se avisa
    // como error: así el sitio usa el horario de respaldo en vez de esconder los botones
    if (!video && !channel) return { live: false, url: null, error: true, info };
    const live = Boolean(video) && info.isLive && !info.isUpcoming;
    return { live, url: live ? `https://www.youtube.com/watch?v=${video[1]}` : null, info };
  } catch (err) {
    return { live: false, url: null, error: true, info: { message: String(err) } };
  }
}
