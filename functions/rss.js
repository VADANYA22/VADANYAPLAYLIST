export async function onRequest(context) {
  const target = new URL(context.request.url).searchParams.get("url");
  if (!target) return new Response("Missing url", { status: 400 });
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": "VadanyaRadio/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*"
      }
    });
    return new Response(await res.text(), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=600"
      }
    });
  } catch (e) {
    return new Response("Proxy error: " + e, { status: 502 });
  }
}