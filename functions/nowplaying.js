export async function onRequest() {
  const STATION_ID = "1067069";
  const endpoints = [
    `https://players.rcast.net/json/${STATION_ID}`,
    `https://api.rcast.net/nowplaying/${STATION_ID}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "VadanyaRadio/1.0", Accept: "application/json" }
      });
      if (!res.ok) continue;
      const text = (await res.text()).trim();
      if (!text.startsWith("{") && !text.startsWith("[")) continue;
      const data = JSON.parse(text);
      let now = data.nowplaying || data.title || data.songtitle || "";
      if (!now && data.artist && data.title) now = `${data.artist} - ${data.title}`;
      if (now) {
        return json({ nowplaying: String(now).trim(), ok: true });
      }
    } catch (_) {}
  }

  return json({ nowplaying: "Vadanya Radio - Live", ok: false });
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}