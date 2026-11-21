# PizzaHub Web

The Next.js client for PizzaHub, a multi-vendor pizza ordering platform. It
pairs with the Express API in `../server`.

The visual identity (cream/brown/red palette, typography, spacing, hero,
category cards, animations and footer) is the approved design from earlier
iterations. This build keeps that design and wires every page to the real API —
there is no demo or placeholder data left in the UI.

## Links

- Live client website URL: <https://pizza-hub-client.vercel.app>
- Live API deployment: <https://pizza-hub-server.vercel.app>
- Client GitHub repository URL: <https://github.com/Emransani01/PizzaHub-Client>
- Server GitHub repository URL: <https://github.com/Emransani01/PizzaHub-Server>

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + the existing design tokens |
| UI | Local shadcn/base-ui components, Lucide icons, Sonner toasts |
| Auth client | `better-auth/react` |
| API transport | `fetch` wrapper with in-memory JWT and automatic refresh |

## Requirements

- Node.js 22.12.x, 24.x, or 26.x
- npm 10 or newer
- The PizzaHub API running (see `../server/README.md`)

## Setup

```bash
cd client
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `API_URL` | no | Origin of the Express API. Defaults to `http://localhost:5000`. Used by the `/api/*` rewrite and by the homepage's server-side fetches. |

That is the only variable the client needs. Every secret (MongoDB URI, Better
Auth secret, JWT secret, Stripe keys, ImgBB key, Google OAuth credentials) lives
in `server/.env` only and is never exposed to the browser.

### Same-origin API

`next.config.ts` rewrites `/api/:path*` to `${API_URL}/api/:path*`. Because the
browser only ever talks to the Next.js origin:

- the Better Auth session cookie is first-party, so OAuth callbacks and cookie
  refreshes work without SameSite workarounds,
- no CORS preflight is needed in the browser,
- no API host is baked into client bundles.

For deployment, point `API_URL` at the public API origin (for example
`https://pizzahub-api.example.com`) and set the server's `CLIENT_URL` /
`BETTER_AUTH_URL` to the deployed frontend origin.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000. |
| `npm run build` | Production build (also runs the TypeScript check). |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint with the Next.js core-web-vitals + TypeScript configs. |
| `npm test` | Run the Vitest test suite. |
| `npx tsc --noEmit` | Standalone type check. |

## Authentication flow and JWT verification middleware

1. Sign-up and sign-in go through Better Auth (`authClient.signIn.email`,
   `authClient.signUp.email`). New accounts are never created as admins.
   Sign-up supports choosing **customer** or **vendor** (with business name for
   vendors) and an **optional profile image upload** via ImgBB when configured
   (skippable; can be added later in Profile Settings).
2. The role is written once through `POST /api/users/me/role` (accepts only
   `customer` or `vendor`). `admin` can never be selected in the UI and the API
   rejects it.
3. `AuthProvider` calls `GET /api/auth/token`, which exchanges the HttpOnly
   Better Auth session cookie for a **short-lived HS256 JWT kept in a module
   variable** — never in `localStorage` or a readable cookie.
4. `apiFetch` attaches `Authorization: Bearer <token>`. On `401` it asks for a
   fresh token once and retries the request.
5. **Server-side verification (authoritative):** the API's `authenticate`
   middleware verifies JWT signature/issuer/audience/expiration, reloads the user
   from MongoDB, and rejects invalid/expired tokens with `401`. `checkBlockedUser`
   blocks protected operations for blocked accounts (`403`), `authorizeRole(...)`
   enforces role access (`403`), and services enforce ownership/state transitions
   (never trusting client-supplied user ID/role). Item detail pages require
   authentication; unauthenticated users are redirected to Sign In. Ordering and
   protected actions also require server-side authorization.
6. Signing out clears the in-memory token and the session cookie.

`src/proxy.ts` performs a cookie-presence check for nicer navigation. It is a UX
shortcut only; every real permission check happens in the Express API.

### Role-based dashboards

`/dashboard` redirects to the signed-in user's home. `src/app/dashboard/layout.tsx`
guards the vendor and admin sections client-side and shows a loader while the
session resolves. The API independently enforces every rule, so hiding a link is
never the security boundary.

| Role | Dashboard |
| --- | --- |
| customer | Overview, my orders (filters, cancel while pending, status timeline), favourites |
| vendor | Overview, my menu items, add/edit item, customer orders, subscription |
| admin | Overview, manage users, approve/reject menu items, read-only transactions |

## Pages

| Route | Description |
| --- | --- |
| `/` | Homepage: live featured dishes, category cards, how it works, vendor CTA |
| `/browse-menu` | Search, category/location filters, sorting, pagination |
| `/cart` | Signed-in customer cart with quantity controls and price-change review (requires authentication) |
| `/checkout` | Signed-in customer checkout with authoritative order quote (requires authentication) |
| `/menu/[id]` | Item gallery, details, favourite toggle, order form (no payment); requires authentication and redirects unauthenticated users to Sign In |
| `/favorites` | The signed-in customer's saved dishes |
| `/sign-in`, `/sign-up`, `/choose-role` | Authentication and role onboarding |
| `/profile-settings` | Name, avatar (ImgBB upload), vendor business name |
| `/dashboard/customer` | Customer overview |
| `/dashboard/customer/my-orders` | Order history, cancellation, status timeline |
| `/dashboard/vendor` | Kitchen overview with free-plan usage |
| `/dashboard/vendor/my-menu-items` | Availability toggle, edit, delete |
| `/dashboard/vendor/add-menu-item` | Create a listing (goes to admin review) |
| `/dashboard/vendor/my-menu-items/[id]/edit` | Edit a listing (content edits need re-approval) |
| `/dashboard/vendor/customer-orders` | Accept/reject orders with an optional note |
| `/dashboard/vendor/subscription` | Free vs Premium, Stripe checkout, payment history |
| `/dashboard/admin` | Platform overview |
| `/dashboard/admin/manage-users` | Search/filter accounts, block/unblock |
| `/dashboard/admin/manage-menu-items` | Approve/reject, change status, delete inappropriate items |
| `/dashboard/admin/transactions` | Read-only Stripe records |
| `/payment-success` | Polls the checkout status; never grants Premium itself |
| `/payment-cancel` | Explains that no payment was taken |

## Advanced search and sorting implementation

Browse Menu combines multiple server-side controls against `GET /api/menu-items`:

- **Search:** text query matched server-side (case-insensitively) across item name
  and description.
- **Filters:** category (six fixed categories) and exact location selected from
  `GET /api/menu-items/locations`; both combine with search and sorting.
- **Sorting:** newest (default), price ascending, price descending.
- **Pagination and states:** paged results with explicit loading, empty, and error
  states. Public listings show only admin-approved and available items.

## Business rules reflected in the UI

- **Customer orders are free.** There is no card step anywhere in the order
  flow; Stripe is only reachable from the vendor subscription page.
- **Free vendors** can hold 3 approved-and-available items. The dashboard shows
  usage, and creating/updating beyond the cap fails with the server's message.
  Pending and rejected items do not count.
- **Premium** is activated only by the verified Stripe webhook. `/payment-success`
  polls `GET /api/subscriptions/checkout/:sessionId` and reports the transaction
  status; it never upgrades the account. Expired/failed/cancelled checkout states
  are surfaced without granting Premium.
- **Approval lifecycle:** statuses are `pending`, `approved`, `rejected` and
  `inactive`. New and content-edited items are `pending` until an admin approves
  them; admins can pause published items as `inactive`, and vendors can toggle
  availability between `approved` and `inactive`. Rejections carry an optional
  reason shown to the vendor. Inactive and rejected items never appear publicly
  and cannot be ordered. Admins can delete inappropriate items (blocked when an
  item has order history).
- **Menu images:** add/edit menu items require uploading 1–3 image files through
  ImgBB (no pasted URL option); sign-up supports an optional profile image upload.
- **Order timeline:** every accepted/rejected/cancelled transition is listed with
  its actor role, timestamp and note.
- **Favourites** are stored per account, not per browser.
- **Transactions** are read-only for administrators; the UI states this and there
  is no edit control.

## Server-side rendering notes

The homepage fetches live menu data on the server through
`src/lib/server-api.ts`. Those fetches call `connection()` so they run per
request instead of being frozen into the static prerender; if the API is
unreachable the sections degrade gracefully instead of failing the build.
Client pages fetch through `apiFetch` inside effects and render explicit loading,
empty and error states.

Instant-navigation validation therefore runs in `manual-warning` mode: the
dashboard pages are interactive client components that only render after the
session resolves, so automatic validation would always observe the
"Checking your access" shell. Routes can still opt in with `export const instant`
once they are ready.

## Lint note

`eslint.config.mjs` disables exactly one React Compiler rule,
`react-hooks/set-state-in-effect`. The client fetches data with
`useEffect` + `fetch` (no data-fetching library), and that rule flags the
synchronous `setLoading(true)` / `setError(null)` at the start of such effects.
All other hooks rules stay enabled.

## Testing instructions

From `client/`:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- `npm run build` runs the TypeScript production build and is the authoritative
  client type/build check.
- For integration verification, run the API from `../server` (`npm run dev`) with
  required env vars configured and exercise auth, role-gated dashboards, menu
  CRUD/uploads (ImgBB), ordering/timelines, and subscription checkout flows in
  the browser.
- Stripe checkout testing (Vendor Premium only): use Stripe test mode, complete or
  cancel checkout, and confirm Premium changes only after verified webhook events
  (`/payment-success` only reports status). Google/ImgBB flows require their
  respective credentials and enabled configuration.

## Deployment notes

- The API is currently deployed on Vercel at
  <https://pizza-hub-server.vercel.app>. The client is deployed on Vercel at
  <https://pizza-hub-client.vercel.app>.
- Deploy the client (Vercel or another Next.js host), then set `API_URL` to the
  public API HTTPS origin and build the client.
- Set the API's `CLIENT_URL` and `BETTER_AUTH_URL` to the deployed client origin.
- Configure the Google OAuth redirect URI as
  `<CLIENT_ORIGIN>/api/auth/callback/google`.
- Point the Stripe webhook at `<API_URL>/api/subscriptions/webhook` (subscribe to
  `checkout.session.completed`, `checkout.session.expired`,
  `checkout.session.async_payment_failed`, `invoice.paid`,
  `invoice.payment_failed`, `customer.subscription.updated`,
  `customer.subscription.deleted`); the success URL should be
  `<CLIENT_ORIGIN>/payment-success` and the cancel URL
  `<CLIENT_ORIGIN>/payment-cancel`.
- Remote images are allowed from `i.ibb.co`, `ibb.co` and
  `images.unsplash.com` (see `next.config.ts`). Add any new image host there.
- Ensure direct navigation/refresh works on deployed routes and private-route
  sessions persist over HTTPS (first-party cookie via same-origin `/api` proxy).

## Project layout

```
client/
  src/
    app/            routes (App Router)
    components/     home, menu, dashboard, forms, shared and ui components
    constants/      routes, labels, categories, dashboard navigation
    lib/            api transport, auth client, server fetches, utils
    providers/      auth and app-wide providers
    services/       typed API wrappers per domain
    types/          shared API types
  next.config.ts    /api rewrite and remote image allowlist
  src/proxy.ts      cookie-presence navigation guard (UX only)
```
