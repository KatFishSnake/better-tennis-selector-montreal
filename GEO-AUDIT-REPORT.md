# GEO Audit Report: Tennis MTL

**Audit Date:** 2026-05-07
**URL:** https://tennismtl.com
**Business Type:** Hybrid local-utility / web-app (Montreal tennis court availability finder)
**Pages Analyzed:** 1 (single-page site; sitemap contains one URL)

---

## Executive Summary

**Overall GEO Score: 38/100 (Critical)**

The site is a tightly-built, technically excellent single-page utility — full SSR, clean HTML, permissive AI crawler access — but it is functionally invisible to LLM ecosystems. Two structural problems drive the low score: (1) there is almost no citable content (~110 words of body copy) and (2) the brand has zero footprint on the platforms AI models train on (Reddit, Wikipedia, YouTube, LinkedIn, press). The technical foundation (84/100) is the only category where the site is strong enough to ship as-is; everything else needs intervention. Expected lift to 65-70 within 6 months is realistic with the actions below.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 58/100 | 25% | 14.5 |
| Brand Authority | 5/100 | 20% | 1.0 |
| Content E-E-A-T | 26/100 | 20% | 5.2 |
| Technical GEO | 84/100 | 15% | 12.6 |
| Schema & Structured Data | 28/100 | 10% | 2.8 |
| Platform Optimization | 22/100 | 10% | 2.2 |
| **Overall GEO Score** | | | **38.3 / 100** |

---

## Critical Issues (Fix Immediately)

1. **No citable content surface.** Body copy is ~110 words. AI systems have nothing to quote. → Add an FAQ section (4-6 Q&As ~40-60 words each) and a "How booking works in Montreal" explainer (250-400 words). Single biggest GEO lever available.
2. **Brand is unrecognized as an entity.** Zero mentions on Wikipedia, Reddit, YouTube, LinkedIn, Wikidata, press. AI models cannot resolve "Tennis MTL" to a known thing. → Seed Reddit (r/montreal, r/tennis), Show HN/Product Hunt launch, create Wikidata Q-id.
3. **Brand string never appears verbatim in body copy.** H1 says "Better tennis booking" — the literal string "Tennis MTL" lives only in the domain. → Update H1/copy and JSON-LD `name` to use "Tennis MTL" prominently.
4. **Missing Organization + Person schema with `sameAs`.** No entity anchor exists on-page. → Add Organization and Person JSON-LD with `sameAs` pointing at GitHub, heyandre.so, X/LinkedIn (templates in Schema deep dive below).

## High Priority Issues

5. **`/llms.txt` returns 404.** Direct GEO signal missing. → Ship a 30-line `app/llms.txt` route.
6. **`/manifest.webmanifest` returns 404 in production.** PWA manifest landed locally but is not yet deployed. → Deploy.
7. **No FAQPage JSON-LD** despite the existing "Tips" + "How this works" content already being Q&A-shaped. → Wrap as FAQPage with `speakable` selectors. Zero new copy needed.
8. **Security headers missing.** No CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. HSTS is set but missing `includeSubDomains` and `preload`. → Add `headers()` block to `next.config.ts`.
9. **No author bio / About page.** No identifiable human attached to the content. → Add `/about` with byline, photo, why-built story.
10. **No publication / last-updated dates.** Trust + freshness signal absent. → Add `datePublished` and `dateModified` and a visible "Availability refreshed live" line.

## Medium Priority Issues

11. **`hreflang` missing** despite bilingual `og:locale:alternate=fr_CA`. → Either add `<link rel="alternate" hreflang="fr-CA">` for a real FR variant or remove the locale alternate.
12. **Sitemap has a single URL.** No discovery surface beyond `/`. → Add /about, /courts, /faq pages and re-sitemap; ping IndexNow.
13. **No explicit AI-crawler allow lines** in robots.txt. Permissive default works, but explicit allows score better with audit tools and signal intent. → Add `User-agent: GPTBot`, `ClaudeBot`, `PerplexityBot`, etc., with `Allow: /`.
14. **Title tag is 30 chars.** Underutilized. → Lengthen toward 50-60 (e.g., "Tennis MTL — Find Open Tennis Courts in Montreal").
15. **Existing `Offer` schema missing `availability`.** → Add `"availability": "https://schema.org/InStock"`.
16. **No Wikidata entity.** ChatGPT/Gemini lean heavily on Wikidata for entity recognition. → Create a minimal Q-id once notability is borderline-met.

## Low Priority Issues

17. Server header leaks `Vercel`. Cosmetic, low risk.
18. CWV: verify hero/icons have explicit dimensions to keep CLS at zero.
19. Re-link the WebApplication block to the new Organization via `"publisher": {"@id": "https://tennismtl.com/#org"}`.
20. Add `knowsAbout` properties to a Person block to anchor topical authority on Montreal tennis.

---

## Category Deep Dives

### AI Citability (58/100)

Top blocks (estimated citability):

- "Tips" list (78) — specific, self-contained, scannable. The 10 PM free-slot insight and the named parks (La Fontaine, Jeanne-Mance, IGA Stadium) are the highest-value sentences on the site.
- "How this works" paragraph (62) — clear answer block, but no numbers.
- 2-step instructions (55) — procedural, useful, but UI-bound.
- Hero subheading (45) — marketing copy, not an answer.

Recommended rewrites:

- Convert "Tips" to question-shaped H3s with full-sentence answers ("**When can I book a Montreal tennis court?** Bookings open 2 days in advance on loisirs.montreal.ca…").
- Add a public-courts data table (park | court count | surface | lit | reservation required) — tables are AI-citation gold and you already have the data via the IC3 API.

### Brand Authority (5/100)

| Platform | Status |
|---|---|
| Wikipedia | Absent |
| Wikidata | Absent |
| Reddit | No threads |
| YouTube | No coverage |
| LinkedIn | No company page |
| Press / blog mentions | None detected |
| GitHub | Public repo (positive but isolated signal) |

This is the dominant weakness. Highest-leverage moves: (1) genuine "I built this" Reddit posts on r/montreal and r/tennis, (2) Show HN / Product Hunt launch under the exact brand string "Tennis MTL", (3) a Wikidata Q-id once at least one independent source exists.

### Content E-E-A-T (26/100)

| Dimension | Score | Notes |
|---|---|---|
| Experience | 9/25 | Local specificity (parks, 10 PM free-slot insight) implies first-hand use; no narrative |
| Expertise | 6/25 | Clear technical familiarity with the city portal; no author byline |
| Trustworthiness | 8/25 | HTTPS, non-affiliation disclaimer, GitHub source = wins; no privacy policy, no dates, no email |
| Authoritativeness | 3/25 | No about page, no media, no inbound authority |

Most impactful additions: an `/about` page with byline + photo, an FAQ block, a `/courts` directory page (one row per park), and visible publication + last-updated timestamps.

### Technical GEO (84/100)

Already strong. Key checks:

- SSR confirmed (`x-nextjs-prerender: 1`). AI crawlers (GPTBot, ClaudeBot, PerplexityBot all verified) receive the full ~28.6 KB prerendered HTML including JSON-LD without executing JS.
- robots.txt permissive, sitemap valid, canonical correct, viewport correct, OG/Twitter complete.
- Edge cache HIT from Vercel — TTFB excellent for crawlers.

Gaps: missing security headers (CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy), 404 on llms.txt and manifest.webmanifest, no hreflang.

### Schema & Structured Data (28/100)

Existing WebApplication JSON-LD is syntactically valid and server-rendered (good). But it's the only schema on the page and it's a weak GEO type — no rich result, no entity edges.

GEO-critical missing types that *do* fit this site:

- **Organization** with `sameAs` (GitHub, heyandre.so, future LinkedIn / X) — the entity anchor.
- **Person** (creator) — links André as the human behind the project.
- **FAQPage** with `speakable` — zero new copy needed; convert existing "Tips" + "How this works".

Skip: HowTo (deprecated by Google Sept 2023), Article/BlogPosting (no content pages), WebSite + SearchAction (no search endpoint), BreadcrumbList (single-page).

Ready-to-paste JSON-LD provided in the [Quick Wins](#quick-wins-implement-this-week) section below.

### Platform Optimization (22/100)

| Platform | Score | Strongest gap |
|---|---|---|
| Bing Copilot | 26 | No msvalidate/IndexNow, no LinkedIn, but otherwise the friendliest |
| Google AI Overviews | 24 | No FAQ/Article schema, headings not query-shaped |
| Gemini | 22 | No YouTube, no Google Business Profile, no Knowledge Graph entity |
| ChatGPT web search | 20 | Brand string never resolves to a known entity |
| Perplexity | 18 | No community validation surface (Reddit/forums) |

Cross-platform synergies (one action, multiple lifts):

- **FAQPage + question-shaped H2s** → AIO + ChatGPT + Bing Copilot.
- **Organization + sameAs + brand string in copy** → ChatGPT + Gemini + Perplexity.
- **One dated, primary-source post** ("Montreal public tennis court inventory by borough, 2026") → Perplexity + AIO + Gemini.

---

## Quick Wins (Implement This Week)

1. **Ship `app/llms.txt/route.ts`.** ~30 lines. Includes brand statement, key URLs (homepage, about, FAQ once they exist), and a short FAQ summary. Lifts AI Citability + Technical GEO immediately.
2. **Deploy the pending PWA `manifest.webmanifest`.** Already added locally; just push.
3. **Add Organization + Person JSON-LD with `sameAs`.** Zero content work; pure entity anchoring.

   ```json
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "@id": "https://tennismtl.com/#org",
     "name": "Tennis MTL",
     "url": "https://tennismtl.com",
     "description": "Independent tool for finding open tennis courts in Montreal.",
     "founder": {"@type": "Person", "@id": "https://tennismtl.com/#creator"},
     "sameAs": [
       "https://github.com/KatFishSnake/tennismtl.com",
       "https://heyandre.so"
     ]
   }
   ```

4. **Wrap "Tips" + "How this works" as FAQPage JSON-LD with `speakable` selectors.** Add `id="how-it-works"` and `id="tips"` to the corresponding sections. No new copy required.
5. **Add security headers in `next.config.ts`:** CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy. Upgrade HSTS to `max-age=63072000; includeSubDomains; preload`.
6. **Make "Tennis MTL" appear verbatim** in the H1 (e.g., "Tennis MTL — Better tennis booking for Montreal") and in `name` of the WebApplication schema.

## 30-Day Action Plan

### Week 1: Schema + Technical hygiene
- [ ] Add Organization + Person JSON-LD with `sameAs`
- [ ] Add FAQPage JSON-LD wrapping existing Tips + How-it-works
- [ ] Ship `/llms.txt`
- [ ] Deploy pending PWA manifest
- [ ] Add security headers in `next.config.ts`
- [ ] Add `availability` to existing Offer; link `publisher` to new Organization

### Week 2: Content depth
- [ ] Add `/about` page with byline, photo, why-built story
- [ ] Convert Tips into question-shaped H3 + full-sentence answers
- [ ] Add visible `datePublished` / `dateModified` and a "Availability refreshed live from loisirs.montreal.ca" line
- [ ] Lengthen `<title>` to 50-60 chars; include "Tennis MTL" verbatim

### Week 3: Topical hub
- [ ] Build `/courts` directory: one row per park (court count, surface, lit, free vs paid, address, deep link)
- [ ] Build `/faq` page (4-6 Q&As: booking window, free courts, lit courts, residency, indoor vs outdoor, pricing tiers)
- [ ] Update sitemap; ping IndexNow

### Week 4: Brand seeding
- [ ] Genuine "I built this" Reddit posts on r/montreal, r/tennis (1 per subreddit, on-topic, with disclosure)
- [ ] Show HN + Product Hunt launch under brand string "Tennis MTL"
- [ ] Add explicit AI-crawler allow lines to robots.txt (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User, Google-Extended, CCBot, Applebot-Extended, Amazonbot)
- [ ] Once one independent reference exists, create Wikidata Q-id

---

## Appendix: Pages Analyzed

| URL | Title | GEO Issues |
|---|---|---|
| https://tennismtl.com/ | Better Tennis Booking · Montreal | 11 (1 critical content gap, 2 critical entity gaps, 7 medium/low) |

Sitemap returned a single URL; no further pages exist on the production site at audit time.
