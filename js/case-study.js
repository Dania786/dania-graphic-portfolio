// ============================================================
// Case-study renderer — Phase 5 architecture.
// Every project page (existing files under /projects/*.html, and any brand
// new project created purely inside Decap CMS) renders from this single
// script + content/projects.json. Nothing about a project's content lives
// in HTML anymore: title, category, brief, process, colours, typography,
// logo, mockups, gallery, tools, deliverables, and prev/next nav are all
// read from the CMS data file at load time.
//
// Slug resolution order:
//   1. window.PROJECT_SLUG — set by the legacy /projects/<name>.html shells
//      so their existing URLs, canonical tags and social-share meta keep working.
//   2. ?p=<slug> — used by case-study.html, the generic template that any
//      brand-new CMS-only project resolves to automatically (no file ever
//      needs to be created for it).
// ============================================================
(function () {
  function getSlug() {
    if (window.PROJECT_SLUG) return window.PROJECT_SLUG;
    const params = new URLSearchParams(location.search);
    return params.get('p') || '';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function slugify(str) {
    return String(str || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Loads a Google Font by family name at runtime so CMS-entered typography
  // (any font name, not a fixed list) actually renders instead of falling
  // back to a generic system font.
  const loadedFonts = new Set();
  function ensureFontLoaded(fontName) {
    if (!fontName || loadedFonts.has(fontName)) return;
    loadedFonts.add(fontName);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(fontName).replace(/%20/g, '+') + ':wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  function setMeta(name, content, attr = 'name') {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function renderMeta(p, basePath) {
    const title = `${p.title} | Dania Hasnain — Graphic Designer`;
    document.title = title;
    setMeta('description', p.description);
    setMeta('og:title', `${p.title} — Case Study | Dania Hasnain`, 'property');
    setMeta('og:description', p.description, 'property');
    if (p.coverImage) setMeta('og:image', location.origin + '/' + basePath + p.coverImage, 'property');
    setMeta('twitter:title', `${p.title} — Case Study | Dania Hasnain`);
    setMeta('twitter:description', p.description);
    if (p.coverImage) setMeta('twitter:image', location.origin + '/' + basePath + p.coverImage);
  }

  function renderHero(p) {
    const catEl = document.getElementById('cs-category');
    const eyebrow = document.getElementById('cs-eyebrow');
    if (catEl) catEl.textContent = p.category || '';
    if (p.logo) {
      const row = document.getElementById('cs-title-row');
      if (row && !row.querySelector('.case-logo')) {
        const img = document.createElement('img');
        img.src = '../' + p.logo;
        img.alt = p.title + ' logo';
        img.className = 'case-logo';
        img.loading = 'lazy';
        row.prepend(img);
      }
    }
    const titleEl = document.getElementById('cs-title');
    if (titleEl) titleEl.textContent = p.title;
    const leadEl = document.getElementById('cs-lead');
    if (leadEl) leadEl.textContent = p.description || p.overview || '';

    const metaEl = document.getElementById('cs-meta');
    if (metaEl) {
      const rows = [
        ['Client', p.client || p.title],
        ['Service', p.service || p.category],
        ['Timeline', p.timeline],
        ['Software', (p.tools || []).join(', ')]
      ].filter(([, v]) => v);
      metaEl.innerHTML = rows.map(([k, v]) => `<div class="m"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join('');
    }
  }

  function renderCover(p, basePath) {
    const img = document.getElementById('cs-cover-img');
    if (img && p.coverImage) {
      img.src = basePath + p.coverImage;
      img.alt = p.coverAlt || p.title;
    }
  }

  function block(label, innerHtml) {
    return `<div class="case-block"><div class="label">${escapeHtml(label)}</div><div class="content">${innerHtml}</div></div>`;
  }

  function imageGrid(items, basePath) {
    if (!items || !items.length) return '';
    const cls = items.length === 1 ? 'case-gallery single' : 'case-gallery';
    return `<div class="${cls}">${items.map(m =>
      `<img src="${basePath}${escapeHtml(m.image)}" alt="${escapeHtml(m.alt || '')}" loading="lazy">`
    ).join('')}</div>`;
  }

  function renderBlocks(p, basePath) {
    const container = document.getElementById('cs-blocks');
    if (!container) return;
    let html = '';

    if (p.overview) html += block('Overview', `<p>${escapeHtml(p.overview)}</p>`);
    if (p.brief) html += block('Project Brief', `<p>${escapeHtml(p.brief)}</p>`);
    if (p.goal) html += block('Goal &amp; Challenge', `<p>${escapeHtml(p.goal)}</p>`);

    if (p.process && p.process.length) {
      const stepsHtml = p.process.map(step => `
        <div class="process-step">
          ${step.step_title ? `<h3>${escapeHtml(step.step_title)}</h3>` : ''}
          ${step.step_text ? `<p>${escapeHtml(step.step_text)}</p>` : ''}
          ${step.image ? imageGrid([{ image: step.image, alt: step.imageAlt || step.step_title }], basePath) : ''}
        </div>`).join('');
      html += block('Design Process', stepsHtml);
    }

    if (p.personality && p.personality.length) {
      html += block('Brand Personality', `<div class="chip-row">${p.personality.map(c => `<span class="chip">${escapeHtml(c)}</span>`).join('')}</div>`);
    }

    if (p.colors && p.colors.length) {
      const swatches = p.colors.map(c => `
        <div class="sw"><div class="box" style="background:${escapeHtml(c.hex || '#ccc')}"></div><span>${escapeHtml(c.label || '')}<br>${escapeHtml((c.hex || '').toUpperCase())}</span></div>`).join('');
      html += block('Colour Palette', `<div class="palette-row">${swatches}</div>`);
    }

    if (p.typography && p.typography.length) {
      p.typography.forEach(t => ensureFontLoaded(t.font_name));
      const samples = p.typography.map(t => `
        <div class="type-sample"><b style="font-family:'${escapeHtml(t.font_name || 'inherit')}',sans-serif;">Aa</b><span>${escapeHtml(t.font_name || '')}${t.role ? ' — ' + escapeHtml(t.role) : ''}</span></div>`).join('');
      html += block('Typography', `<div class="type-row">${samples}</div>`);
    }

    if (p.mockups && p.mockups.length) {
      html += block('Mockups', imageGrid(p.mockups, basePath));
    }

    if (p.outcome) html += block('Final Outcome', `<p>${escapeHtml(p.outcome)}</p>`);

    if (p.gallery && p.gallery.length) {
      html += block('Gallery', imageGrid(p.gallery, basePath));
    }

    if (p.tools && p.tools.length) {
      html += block('Tools Used', `<div class="chip-row">${p.tools.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>`);
    }

    if (p.deliverables && p.deliverables.length) {
      const cards = p.deliverables.map(d => `
        <div class="toolkit-card unavailable reveal">
          <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg></div>
          <h4>${escapeHtml(d)}</h4>
          <p>Available upon project completion.</p>
        </div>`).join('');
      html += `<div class="case-block toolkit"><div class="label">Client Toolkit</div><div class="content"><div class="toolkit-grid">${cards}</div></div></div>`;
    }

    container.innerHTML = html;
  }

  function projectHref(item) {
    // Legacy projects keep their existing filename URL (best for SEO/back-links);
    // anything added purely through the CMS resolves through the shared template.
    return item.link ? item.link : `case-study.html?p=${encodeURIComponent(item.slug)}`;
  }

  function renderNav(all, current, basePath) {
    const navEl = document.getElementById('cs-nav');
    if (!navEl) return;
    const sorted = all.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex(x => x.slug === current.slug);
    if (idx === -1) return;
    const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
    const next = sorted[(idx + 1) % sorted.length];

    function side(item, dir) {
      const cover = item.coverImage ? `<span class="case-nav-preview"><img src="${basePath}${escapeHtml(item.coverImage)}" alt="" loading="lazy"></span>` : '';
      const cat = item.category ? `<span class="case-nav-cat">${escapeHtml(item.category)}</span>` : '';
      const dirLabel = dir === 'prev' ? '&larr; Previous Project' : 'Next Project &rarr;';
      return `<a href="${basePath}${projectHref(item)}" class="${dir}${cover ? ' has-preview' : ''}">${cover}<span class="dir">${dirLabel}</span><span class="title">${escapeHtml(item.title)}</span>${cat}</a>`;
    }
    navEl.innerHTML = side(prev, 'prev') + side(next, 'next');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const isShell = !!document.getElementById('cs-title');
    if (!isShell) return; // not a case-study page

    const slug = getSlug();
    // Legacy shells live in /projects/, so their JSON image paths need '../' in front.
    // The generic case-study.html lives at site root, so paths are used as-is.
    const basePath = window.PROJECT_SLUG ? '../' : '';

    fetch(basePath + 'content/projects.json')
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data) ? data : data.items;
        const current = items.find(x => x.slug === slug);
        if (!current) {
          document.getElementById('cs-title').textContent = 'Project not found';
          const lead = document.getElementById('cs-lead');
          if (lead) lead.textContent = "This project may have been renamed or removed. Please check the portfolio for the latest work.";
          return;
        }
        renderMeta(current, basePath);
        renderHero(current);
        renderCover(current, basePath);
        renderBlocks(current, basePath);
        renderNav(items, current, basePath);

        // hand off to main.js's shared reveal/drag-protection logic, which
        // watches for these exact class names and applies itself generically
        document.dispatchEvent(new CustomEvent('case-study:rendered'));
      })
      .catch(() => {
        const lead = document.getElementById('cs-lead');
        if (lead) lead.textContent = 'Could not load project data right now — please refresh.';
      });
  });
})();
