export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const feedUrl = searchParams.get("url");

  if (!feedUrl) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }

  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VadanyaRadio/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*"
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });

    if (!res.ok) {
      return new Response("Upstream HTTP " + res.status, { status: 502 });
    }

    const text = await res.text();

    return new Response(text, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (e) {
    return new Response("Proxy error: " + e.message, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}