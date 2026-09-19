/**
 * Cloudflare Pages Function
 * Baca metadata ICY dari stream RCAST
 */
export async function onRequest() {
  const STREAM_URL = "https://stream.rcast.net/1067069";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(STREAM_URL, {
      headers: {
        "Icy-MetaData": "1",
        "User-Agent": "VadanyaRadio/1.0"
      },
      signal: controller.signal
    });

    if (!res.ok) {
      clearTimeout(timeout);
      return json({ error: "Stream HTTP " + res.status, nowplaying: "Vadanya Radio - Live" });
    }

    const metaint = parseInt(res.headers.get("icy-metaint") || "0", 10);
    if (!metaint) {
      clearTimeout(timeout);
      return json({ error: "No icy-metaint header", nowplaying: "Vadanya Radio - Live" });
    }

    const reader = res.body.getReader();
    let audioBytesRead = 0;
    let metaBuf = new Uint8Array(0);
    let passedAudio = false;
    let metadata = "";
    let iterations = 0;

    while (iterations++ < 50) {
      const { done, value } = await reader.read();
      if (done) break;

      let chunk = value;

      if (!passedAudio) {
        if (audioBytesRead + chunk.length <= metaint) {
          audioBytesRead += chunk.length;
          continue;
        }
        chunk = chunk.slice(metaint - audioBytesRead);
        audioBytesRead = metaint;
        passedAudio = true;
      }

      metaBuf = concat(metaBuf, chunk);

      if (metaBuf.length >= 1) {
        const metaLen = metaBuf[0] * 16;

        if (metaLen === 0) {
          // Metadata kosong, skip ke block berikutnya
          passedAudio = false;
          audioBytesRead = 0;
          metaBuf = new Uint8Array(0);
          continue;
        }

        if (metaBuf.length >= 1 + metaLen) {
          const metaStr = new TextDecoder()
            .decode(metaBuf.slice(1, 1 + metaLen))
            .replace(/\0/g, "");

          const match = metaStr.match(/StreamTitle='([^']*)'/);
          if (match && match[1] && match[1].trim()) {
            metadata = match[1].trim();
            break;
          } else {
            // Block kosong, lanjut baca block berikutnya
            passedAudio = false;
            audioBytesRead = 0;
            metaBuf = new Uint8Array(0);
          }
        }
      }
    }

    reader.cancel().catch(() => {});
    clearTimeout(timeout);

    if (!metadata) {
      return json({ nowplaying: "Vadanya Radio - Live" });
    }

    return json({ nowplaying: metadata });

  } catch (e) {
    return json({ error: String(e), nowplaying: "Vadanya Radio - Live" });
  }
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function concat(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}