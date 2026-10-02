# Causvia website

Static Vite site, deployed by Vercel on every push to `main` (https://causvia-website.vercel.app).

| Path | Source | What it is |
|---|---|---|
| `/` | `index.html` | The landing page and 3D flight |
| `/auth` | `auth.html`, `src/auth/` | Sign in and request early access |
| `/app` | `app.html`, `src/app/` | Placeholder workspace for approved users |
| `/privacy.html`, `/terms.html` | `public/` | Legal pages |

`/auth` and `/app` are clean URLs: `vercel.json` rewrites them in production and a small plugin in `vite.config.js` does the same locally.

## Local development

```bash
npm install
cp .env.example .env   # then fill in the two Supabase values
npm run dev            # http://localhost:5173, /auth, /app
```

`.env` is git-ignored. The same two variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are set in the Vercel project. Only ever use the **anon** key here; the service role key must never reach the browser.

## Sign-in and early access (Supabase)

Supabase project: **causvia** (`cdagxbuqvcsrbgynaarm`). The schema lives in `supabase/migrations/`.

- **Request access** saves a row to `access_requests` (status `pending`). The browser can insert but never read requests. There's one pending request per email, plus a honeypot field, a client-side rate limit and a server-side flood guard.
- **Sign in** works with email and password, a magic link, or Google or Microsoft (each button shows only once that provider is enabled in Supabase).
- After sign-in, `/auth` checks `profiles.approved`. Approved users go to `/app`. Everyone else sees "You're on the early-access list…" and is signed out.
- Every new auth user gets a `profiles` row automatically, with `approved = false` and their name and company copied from their access request.

### Approving a user

1. **Review requests.** In the Supabase dashboard, go to Table Editor and open `access_requests`, or run this in the SQL Editor:
   ```sql
   select name, email, company, role, team_size, workflow, created_at
   from access_requests where status = 'pending' order by created_at;
   ```
2. **Give them an account.** Go to Authentication > Users > Add user > Send invitation, and enter their work email. They get an email, open the link and set a password on `/auth`.
3. **Approve them** in the SQL Editor:
   ```sql
   select public.approve_user('name@company.com');
   ```
   This sets `profiles.approved = true` and marks their request `approved`. You can also tick `approved` on their row in Table Editor > `profiles`.
4. They sign in at `/auth` and land on `/app`.

To remove access, run:

```sql
update profiles set approved = false where id = (select id from auth.users where email = 'name@company.com');
```

To decline a request, run:

```sql
update access_requests set status = 'declined' where lower(email) = 'name@company.com';
```

### One-time dashboard settings

1. **Authentication > URL Configuration.**
   - Set the Site URL to `https://causvia-website.vercel.app`.
   - Add these redirect URLs: `https://causvia-website.vercel.app/**` and `http://localhost:5173/**`.
   - Without these, password-reset, magic-link, invite and Google/Microsoft links won't return to the site.
2. **Email delivery.** Supabase's built-in mailer only delivers to members of your Supabase team, and only a few emails an hour. Before inviting customers, add custom SMTP (for example Resend or Postmark, sending from a causvia.com address) under Authentication > Emails > SMTP Settings.
3. **Google.**
   - In Google Cloud Console, create an OAuth client of type "Web application".
   - Set its authorised redirect URI to `https://cdagxbuqvcsrbgynaarm.supabase.co/auth/v1/callback`.
   - In Supabase, go to Authentication > Sign In / Providers > Google, paste the client ID and secret, and enable it.
4. **Microsoft.**
   - In the Azure portal, go to App registrations > New registration and allow accounts in any organisational directory.
   - Add a Web redirect URI: the same callback URL as above.
   - Create a client secret.
   - In Supabase, go to Authentication > Sign In / Providers > Azure, paste the client ID and secret, and enable it.
5. **Confirm email** is already on (Authentication > Sign In / Providers > Email).

The Google and Microsoft buttons on `/auth` appear automatically once those providers are enabled; no redeploy is needed.
