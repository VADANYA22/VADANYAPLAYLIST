export async function onRequest() {
  const STATION_ID = "1067069";
  const url =
    `https://listeners.rcast.net/data.php?serviceid=${STATION_ID}&minutes=5&_=${Date.now()}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VadanyaRadio/1.0" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const arr = Array.isArray(data.listeners) ? data.listeners : [];
    const current = arr.length ? Number(arr[arr.length - 1]) || 0 : 0;
    const peak = data.kpi?.peak ?? current;

    return new Response(
      JSON.stringify({ listeners: current, peak, ok: true }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ listeners: 0, peak: 0, ok: false, error: String(e) }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}