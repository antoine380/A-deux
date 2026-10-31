// Génère de nouvelles questions pour « À Deux » avec l'API Claude.
// Variables d'environnement Netlify :
//   ANTHROPIC_API_KEY  (obligatoire) clé API de console.anthropic.com
//   ADEUX_KEY          (recommandé) code d'accès à saisir une fois dans l'app
//   ADEUX_MODEL        (facultatif) modèle à utiliser, par défaut claude-haiku-5-5

const THEMES = {
  hot: "Très hot : questions coquines et sensuelles pour un couple adulte consentant (désirs, fantasmes, séduction, envies, lieux, tenues). Audacieuses et suggestives, jamais vulgaires ni anatomiquement crues.",
  sexe: "Sexualité : communication sur la vie intime, le désir, le consentement, les préférences, le confort et la tendresse, sans vulgarité.",
  connaissance: "Connaître l'autre : personnalité, enfance, valeurs, émotions, peurs, rêves, manières d'aimer.",
  quotidien: "Vie quotidienne : maison, routines, organisation, petites habitudes, vie de couple au jour le jour.",
  loisirs: "Loisirs : sorties, culture, sport, musique, films, séries, jeux, passions.",
  voyage: "Voyage : destinations, souvenirs de voyage, envies d'évasion, façons de voyager.",
  food: "Nourriture : goûts, plats, cuisine, restaurants, boissons, souvenirs gourmands.",
  souvenirs: "Notre histoire : souvenirs du couple, débuts, moments marquants, anecdotes.",
  avenir: "Avenir et rêves : projets, ambitions, vie future à deux, envies à réaliser.",
  insolite: "Insolite et délires : questions drôles, absurdes ou imaginaires, pour rire ensemble.",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const clean = (s) => String(s ?? "").replace(/[<>&"]/g, "").replace(/\s+/g, " ").trim().slice(0, 220);

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "no_key" }, 500);
  const access = process.env.ADEUX_KEY;
  if (access && req.headers.get("x-adeux-key") !== access) return json({ error: "forbidden" }, 403);

  let body = {};
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const theme = THEMES[body.theme] ? body.theme : "connaissance";
  const n = Math.min(Math.max(parseInt(body.n, 10) || 12, 1), 20);
  const avoid = (Array.isArray(body.avoid) ? body.avoid : []).slice(-60).map(clean).filter(Boolean);

  const prompt = `Tu écris des cartes pour « À Deux », une application de jeux de conversation pour un couple adulte.
Thème : ${THEMES[theme]}
Écris ${n} questions ouvertes, nouvelles, variées et précises, en français, au tutoiement, adressées à la personne qui répond.
Règles :
- Pour désigner son ou sa partenaire, écris exactement {B} (par exemple : « Qu'est-ce qui te fait craquer chez {B} ? »).
- Formulations neutres : pas d'accord masculin ou féminin pour la personne qui répond.
- Une seule question par élément, de 6 à 25 mots, qui se termine par un point d'interrogation.
- Varie les angles et les tournures. Aucune question ne doit ressembler à celles-ci :
${avoid.map((a) => "• " + a).join("\n")}
Réponds uniquement avec un tableau JSON de chaînes, sans aucun texte autour.`;

  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ADEUX_MODEL || "claude-haiku-5-5",
        max_tokens: 1500,
        temperature: 1,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return json({ error: "upstream" }, 502);
  }
  if (!r.ok) return json({ error: "upstream", status: r.status }, 502);

  const data = await r.json().catch(() => ({}));
  const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  let items = [];
  const m = text.match(/\[[\s\S]*\]/);
  if (m) { try { items = JSON.parse(m[0]); } catch { items = []; } }
  items = (Array.isArray(items) ? items : []).filter((t) => typeof t === "string" && !/[<>]|\{(?!B\})/.test(t)).map(clean).filter((t) => t.length >= 12);
  return json({ theme, items });
};

export const config = { path: "/api/questions" };
