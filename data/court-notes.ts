// Community-curated notes for Montreal tennis venues.
// Add or edit notes here — open a PR on GitHub:
// https://github.com/KatFishSnake/tennismtl.com/edit/main/data/court-notes.ts
//
// Keys are the loisirs.montreal.ca site IDs (stable). Find a site's ID at
// /api/init or in the URL after a search.
// Keep notes terse: one or two sentences of factual info — court count,
// indoor/outdoor, surface, lighting, borough, anything that helps a player
// decide.

export const COURT_NOTES: Record<number, string> = {
  // Parc La Fontaine — Plateau-Mont-Royal
  1734: "14 outdoor courts along avenue Émile-Duployé in the Plateau — 7 slow synthetic-carpet + 7 fast acrylic. Lit, open 8 AM–11 PM. Largest concentration of public courts in central Montreal.",

  // Parc Jeanne-Mance — Plateau-Mont-Royal
  1726: "Outdoor courts at the foot of Mount Royal (avenue de l'Esplanade × Mont-Royal). Generally busy on summer evenings — book early.",

  // Complexe sportif Claude-Robillard — Ahuntsic-Cartierville
  813: "4 indoor courts at the Ville de Montréal sports complex built for the 1976 Olympics. The main public indoor option in the city, open year-round.",

  // Terrains extérieurs Claude-Robillard
  866: "10 outdoor courts at the Claude-Robillard complex in Ahuntsic-Cartierville. Summer only; the outdoor companion to the indoor facility.",

  // Terrains de tennis Saint-Viateur (6) — Outremont
  654: "6 outdoor courts in Outremont near avenue Saint-Viateur. Well-maintained and popular with locals.",

  // Terrains de tennis Garneau (4)
  653: "4 outdoor courts.",

  // Terrains de tennis Joyce (3)
  682: "3 outdoor courts.",

  // Centre de Tennis Cavelier — Saint-Laurent
  882: "Dedicated tennis facility in Saint-Laurent borough. Indoor option for year-round play.",

  // Centre Pierre-Charbonneau — Mercier–Hochelaga-Maisonneuve
  1628: "Multi-sport indoor complex near Olympic Park (3000 rue Viau). Hosts a range of activities; tennis bookings via loisirs.",

  // Parc Père-Marquette — Rosemont–La Petite-Patrie
  1472: "Outdoor courts in Rosemont–La Petite-Patrie.",
};
