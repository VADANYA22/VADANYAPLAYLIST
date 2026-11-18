export async function onRequest() {
  const STATION_ID = "1067069";
  const endpoints = [
    `https://players.rcast.net/json/${STATION_ID}`,
    `https://api.rcast.net/nowplaying/${STATION_ID}`,
    `https://players.rcast.net/circle/${STATION_ID}/json`,
    `https://players.rcast.net/api/nowplaying/${STATION_ID}`,
    `https://stream.rcast.net/status-json.xsl?mount=/${STATION_ID}`,
    `https://players.rcast.net/circle/${STATION_ID}`
  ];

  const results = [];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const text = await res.text();
      results.push({
        url,
        status: res.status,
        contentType: res.headers.get("content-type"),
        preview: text.slice(0, 300)
      });
    } catch (e) {
      results.push({ url, error: String(e) });
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}