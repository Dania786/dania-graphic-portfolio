# Dania Hasnain — Portfolio Website

A static, dependency-free portfolio site (HTML5 / CSS3 / vanilla JS). No build step required.

## File structure
```
portfolio/
├── index.html              → Homepage (hero, about, philosophy, services, skills, portfolio, contact)
├── css/style.css            → All styles, incl. light/dark theme tokens
├── js/main.js                → Theme toggle, nav, scroll reveal, filtering, contact form
├── projects/                 → 10 individual case-study pages
└── assets/img/               → All images, optimized as compressed JPGs (profile photo kept as transparent PNG)
```

## 1. Activating the contact form (one-time step)
The contact form uses **FormSubmit** — no backend, no signup, free forever.

1. Deploy the site (see below).
2. Open the live contact form and submit it once with real details.
3. Check the inbox for **designbydaniahasnain@gmail.com** — FormSubmit will send a one-time confirmation email.
4. Click **"Activate Form"** in that email.
5. That's it — every submission after this point is delivered straight to your inbox automatically. You don't need to repeat this after future deploys, only once per email address.

If you ever want to skip the confirmation step, you can also activate it in advance by visiting:
`https://formsubmit.co/designbydaniahasnain@gmail.com` and following the on-page instructions before your first real form submission.

## 2. Deploying for free

### Option A — Netlify (drag-and-drop, easiest)
1. Go to https://app.netlify.com/drop
2. Drag the whole `portfolio` folder onto the page.
3. Netlify gives you a live URL immediately. You can rename it or connect a custom domain for free in Site Settings → Domain management.

### Option B — Vercel
1. Create a free account at https://vercel.com
2. Install the CLI: `npm i -g vercel`
3. From inside the `portfolio` folder, run: `vercel`
4. Follow the prompts (accept the defaults — no framework, no build command needed).
5. Run `vercel --prod` to push it live.

### Option C — GitHub Pages
1. Create a new GitHub repository and push the contents of the `portfolio` folder to it.
2. Go to the repo's **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, select `main` and the `/ (root)` folder.
4. Save — your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## 3. Editing content later
- All copy lives directly in the HTML files — open `index.html` or any file in `projects/` in a text editor and edit the text between tags.
- To swap an image, replace the file in `assets/img/` with a new one using the **same filename**, or update the `src="assets/img/..."` path in the HTML.
- Colors and fonts are controlled centrally in `css/style.css` under the `:root` section at the top of the file.

## 4. Adding a new case study
1. Duplicate any file in `projects/` as a starting template.
2. Update the text, images, palette, and typography sections.
3. Add an entry to `content/projects.json` (or use the CMS at `/admin/` — see below) linking to your new file.
4. Update the `case-nav` (Previous/Next) links on the two neighboring project pages so the new project is included in the loop.

## 5. Managing the portfolio without touching HTML (Decap CMS)
The homepage portfolio grid now renders from `content/projects.json` at page load, and that file is editable through a free admin panel at `/admin/` — powered by **Decap CMS**.

**One-time setup (Netlify, free):**
1. Deploy the site to Netlify (see Option A above).
2. In the Netlify dashboard: **Site settings → Identity → Enable Identity**.
3. **Identity → Registration → set to "Invite only"** (so the public can never sign up).
4. **Identity → Services → Git Gateway → Enable.**
5. Go to the **Identity** tab and **invite yourself** by email. You'll get an email to set a password.
6. Visit `yoursite.com/admin/`, log in, and you can now add, edit, delete, reorder, and feature portfolio projects, and upload new cover images — all without opening a code editor. Changes commit straight to the repo and go live on the next deploy (automatic on Netlify).

The admin panel is not linked from anywhere on the public site and only people you've explicitly invited can log in.

**If hosting on GitHub Pages or Vercel instead of Netlify:** Decap CMS still works, but the `git-gateway` backend in `admin/config.yml` needs to be swapped for the `github` backend plus a small free OAuth proxy (Decap's docs list a few zero-cost options). Netlify's Identity + Git Gateway is the only one of the three that needs no extra proxy at all.

**Scope note:** the CMS manages the **portfolio grid** (what's shown, in what order, which category, cover image, featured flag). It does not auto-generate brand-new case-study *pages* — this site is hand-built static HTML, not a site generator, so a genuinely new project still needs a new `projects/your-project.html` file created once (steps above), after which it's fully manageable from the CMS like every other project.

## 6. Hero video
`index.html`'s hero frame is wired for a video (`data-video-src` / `data-video-webm` on the `.frame` element) — autoplay, loop, muted, inline, with automatic fallback to the portrait poster image if the files are missing or `prefers-reduced-motion` is on. Drop matching exports at:
```
assets/video/hero.mp4   (H.264)
assets/video/hero.webm
```
and it activates automatically — no code changes needed. No video is included in this build: photorealistic video generated from a real portrait isn't something produced as part of this delivery, so this stays a real video export you supply (a videographer, stock cinemagraph, or a video tool you run yourself).

## 7. Image protection
Right-click, drag, and long-press-save are disabled on all portfolio thumbnails and case-study images, and every portfolio image carries a single, subtle signature mark — "DANIA HASNAIN" in thin white type at ~10% opacity, bottom-right corner only, never tiled or repeated — baked directly into the JPG. Regenerate it any time with `python3 watermark.py <input> <output>` at the project root if you replace an image later.

