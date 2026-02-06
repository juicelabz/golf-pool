# Fantasy Golf Pool Invitational

**TanStack Start** with **Bun** is about as high-performance as a TypeScript web app gets right now, and using **Better-Auth** with its built-in admin plugins will save you weeks of work on the commissioner/data-man access control.

A structured plan to transition your "Fantasy Golf Pool Invitational" from an Excel-based system to a modern web application.

---

## 1. The 2026 Tech Blueprint

Since you’re using TanStack Start, you'll be leveraging **Server Functions** to bridge the gap between your server-side database (Drizzle/Postgres) and the reactive client state in **TanStack DB**.

* **Runtime:** Bun (Native TypeScript execution, blazing fast).
* **Framework:** TanStack Start (File-based routing, type-safe data fetching).
* **Database:** * **Server-side:** Drizzle ORM + PostgreSQL (For persistent storage).
* **Client-side:** TanStack DB (To power the real-time leaderboard reactivity).


* **Auth:** Better-Auth (Using the `admin` plugin for James and Dan).
* **UI:** shadcn/ui (Accessible, consistent components).

---

## 2. Core Data Schema

Based on your rules and spreadsheet, your relational model needs to handle complex scoring logic (Standard, Double, Triple) and time-bound segments.

| Table | Key Fields | Purpose |
| --- | --- | --- |
| **Users** | `id`, `email`, `role` (Admin/Data/User), `isPaid` | Auth and access levels. |
| **Members** | `id`, `name`, `totalPoints`, `segmentPoints` | The 108 league participants. |
| **Rosters** | `memberId`, `pgaPlayerId`, `category` (1-10) | Link members to their 10 picks. |
| **Tournaments** | `id`, `name`, `type` (Std/Dbl/Trp), `segment` (1-5) | The 34 events in the schedule. |
| **PGA_Players** | `id`, `name`, `category` (1-7), `isEligible` | All golfers (Scottie Scheffler = Ineligible). |
| **Scoring** | `tournamentId`, `pgaPlayerId`, `rank`, `points` | Weekly results imported by Dan Culp. |

---

## 3. Implementation Roadmap

### Phase 1: Auth & Administrative Roles

Use Better-Auth’s `admin` plugin to define James and Dan as admins. This allows them to manage users and edit rosters directly from the UI.

* **James Mack (Commissioner):** Full access to ledger, payment status, and roster overrides.
* **Dan Culp (Data Man):** Access to the **Scoring Import** tool (CSV upload for weekly PGA ranks).

### Phase 2: The "Scoring Engine"

You need a helper function that maps a player's rank to the point table based on the tournament type.

```typescript
const POINTS_MAP = {
  Standard: [15, 10, 8, 7, 6, 5, 4, 3, 2, 1],
  Double:   [30, 20, 16, 14, 12, 10, 8, 6, 4, 2],
  Triple:   [45, 30, 24, 21, 18, 15, 12, 9, 6, 3],
};

function calculatePoints(rank: number, type: 'Standard' | 'Double' | 'Triple'): number {
  if (rank > 10) return 0;
  return POINTS_MAP[type][rank - 1]; // Includes ties per rules
}

```

### Phase 3: Live Leaderboard (TanStack DB)

To make the app feel "premium," use **TanStack DB** to sync the leaderboard. When Dan imports the latest Amex results, the leaderboard should update instantly for all members without a page refresh.

---

## 4. Specific Feature Checklist

* **Roster Import & Cleanup:**
* Address the **108 vs 109** discrepancy immediately. Create a "Review Queue" for James to manually approve the final roster list from the raw Google Form data.


* **The "Chalk" Counter:**
* Replicate the spreadsheet's "Chalk" sheet. Show members which players are the most "owned" in each category (e.g., "45% of the league picked Justin Thomas in Category 2").


* **Segment View:**
* The schedule is broken into 5 segments. Create a toggle on the leaderboard to switch between "Season Total," "Segment 1," etc..


* **Historical Data Migration:**
* Pre-populate the database with the Sony Open and American Express results from your current spreadsheet so the app starts with data.



---

### Would you like me to generate a Drizzle schema or a specific TanStack Start server function for the weekly scoring import?