export async function onRequest() {
  const STATS_URL = "http://s1.free-shoutcast.com:18194/stats?sid=1&json=1";
  try {
    const res = await fetch(STATS_URL, {
      headers: { "User-Agent": "VadanyaRadio/1.0", Accept: "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const song = (data.songtitle || "").trim();
    if (song) {
      return json({
        nowplaying: song,
        listeners: data.currentlisteners ?? null,
        ok: true
      });
    }
  } catch (e) {
    return json({ nowplaying: "Vadanya Radio - Live", ok: false, error: String(e) });
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