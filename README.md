# Au-delà

A personal night sky tracker. Real-time star maps, ISS passes, visible planets, meteor showers, and upcoming space events for your exact location. Built as a standalone portfolio project.

## What it does

- Cinematic loading sequence that feels like the opening of a film
- Canvas-rendered star field with 900 stars, Milky Way band, and occasional shooting stars
- Interactive sky map showing real star positions, constellation lines, planets, the Moon, and the ISS
- ISS pass times with countdown timers and mini-arc diagrams
- Planet visibility cards with accurate colors and positions
- Meteor shower calendar for the next three upcoming showers
- Upcoming space events (oppositions, eclipses, conjunctions, comets) for the next 90 days
- Visibility quality score combining moon phase, historical cloud cover, and light pollution

## Setup

### 1. Clone and install

```bash
git clone https://github.com/maryemeidiata/au-dela.git
cd au-dela
npm install
```

### 2. Environment variables

Copy the example file and fill in your API keys:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```
ASTRONOMY_APP_ID=your_app_id_here
ASTRONOMY_APP_SECRET=your_app_secret_here
NASA_API_KEY=your_nasa_key_here
```

**AstronomyAPI** (required for planet positions and moon phase)
- Sign up at https://astronomyapi.com
- Free tier: 100 requests per month
- Copy your Application ID and Application Secret

**NASA API** (optional, for APOD imagery)
- Register at https://api.nasa.gov
- Free, unlimited for reasonable use
- Without a key, `DEMO_KEY` works but is rate-limited to 30 requests/hour

The app works without credentials but planet data will not load. The star map, ISS tracker, meteor showers, and events all work without any API keys.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Allow browser location access for accurate sky data.

## Updating the data files

### Meteor showers

Edit `data/meteor-showers.json`. Each entry needs:

```json
{
  "id": "unique-id",
  "name": "Shower Name",
  "peak": "YYYY-MM-DD",
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD",
  "zhr": 100,
  "radiantRA": 6.3,
  "radiantDec": 15.6,
  "parentBody": "Comet Name",
  "description": "Plain language description.",
  "bestViewing": "After midnight, looking northeast"
}
```

### Special events

Edit `data/special-events.json`. Each entry needs:

```json
{
  "id": "unique-id",
  "name": "Event Name",
  "date": "YYYY-MM-DD",
  "type": "opposition | eclipse_lunar | eclipse_solar | meteor_shower | elongation | comet",
  "description": "What it is in plain language.",
  "why_special": "Why a curious non-expert should care.",
  "visibility_notes": "Where to look, who can see it."
}
```

Events outside the 90-day window are automatically hidden.

## Deployment

Deploy to Vercel in one command:

```bash
npx vercel
```

Add your environment variables in the Vercel dashboard under Project Settings > Environment Variables.

The app requires no database and has no user accounts. It is entirely stateless.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- HTML Canvas API (star field, sky map, planet orbs)
- Open Notify API (ISS position and pass times, no auth required)
- AstronomyAPI (planet and moon positions, free tier)
- NASA APOD API (daily space imagery, free)
- Browser Geolocation API
- Nominatim (OpenStreetMap) for reverse geocoding

## Architecture notes

Star positions are calculated from a hardcoded catalog of 100 bright stars using standard equatorial-to-horizontal coordinate transforms (hour angle, altitude, azimuth). This avoids runtime astronomical dependencies and gives full control over the visual rendering.

The quality score is calculated from: moon phase brightness (40%), historical cloud cover for the nearest known city in that month (40%), and estimated light pollution based on proximity to major urban centres (20%).

No data is stored. Coordinates are passed directly to API proxies and used only for sky calculations.
