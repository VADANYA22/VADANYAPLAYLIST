export async function onRequest() {
  try {
    const res = await fetch("http://s1.free-shoutcast.com:18194/stats?sid=1&json=1", {
      headers: { "User-Agent": "VadanyaRadio/1.0", Accept: "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const song = (data.songtitle || "").trim();
    if (song) {
      return new Response(JSON.stringify({ nowplaying: song, ok: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ nowplaying: "Vadanya Radio - Live", ok: false, error: String(e) }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });
  }
  return new Response(JSON.stringify({ nowplaying: "Vadanya Radio - Live", ok: false }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
  });
}