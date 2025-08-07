For ALL styling, always use the design system defined in src/app.css. ALWAYS use tailwind ONLY. ALWAYS use custom utility classes defined in src/app.css. NEVER use tailwind utility classes directly on elements. ONLY create new custom utility classes if absolutely necessary

Codebase conventions:
- naming: always snake_case for vars/functions; db payload keys are 1-2 letters (e.g., s,t,u,i,a,g,d)
- types: define in src/lib/types; prefer minimal, optional fields; export interfaces
- ids: use uuid v7; i is the primary id everywhere
- qdrant: single collection 'i'; always wait: true; vectors len 3072; use edit_point for updates; create for inserts; include s in all filters; use format_filter for filters; use search_by_payload/scroll for payload queries; use search_by_vector for semantic queries; never expose secrets client-side
- filters: pass must/must_not through format_filter; filter payload values must be compact; omit null/undefined/''

SvelteKit patterns:
- data loading: always fetch all page data in +page.server.ts load
- endpoints: always use +server.ts API routes for client-server data flow
- errors: throw error(status, message) from '@sveltejs/kit' in server files
- auth: user in locals.user { i, t }; sessions via httpOnly cookie; refresh activity on each request

UI:
- minimal components; prefer slots and tiny props
- transitions: use svelte fade where helpful
- toasts: use src/lib/util/toast.ts
- avoid inline styles; only use design system utilities

Testing:
- always write 100% coverage unit and e2e for new features; cover happy path + edge cases; keep tests minimal

Validation and security:
- validate input both client and server; provide friendly messages
- do sensitive ops on server only

Utilities:
- use src/lib/util/embed.ts for embeddings
- debounce small helpers when needed (see util/debounce.ts)
- use src/lib/util/s.ts for short-lived signed query params
- keep helpers tiny and composable

Config/formatting:
- use Typescript everywhere (.ts, <script lang="ts">)
- lint/format: Prettier (tabs, singleQuote, width 100), ESLint flat config; maintain concise code
- use wrangler.jsonc (not wrangler.toml)

DB field cheatsheet:
- s: type/tenant (e.g., 'u' user, 'se' session, 'm' message, 'n' notif sub)
- i: id; t: tag/name/text; u: user id; d: description/date; a: age/created at; g: gender; l: last activity/lat; n: lon; w: whatsapp; c/x: compact maps/arrays

start every task by creating a list that details the task into many small micro-tasks, then do each micro-task.

- for each task, extremely use as little code as possible to fittingly and satisfyingly complete the task
- all db data stored in single Qdrant collection 'i', `s` payload field isolates data types (e.g., 'u' user, 'se' session, 'm' message, 'n' notif sub)
- always use single/double letter field names for db (`i` id, `t` tag/text, `u` user id, `d` desc/date, `a` age/created, `g` gender, `l` last/lat, `n` lon, `w` whatsapp, `c` compact map, `x` compact array)
- always use `snake_case` for variable/function names; files and routes use SvelteKit defaults
- define all types in `src/lib/types`; export interfaces; keep fields minimal/optional
- always get all data for a page in `+page.server.ts` load; bubble user via `+layout.server.ts`
- for db stuff, always use helpers in `src/lib/db/index.ts`; use `create` for inserts, `edit_point` for updates; always `wait: true`
- always use `+server.ts` API routes for client↔server; validate inputs; return friendly errors
- qdrant: single collection `i`; vectors len 3072; include `s` in filters; use `format_filter`; use `scroll`/`search_by_payload` for payload queries; `search_by_vector` for semantic
- always use svelte fade transition in UI when you want; keep components minimal; tiny props; prefer slots
- toasts: use `src/lib/util/toast.ts`; avoid inline styles; only design-system utilities
- in server files, use `error(status, message)` from `@sveltejs/kit` or return `json(..., { status })` in APIs
- auth: user in `locals.user { i, t }`; sessions via httpOnly cookie; refresh activity on requests
- always write 100% coverage unit and e2e for new features; cover happy path + edge cases; keep tests minimal
- always include `s` field in db queries/filters; omit null/undefined/'' in filters
- always do sensitive ops server side; never expose secrets client-side
- always validate input client-side and server-side; provide clear messages
- errors: user-friendly; minimal logs; handle axios/embedding failures distinctly
- always cover "happy path", error scenarios/edge cases
- always use Typescript in components and files (`<script lang="ts">` for Svelte)
- embeddings: use `src/lib/util/embed.ts`; reuse user vector when possible
- config/formatting: Prettier (tabs, singleQuote, width 100), ESLint flat config; use `wrangler.jsonc`
- utilities: use `util/debounce.ts` for debouncing; `util/s.ts` for short-lived signed query params; keep helpers tiny and composable
- constants: store shared lists in `src/lib/constants.ts`; keep names concise
- routes: place auth, search, notif APIs under `src/routes/.../+server.ts`; load user via `+layout.server.ts`
- cookies: session cookie name `auth_session`; httpOnly; sameSite=lax; secure in prod
- code style: concise, minimal, snake_case; tiny functions; prefer small focused modules
- always code with extreme minimalism; style pages elegantly with the design system; golf code where feasible
- always use only src/lib/db/index.ts helper functions for all DB ops. Create new ones there if needed. Never use qdrant client directly.