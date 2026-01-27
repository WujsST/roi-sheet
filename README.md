# ROI Sheet

Aplikacja webowa do automatycznego monitorowania zwrotu z inwestycji (ROI) automatyzacji biznesowych. Pomaga agencjom automatyzacji i freelancerom śledzić oraz komunikować wartość ich pracy klientom.

## Główny przekaz

> **"Ile tracisz BEZ automatyzacji"** - odwrócona perspektywa, która skuteczniej komunikuje wartość.

## Tech Stack

| Technologia | Wersja | Opis |
|-------------|--------|------|
| Next.js | 16.1.4 | Framework React z App Router |
| React | 19.2.3 | Biblioteka UI |
| TypeScript | 5.x | Typowanie statyczne |
| Supabase | - | Backend (PostgreSQL + Auth) |
| Tailwind CSS | 4.x | Styling |
| Recharts | 3.x | Wykresy |
| Framer Motion | 12.x | Animacje |
| Lucide React | 0.563 | Ikony |

## Funkcjonalności

- **Dashboard** - Bento Grid z KPI (oszczędności, czas, efektywność)
- **Monitoring automatyzacji** - Status healthy/error/paused
- **Zarządzanie klientami** - Lista klientów z metrykami ROI
- **Raporty** - Generowanie i podgląd raportów PDF
- **System logów** - Monitoring działania systemu
- **"Koszt bezczynności"** - Wizualizacja strat bez automatyzacji

## Uruchomienie lokalne

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera developerskiego
npm run dev

# Build produkcyjny
npm run build

# Uruchomienie produkcyjne
npm run start
```

Aplikacja będzie dostępna na `http://localhost:3000`

## Zmienne środowiskowe

Utwórz plik `.env.local` w katalogu głównym:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

## Struktura projektu

```
roi-sheet/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard główny
│   ├── layout.tsx         # Layout z Sidebar
│   ├── actions.ts         # Server Actions (Supabase)
│   ├── automations/       # Zarządzanie automatyzacjami
│   ├── clients/           # Zarządzanie klientami
│   ├── reports/           # Raporty i podgląd PDF
│   ├── settings/          # Ustawienia
│   └── logs/              # System logów
├── components/            # Komponenty React
│   ├── BentoGrid.tsx     # Layout Bento
│   ├── StatCard.tsx      # Karty KPI
│   ├── ChartCard.tsx     # Wykresy
│   ├── Sidebar.tsx       # Nawigacja
│   └── ...
├── lib/
│   ├── utils.ts          # Utility functions
│   └── supabase/         # Konfiguracja Supabase
│       ├── client.ts     # Browser client
│       ├── server.ts     # Server client (SSR)
│       └── types.ts      # TypeScript interfaces
└── public/               # Statyczne zasoby
```

## Baza danych (Supabase)

### Tabele

| Tabela | Opis |
|--------|------|
| `automations` | Automatyzacje i ich statusy |
| `savings_history` | Historia oszczędności (wykres) |
| `dashboard_stats` | Agregaty KPI |
| `clients` | Klienci agencji |
| `reports` | Wygenerowane raporty |
| `system_logs` | Logi systemowe |

## Design System

**Motyw:** Dark Industrial Tech

| Element | Wartość |
|---------|---------|
| Background | `#000000` (pure black) |
| Cards | `#0a0a0a` (dark grey) |
| Text Primary | `#ffffff` |
| Text Muted | `#737373` |
| Success | `#22c55e` (green) |
| Warning | `#ef4444` (red) |
| Accent | `#8b5cf6` (purple) |

**Fonty:**
- Display: Space Grotesk
- Body: Inter

## Deployment

Aplikacja jest hostowana na Vercel z automatycznym CI/CD z GitHub.

```bash
# Deploy na Vercel
vercel --prod
```

## Licencja

MIT

---

Zbudowane z wykorzystaniem [Next.js](https://nextjs.org) i [Supabase](https://supabase.com).
