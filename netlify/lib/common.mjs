import webpush from "web-push";
import { getStore } from "@netlify/blobs";

export const store = () => getStore("adeux");
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export const isHex = (s, n) => typeof s === "string" && new RegExp(`^[0-9a-f]{${n}}$`).test(s);
export const who = (s) => (s === "s" || s === "a" ? s : null);

// Clés VAPID créées automatiquement au premier appel et gardées dans Netlify Blobs.
export async function vapid() {
  const st = store();
  let v = await st.get("vapid", { type: "json" });
  if (!v) { v = webpush.generateVAPIDKeys(); await st.setJSON("vapid", v); }
  webpush.setVapidDetails(process.env.URL || "mailto:a-deux@example.com", v.publicKey, v.privateKey);
  return v;
}

export async function getSub(id) { return isHex(id, 32) ? await store().get("sub/" + id, { type: "json" }) : null; }
export async function putSub(rec) { await store().setJSON("sub/" + rec.id, rec); }
export async function listSubs() {
  const st = store(); const { blobs } = await st.list({ prefix: "sub/" }); const out = [];
  for (const b of blobs) { const r = await st.get(b.key, { type: "json" }); if (r) out.push(r); }
  return out;
}

export async function sendPush(rec, payload) {
  try { await webpush.sendNotification(rec.sub, JSON.stringify(payload), { TTL: 6 * 3600, urgency: "normal" }); return true; }
  catch (e) {
    if (e && (e.statusCode === 404 || e.statusCode === 410)) await store().delete("sub/" + rec.id);
    return false;
  }
}

// Heure et date à Paris, quel que soit le fuseau du serveur.
export function parisNow(d = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(d).map((p) => [p.type, p.value]));
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: +parts.hour, dow };
}

export function itemsFor(cfg, date, dow) {
  const out = []; if (!cfg) return out;
  const w = Array.isArray(cfg.week) && cfg.week[dow] ? cfg.week[dow] : { q: 1, p: 0, m: 0, d: 0 };
  const p = cfg.plan;
  const quiz = !!(p && p.start && date >= p.start && (!p.end || date <= p.end) && w.q);
  if (quiz) out.push("quiz");
  if (w.p) out.push("photo souvenir");
  if (w.m) out.push("musique");
  if (w.d) out.push("défi du jour");
  return { list: out, quiz };
}
