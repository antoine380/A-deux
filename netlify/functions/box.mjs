import crypto from "node:crypto";
import { json, store, listSubs, sendPush, vapid, isHex, who } from "../lib/common.mjs";

// Boîte aux lettres : les messages sont chiffrés sur le téléphone avec le code du couple.
// Le serveur ne voit qu'un identifiant de boîte et un contenu illisible.
const NOTES = { photo: "t'a envoyé une photo souvenir", music: "t'a envoyé un morceau" };
const MAX = 3_000_000;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b = {}; try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (!isHex(b.box, 64)) return json({ error: "box" }, 400);
  const st = store();

  if (b.action === "send") {
    const from = who(b.from), to = who(b.to);
    if (!from || !to || typeof b.data !== "string" || b.data.length > MAX) return json({ error: "bad_message" }, 400);
    const ts = Date.now();
    const key = `box/${b.box}/${to}/${ts}-${crypto.randomBytes(4).toString("hex")}`;
    await st.setJSON(key, { from, data: b.data, ts });
    const note = NOTES[b.note];
    if (note) {
      await vapid();
      const subs = (await listSubs()).filter((s) => s.box === b.box && s.who === to);
      const name = from === "s" ? "Stéphanie" : "Antoine";
      await Promise.all(subs.map((s) => sendPush(s, { title: "À Deux", body: `${name} ${note}`, url: "/#partage" })));
    }
    return json({ ok: true });
  }
  if (b.action === "pull") {
    const me = who(b.me); if (!me) return json({ error: "me" }, 400);
    const { blobs } = await st.list({ prefix: `box/${b.box}/${me}/` });
    const msgs = [];
    for (const x of blobs.slice(0, 40)) { const m = await st.get(x.key, { type: "json" }); if (m) msgs.push({ key: x.key, data: m.data, ts: m.ts, from: m.from }); }
    return json({ msgs });
  }
  if (b.action === "ack") {
    const me = who(b.me); if (!me || !Array.isArray(b.keys)) return json({ error: "bad_request" }, 400);
    const prefix = `box/${b.box}/${me}/`;
    await Promise.all(b.keys.filter((k) => typeof k === "string" && k.startsWith(prefix)).slice(0, 100).map((k) => st.delete(k)));
    return json({ ok: true });
  }
  return json({ error: "action" }, 400);
};

export const config = { path: "/api/box" };
