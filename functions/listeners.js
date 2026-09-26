export async function onRequest() {
  try {
    const res = await fetch("http://s1.free-shoutcast.com:18194/stats?sid=1&json=1", {
      headers: { "User-Agent": "VadanyaRadio/1.0", Accept: "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const current = Number(data.currentlisteners ?? 0) || 0;
    const peak = Number(data.peaklisteners ?? current) || current;
    return new Response(JSON.stringify({ listeners: current, peak, ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ listeners: 0, peak: 0, ok: false }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }
}