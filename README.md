# Au-delà

A cinematic, real-time night sky companion. Enter your location and discover what's above you tonight — planets, ISS passes, meteor showers, and more — rendered with photorealistic detail.

**Live demo:** [au-dela.vercel.app](https://au-dela.vercel.app)

---

## What it does

- **Welcome & location** — Opens with a clean onboarding screen. Grant GPS access or search for any city in the world. No more defaulting to a random location.
- **Interactive sky map** — A real-time hemispherical map of the sky above you, rendered in canvas. Stars, planets, the Moon, constellation lines, and the ISS when overhead. Scroll or pinch to zoom; objects scale up realistically as you zoom in.
- **Photorealistic planets** — Every planet is hand-rendered in canvas with authentic detail:
  - Jupiter's atmospheric bands (13 distinct layers) + Great Red Spot
  - Saturn's multi-layer ring system (C, B, Cassini Division, A rings) drawn behind and in front of the disc, with a ring shadow cast on the planet body
  - Mars with polar ice caps and dark maria
  - Venus with bright cloud layers and an atmospheric glow proportional to its brightness
  - Neptune's Great Dark Spot, Mercury's heavily darkened limb, and smooth cyan Uranus
- **Planet detail panel** — Click any planet on the sky map to open a full panel with physical facts, a complete exploration history (real missions + what each one found), and key things worth knowing about that world.
- **Featured Moment** — The single most interesting thing happening in your sky right now, written in plain English. ISS pass in 8 minutes? Saturn above the horizon? New moon tonight? Described with context and a real direction ("look toward the southwest, about a third of the way up the sky").
- **ISS tracking** — Live position, an overhead banner when it's above you, and pass predictions with countdown timers.
- **Meteor showers** — Active and upcoming shower calendar with peak dates and expected rates.
- **Deep sky events** — Oppositions, conjunctions, elongations, and eclipses for the next 90 days.
- **Cinematic intro** — Stars, nebulae, and the Milky Way fade in across a full-page canvas background before the content appears.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Rendering | HTML Canvas API |
| Astronomy data | AstronomyAPI + local ephemeris math |
| ISS data | Open Notify API |
| Geocoding | Nominatim (OpenStreetMap) |
| Styling | Inline styles (no UI library) |
| Fonts | Cormorant Garamond · Outfit |
| Deploy | Vercel |

---

## Running locally

```bash
git clone https://github.com/maryemeidiata/au-dela.git
cd au-dela
npm install
```

Create `.env.local`:

```env
ASTRONOMY_APP_ID=your_app_id
ASTRONOMY_APP_SECRET=your_app_secret
```

Get free credentials at [astronomyapi.com](https://astronomyapi.com) (100 requests/month on the free tier). The star map, ISS tracker, meteor showers, and events all work without any keys — only planet positions require the API.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  page.tsx                Main page — welcome gate, layout, data hooks
  api/
    planets/              AstronomyAPI proxy (keeps credentials server-side)
    iss/                  ISS position + pass predictions

components/
  WelcomeScreen.tsx       Onboarding — GPS button or city search
  SkyMap.tsx              Interactive hemispherical sky map (canvas)
  StarField.tsx           Full-page animated star/nebula background (canvas)
  FeaturedMoment.tsx      "The one thing worth stepping outside for tonight"
  LoadingSequence.tsx     Cinematic intro overlay
  ISSBanner.tsx           Overhead ISS alert bar
  sections/
    HighlightsSection     Quick-glance summary cards
    ISSSection            Pass predictions
    PlanetsSection        Planet cards with photorealistic canvas orbs
    MeteorSection         Active and upcoming meteor showers
    EventsSection         Upcoming sky events calendar

lib/
  planet-renderer.ts      All photorealistic planet drawing functions
  astronomy-api.ts        Planet data types, direction helpers, PLANET_DETAILS facts
  coordinates.ts          Alt/Az calculations, sidereal time, moon phase
  utils.ts                Formatting, star colours, magnitude → radius

hooks/
  useGeolocation.ts       Browser GPS + reverse geocoding
  useISSData.ts           ISS live position + pass predictions
  useSkyData.ts           Planet + moon positions via API

data/
  bright-stars.json       Curated catalogue of naked-eye stars (RA/Dec/magnitude)
  meteor-showers.json     Annual shower list with radiant coordinates
  special-events.json     Manually-curated upcoming astronomical events
```

---

## Deployment

```bash
npx vercel
```

Add `ASTRONOMY_APP_ID` and `ASTRONOMY_APP_SECRET` in the Vercel project settings. No database, no user accounts — fully stateless.

---

## Design notes

The visual language is deliberately restrained: deep navy backgrounds, Cormorant Garamond italic for anything poetic, Outfit for UI text. No UI library — every glow, gradient, and animation is written by hand.

Planet rendering avoids the common mistake of using a plain white radial gradient, which produces a plastic-ball look. All planets use:
- **Limb darkening** — edges darken realistically toward the disc boundary
- **Authentic band colours** — sourced from telescope photographs and space agency imagery
- **Atmospheric halos** — sized and coloured per planet (Venus's is very large and warm; Neptune's is subtle and cool)
- **Correct geometry for Saturn's rings** — drawn in two passes (back half → planet body → front half) to produce the correct 3D illusion, with a Cassini Division gap and a ring shadow on the planet surface

---

## Licence

MIT
