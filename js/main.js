// ============ Theme toggle ============
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('dh-theme');
  const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', preferred);

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = root.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('dh-theme', next);
      });
    }
  });
})();

// ============ Header scroll state + mobile nav ============
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  });

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  // ============ Scroll reveal (replays gently on re-entry, never distracting) ============
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-apply the site's reveal animation to project/case-study pages.
  // This targets the shared class names used across every sample page
  // (case-hero, case-cover, case-block, case-nav, etc.) instead of hard-coding
  // any single project — so any sample opened today, and any new project
  // page added later (manually or via the CMS), gets the same animation
  // automatically with zero extra setup.
  document.querySelectorAll(
    '.case-hero .eyebrow, .case-hero h1, .case-hero .lead, .case-meta, .case-cover, .case-block, .case-nav'
  ).forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.case-cover, .p-card .thumb').forEach(el => el.classList.add('img-reveal'));

  // ============ Scroll progress indicator ============
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);
  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = pct + '%';
  }, { passive: true });

  // ============ Button ripple ============
  document.querySelectorAll('.btn, .filter-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.8;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  });

  // Give the contact section its own clearly-visible, field-by-field animation
  // instead of one single block fading in — each label/input/button reveals
  // in a quick stagger as the section scrolls into view.
  document.querySelectorAll(
    '.contact-info > *, .contact-form .field, .contact-form .submit-btn'
  ).forEach(el => el.classList.add('reveal'));

  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('out');
        entry.target.classList.add('in');
      } else if (entry.target.classList.contains('in') && !reduceMotion) {
        // only reset elements that have scrolled well clear of the viewport,
        // so the replay feels intentional rather than flickery
        const rect = entry.target.getBoundingClientRect();
        const clearAbove = rect.bottom < -80;
        const clearBelow = rect.top > window.innerHeight + 80;
        if (clearAbove || clearBelow) {
          entry.target.classList.remove('in');
          entry.target.classList.add('out');
        }
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el, i) => {
    el.style.setProperty('--i', i % 6);
    io.observe(el);
  });

  // ============ Skill bars ============
  const bars = document.querySelectorAll('.bar i');
  const barIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.value + '%';
        barIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => barIo.observe(b));

  // ============ Portfolio grid: render from content/projects.json (CMS-editable) ============
  const grid = document.getElementById('portfolio-grid');
  if (grid) {
    fetch('content/projects.json')
      .then(res => { if (!res.ok) throw new Error('no CMS data'); return res.json(); })
      .then(data => {
        const projects = Array.isArray(data) ? data : data.items;
        if (!Array.isArray(projects) || !projects.length) return;
        const sorted = projects.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        grid.innerHTML = sorted.map((p, i) => `
          <a href="${p.link}" class="p-card reveal" data-cat="${p.cat_key}" style="--i:${i % 6}">
            <div class="thumb img-reveal"><img src="${p.image}" alt="${(p.title + ' — ' + p.category).replace(/"/g, '&quot;')}" loading="lazy"></div>
            <div class="info"><span class="tag">${p.category}${p.featured ? ' · Featured' : ''}</span><h3>${p.title}</h3><p>${p.description}</p></div>
            <span class="arrow"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg></span>
          </a>`).join('');
        initPortfolioInteractivity();
      })
      .catch(() => {
        // content/projects.json unavailable (e.g. opened via file:// or offline) — the
        // server-rendered cards already in the HTML stay exactly as they are.
        initPortfolioInteractivity();
      });
  } else {
    initPortfolioInteractivity();
  }

  function initPortfolioInteractivity() {
    // newly injected cards + images need the same protections and reveal behaviour
    document.querySelectorAll('.thumb img, .case-cover img, .case-gallery img').forEach(img => {
      img.setAttribute('draggable', 'false');
      img.addEventListener('dragstart', e => e.preventDefault());
      img.addEventListener('contextmenu', e => e.preventDefault());
    });
    document.querySelectorAll('.p-card.reveal').forEach(el => io.observe(el));

    // ============ Portfolio filter (with soft fade/scale transition) ============
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.p-card');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;

        cards.forEach(card => card.classList.add('filtering'));

        window.setTimeout(() => {
          cards.forEach((card, i) => {
            const match = cat === 'all' || card.dataset.cat === cat;
            card.classList.toggle('hide', !match);
            if (match) {
              card.style.transitionDelay = (i % 6) * 60 + 'ms';
            }
          });
          // force reflow so the transition re-triggers
          void document.querySelector('.portfolio-grid')?.offsetWidth;
          cards.forEach(card => card.classList.remove('filtering'));
          window.setTimeout(() => cards.forEach(card => { card.style.transitionDelay = ''; }), 500);
        }, 220);
      });
    });
  }

  // ============ Scroll-spy nav indicator ============
  const sectionIds = ['about', 'services', 'portfolio', 'contact'];
  const spySections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const spyLinks = document.querySelectorAll('.nav-links a[href*="#"]');
  if (spySections.length && spyLinks.length) {
    const spyIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          spyLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').endsWith('#' + id));
          });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    spySections.forEach(sec => spyIo.observe(sec));
  }

  // ============ Soft parallax on hero visuals ============
  const parallaxLayers = document.querySelectorAll('[data-parallax-layer]');
  if (parallaxLayers.length) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      parallaxLayers.forEach(layer => {
        const speed = parseFloat(layer.dataset.parallaxLayer) || 0.2;
        layer.style.transform = `translateY(${y * speed * 0.15}px)`;
      });
    }, { passive: true });
  }

  // ============ Premium page transition on internal navigation ============
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.classList.add('active');
      window.setTimeout(() => { window.location.href = href; }, 320);
    });
  });

  // ============ Hero video (activates only if a real video export exists) ============
  const heroFrame = document.querySelector('[data-hero-frame]');
  if (heroFrame && !reduceMotion) {
    const mp4 = heroFrame.dataset.videoSrc;
    const webm = heroFrame.dataset.videoWebm;
    if (mp4 || webm) {
      const video = document.createElement('video');
      video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
      video.preload = 'metadata';
      if (webm) { const s = document.createElement('source'); s.src = webm; s.type = 'video/webm'; video.appendChild(s); }
      if (mp4) { const s = document.createElement('source'); s.src = mp4; s.type = 'video/mp4'; video.appendChild(s); }
      video.addEventListener('canplay', () => heroFrame.classList.add('video-ready'), { once: true });
      video.addEventListener('error', () => video.remove()); // silently keep the poster image
      heroFrame.appendChild(video);
      video.play().catch(() => { /* poster stays visible until interaction is possible */ });
    }
  }

  // Dim the hero visual slightly as the next section overlaps, restore on the way back up
  const heroSection = document.querySelector('.hero');
  if (heroFrame && heroSection) {
    const dimIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        heroFrame.classList.toggle('hero-dimmed', entry.intersectionRatio < 0.6 && entry.boundingClientRect.top < 0);
      });
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    dimIo.observe(heroSection);
  }

  // Very subtle mouse-move depth effect on the hero visual (desktop only)
  const heroVisual = document.querySelector('[data-hero-visual]');
  if (heroVisual && window.matchMedia('(min-width: 901px)').matches && !reduceMotion) {
    heroVisual.setAttribute('data-mouse-depth', '');
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      heroVisual.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }

  // ============ Contact form (FormSubmit AJAX) ============
  const form = document.querySelector('#contact-form');
  if (form) {
    const msg = form.querySelector('.form-msg');
    const submitBtn = form.querySelector('.submit-btn');
    const renderedAtField = form.querySelector('#form-rendered-at');
    const honeyField = form.querySelector('#hp-website');
    if (renderedAtField) renderedAtField.value = String(Date.now());

    const FIELD_RULES = {
      name: { required: true, minLength: 2, message: 'Please enter your name.' },
      email: {
        required: true,
        test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Please enter a valid email address.'
      },
      message: { required: true, minLength: 10, message: 'Tell me a little more about your project (10+ characters).' }
    };

    const setFieldError = (id, text) => {
      const input = form.querySelector('#' + id);
      const err = form.querySelector(`[data-err-for="${id}"]`);
      if (input) input.classList.toggle('invalid', !!text);
      if (err) err.textContent = text || '';
    };

    const validateField = (id) => {
      const rule = FIELD_RULES[id];
      const input = form.querySelector('#' + id);
      if (!rule || !input) return true;
      const value = input.value.trim();
      if (rule.required && !value) { setFieldError(id, rule.message); return false; }
      if (rule.minLength && value.length < rule.minLength) { setFieldError(id, rule.message); return false; }
      if (rule.test && !rule.test(value)) { setFieldError(id, rule.message); return false; }
      setFieldError(id, '');
      return true;
    };

    Object.keys(FIELD_RULES).forEach(id => {
      const input = form.querySelector('#' + id);
      if (input) input.addEventListener('blur', () => validateField(id));
    });

    const showMsg = (type, text) => {
      msg.style.display = type ? 'block' : 'none';
      msg.className = 'form-msg' + (type ? ' ' + type : '');
      msg.textContent = text || '';
    };

    const setSending = (isSending) => {
      submitBtn.disabled = isSending;
      submitBtn.classList.toggle('is-sending', isSending);
    };

    const buildMailtoFallback = () => {
      const name = form.querySelector('#name')?.value || '';
      const email = form.querySelector('#email')?.value || '';
      const service = form.querySelector('#service')?.value || '';
      const message = form.querySelector('#message')?.value || '';
      const body = `Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`;
      return `mailto:designbydaniahasnain@gmail.com?subject=${encodeURIComponent('New project inquiry from portfolio site')}&body=${encodeURIComponent(body)}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showMsg('', '');

      // Silent bot rejection: honeypot filled, or the form was "filled" in under 2 seconds.
      const tooFast = renderedAtField && (Date.now() - Number(renderedAtField.value || 0)) < 2000;
      if ((honeyField && honeyField.value) || tooFast) {
        showMsg('success', "Thank you — your message is on its way. I'll get back to you within 1–2 business days.");
        form.reset();
        return;
      }

      const fieldsValid = Object.keys(FIELD_RULES).map(validateField).every(Boolean);
      if (!fieldsValid) {
        showMsg('error', 'Please fix the highlighted fields before sending.');
        form.querySelector('.invalid')?.focus();
        return;
      }

      setSending(true);
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        const data = await res.json().catch(() => null);
        if (res.ok && (!data || data.success === undefined || data.success === 'true' || data.success === true)) {
          showMsg('success', "Thank you — your message is on its way. I'll get back to you within 1–2 business days.");
          form.reset();
          if (renderedAtField) renderedAtField.value = String(Date.now());
        } else {
          throw new Error('Request failed');
        }
      } catch (err) {
        msg.style.display = 'block';
        msg.className = 'form-msg error';
        msg.innerHTML = '';
        const p = document.createElement('p');
        p.textContent = "Couldn't send automatically just now — your message wasn't lost, though.";
        const a = document.createElement('a');
        a.href = buildMailtoFallback();
        a.className = 'form-msg-fallback-link';
        a.textContent = 'Send it via your email app instead →';
        msg.appendChild(p);
        msg.appendChild(a);
      } finally {
        setSending(false);
      }
    });
  }

  // ============ Portfolio image protection (non-destructive) ============
  // Discourages casual drag-save / right-click-save on portfolio artwork only.
  // Does not touch text selection, keyboard navigation, or screen-reader access.
  document.querySelectorAll('.p-card .thumb img, .case-cover img, .case-block img').forEach(img => {
    img.setAttribute('draggable', 'false');
    img.addEventListener('dragstart', e => e.preventDefault());
    img.addEventListener('contextmenu', e => e.preventDefault());
  });

  // ============ Case-nav preview cards (Previous/Next) ============
  // Pulls cover images + categories straight from content/projects.json so the
  // Previous/Next cards look premium automatically for every project the CMS
  // manages -- no per-page HTML editing required, ever.
  const caseNav = document.querySelector('.case-nav');
  if (caseNav) {
    fetch('../content/projects.json')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data || !Array.isArray(data.items)) return;
        const byFile = {};
        data.items.forEach(item => {
          const file = (item.link || '').split('/').pop();
          if (file) byFile[file] = item;
        });
        caseNav.querySelectorAll('a.prev, a.next').forEach(link => {
          const file = (link.getAttribute('href') || '').split('/').pop();
          const info = byFile[file];
          if (!info || !info.image) return;
          const preview = document.createElement('span');
          preview.className = 'case-nav-preview';
          const img = document.createElement('img');
          img.src = '../' + info.image;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.setAttribute('draggable', 'false');
          preview.appendChild(img);
          link.classList.add('has-preview');
          link.prepend(preview);
          if (info.category) {
            const tag = document.createElement('span');
            tag.className = 'case-nav-cat';
            tag.textContent = info.category;
            link.appendChild(tag);
          }
        });
      })
      .catch(() => { /* Cards still work as plain text links if this fails */ });
  }
});
