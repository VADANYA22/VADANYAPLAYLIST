const STREAM_STATS = "http://s1.free-shoutcast.com:18194/stats?sid=1&json=1";
const PLAYED_HTML = "http://s1.free-shoutcast.com:18194/played.html?sid=1";
const MAX_ENTRIES = 2000;
const KEY = "plays";

function cors(json, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

function parseTitle(raw) {
  const t = (raw || "").trim();
  if (!t) return null;
  if (/^vadanya/i.test(t) && !t.includes(" - ")) {
    return { artist: "Vadanya Radio", title: t, raw: t };
  }
  const i = t.indexOf(" - ");
  if (i > -1) {
    return {
      artist: t.slice(0, i).trim().replace(/;/g, ","),
      title: t.slice(i + 3).trim(),
      raw: t
    };
  }
  return { artist: "Unknown", title: t, raw: t };
}

async function fetchCurrent() {
  try {
    const res = await fetch(STREAM_STATS, {
      headers: { "User-Agent": "VadanyaRadio/1.0", Accept: "application/json" }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return parseTitle(data.songtitle);
  } catch {
    return null;
  }
}

async function fetchPlayedHtml() {
  try {
    const res = await fetch(PLAYED_HTML, {
      headers: { "User-Agent": "Mozilla/5.0 VadanyaRadio/1.0" }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const cells = [...html.matchAll(/<td>([^<]+)<\/td>/gi)].map((m) =>
      m[1]
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim()
    );
    const out = [];
    for (let i = 0; i < cells.length; i++) {
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(cells[i]) && cells[i + 1]) {
        const p = parseTitle(cells[i + 1]);
        if (p) out.push({ ...p, timeLabel: cells[i], source: "played.html" });
        i++;
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function onRequest(context) {
  const kv = context.env?.HISTORY;

  if (!kv) {
    const recent = await fetchPlayedHtml();
    const current = await fetchCurrent();
    return cors({
      ok: true,
      kv: false,
      warning: "KV belum di-bind. Hanya buffer server (bukan 7 hari).",
      current,
      plays: recent.map((p, idx) => ({
        id: "buf-" + idx,
        title: p.title,
        artist: p.artist,
        raw: p.raw,
        ts: null,
        timeLabel: p.timeLabel
      }))
    });
  }

  let plays = [];
  try {
    const raw = await kv.get(KEY);
    if (raw) plays = JSON.parse(raw);
    if (!Array.isArray(plays)) plays = [];
  } catch {
    plays = [];
  }

  const current = await fetchCurrent();
  if (current?.raw) {
    const last = plays[0];
    const same = last && (last.raw || "").toLowerCase() === current.raw.toLowerCase();
    if (!same) {
      plays.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: current.title,
        artist: current.artist,
        raw: current.raw,
        ts: Date.now()
      });
      if (plays.length > MAX_ENTRIES) plays = plays.slice(0, MAX_ENTRIES);
      await kv.put(KEY, JSON.stringify(plays));
    }
  }

  const limit = Math.min(
    parseInt(new URL(context.request.url).searchParams.get("limit") || "100", 10),
    500
  );

  return cors({
    ok: true,
    kv: true,
    current,
    plays: plays.slice(0, limit)
  });
}