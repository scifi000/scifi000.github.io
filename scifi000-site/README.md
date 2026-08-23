# scifi000 — starter site

A placeholder site modeled on angelrot.com's layout (Releases / Feed / Links /
Newsletter), plus two of the effects from our chat:

- an intro screen that "melts" into the main site on click (SVG noise
  distortion + a shrinking circular mask)
- a cursor-reactive parallax "depth field" in the hero section

Everything is plain HTML/CSS/JS — no build step, no framework, no backend.
That's what makes it work on GitHub Pages for free.

## File structure

```
scifi000/
├── index.html      the whole page (intro overlay + main site markup)
├── css/style.css   all styling, incl. the intro/melt CSS and hero layout
├── js/main.js      melt transition logic, parallax logic, form placeholder
└── assets/         put images/audio/video here as you add real content
```

Every file has comments explaining what each block does — read through
`js/main.js` first, it's the most "interesting" part.

## 1. Check your GitHub username

GitHub Pages' free root URL is exactly `<your-username>.github.io` — it is
NOT a name you choose independently. Go to github.com/settings/profile and
confirm your actual username. Everywhere below, replace `YOUR-USERNAME`
with that real value.

Because your username isn't literally `scifi000`, this project will live at:

```
https://YOUR-USERNAME.github.io/scifi000/
```

(a "project site," not a root user site — still 100% free, just a
slightly longer URL). If you ever want the bare `scifi000.com` instead,
skip to step 5.

## 2. Create the repo on GitHub

1. Go to github.com → **New repository**
2. Name it exactly `scifi000`
3. Keep it **Public** (GitHub Pages on a free account requires a public
   repo, unless you're on GitHub Pro/Team/Enterprise)
4. Don't initialize with a README (you already have one) — leave it empty
5. Click **Create repository**

## 3. Push this project to it

Open a terminal in this folder (`scifi000/`) and run:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/scifi000.git
git push -u origin main
```

(First time using git on this machine? It may ask you to set your name/email
— `git config --global user.name "..."` and `user.email "..."` — and to
authenticate with GitHub, usually via a browser prompt or a personal access
token.)

## 4. Turn on GitHub Pages

1. On the repo's GitHub page, go to **Settings → Pages**
2. Under "Build and deployment" → Source, choose **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)` → **Save**
4. Wait a minute or two, then refresh — GitHub shows you the live URL:
   `https://YOUR-USERNAME.github.io/scifi000/`

That's it — it's live, and free.

## 5. (Later, optional) point a real domain at it

1. Buy a domain from any registrar (Namecheap, Cloudflare, etc.)
2. At the registrar, add DNS records pointing at GitHub:
   - an `A` record for the root domain, or a `CNAME` record if using `www`
   - (GitHub's docs list the exact current IP addresses to use — search
     "GitHub Pages custom domain DNS records" for the up-to-date values)
3. Back in the repo: **Settings → Pages → Custom domain**, enter your
   domain, save. GitHub creates a `CNAME` file in your repo automatically.
4. Once DNS propagates, check "Enforce HTTPS" in that same settings panel.

Your old `YOUR-USERNAME.github.io/scifi000/` link will then automatically
redirect to the new domain.

## Where to go from here

- Swap the placeholder text/stats/bio in `index.html` for real content
- Drop real images into `assets/` and reference them (e.g. as a background
  or a logo in the intro)
- Replace the Releases placeholder box with a real Spotify/SoundCloud
  `<iframe>` embed (copy-paste from either platform's "share/embed" option)
- Wire the newsletter form to a real service (Formspree, Mailchimp, or
  ConvertKit) instead of the placeholder handler in `main.js`
- If you want the melt effect to look more "liquid" rather than "static-y,"
  that's the natural next step up — a WebGL/GLSL shader instead of the SVG
  filter — but it's a meaningfully bigger lift, worth doing only once this
  version feels too limited.
