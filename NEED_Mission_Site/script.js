(function(){
  const html = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) html.setAttribute('data-theme', saved);

  // Theme toggle
  const toggleBtn = document.querySelector('.theme-toggle');
  if (toggleBtn){
    toggleBtn.addEventListener('click', ()=>{
      const current = html.getAttribute('data-theme') || '';
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Mobile nav
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (navToggle && nav){
    navToggle.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Active link by page
  const page = document.body.getAttribute('data-page') || document.documentElement.getAttribute('data-page');
  document.querySelectorAll('.site-nav a').forEach(a=>{
    const href = a.getAttribute('href') || '';
    if (href.includes(page)) a.classList.add('active');
  });

  // Animated counters
  function animateCounter(el){
    const target = Number(el.getAttribute('data-count')) || 0;
    const start = 0;
    const duration = 1000;
    const t0 = performance.now();
    function step(t){
      const p = Math.min(1, (t - t0)/duration);
      el.textContent = Math.floor(start + (target - start) * p).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('.num[data-count]').forEach(animateCounter);

  // Simple tabs
  const tabs = document.querySelectorAll('[role=tab]');
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const parent = tab.parentElement;
      const id = tab.id.replace('tab-','panel-');
      parent.querySelectorAll('[role=tab]').forEach(t=>t.setAttribute('aria-selected','false'));
      tab.setAttribute('aria-selected','true');
      document.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden = true);
      const panel = document.getElementById(id);
      if (panel) panel.hidden = false;
    });
  });

  // Resource search
  const input = document.getElementById('search-input');
  if (input){
    input.addEventListener('input', ()=>{
      const q = input.value.trim().toLowerCase();
      document.querySelectorAll('.resource-card').forEach(card=>{
        const text = card.textContent.toLowerCase();
        const tags = (card.getAttribute('data-tags')||'').toLowerCase();
        card.style.display = (text.includes(q) || tags.includes(q)) ? '' : 'none';
      });
    });
  }

  // Filter chips (programs page)
  document.querySelectorAll('.chip[data-filter]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.chip[data-filter]').forEach(b=>b.setAttribute('aria-pressed','false'));
      btn.setAttribute('aria-pressed','true');
      const key = btn.getAttribute('data-filter');
      document.querySelectorAll('.program-list .card').forEach(card=>{
        if (key === 'all') { card.style.display = ''; return; }
        const show = card.classList.contains('tag-'+key);
        card.style.display = show ? '' : 'none';
      });
    });
  });

  // Helpers
  async function postJSON(url, data){
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = (payload && payload.message) ? payload.message : ('Request failed: ' + res.status);
      throw new Error(msg);
    }
    return payload;
  }
  async function getJSON(url){
    const res = await fetch(url);
    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = (payload && payload.message) ? payload.message : ('Request failed: ' + res.status);
      throw new Error(msg);
    }
    return payload;
  }
  function attachForm(id, endpoint, mapFn){
    const form = document.getElementById(id);
    if (!form) return;
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.style.marginTop = '.5rem';
    form.appendChild(status);
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      status.textContent = 'Submitting...';
      try{
        const fd = new FormData(form);
        const payload = mapFn ? mapFn(fd) : Object.fromEntries(fd.entries());
        await postJSON(endpoint, payload);
        status.textContent = 'Submitted successfully. Thank you!';
        form.reset();
      }catch(err){
        status.textContent = 'Error: ' + err.message;
      }
    });
  }

  // If site is served from 4000 (server serves static), API_BASE = ''.
  // If opened from another port (e.g., 5500), point to the local API.
  const API_BASE = 'http://localhost:4000';


  // Public forms
  attachForm('membership-form', `${API_BASE}/api/memberships`, (fd)=> ({
    name: fd.get('name') || '',
    email: fd.get('email') || '',
    type: fd.get('type') || '',
    city: fd.get('city') || '',
    message: fd.get('message') || ''
  }));
  attachForm('contact-form', `${API_BASE}/api/contact`, (fd)=> ({
    name: fd.get('name') || '',
    email: fd.get('email') || '',
    subject: fd.get('subject') || '',
    message: fd.get('message') || ''
  }));

  // Generic carousel initializer (works for hero & programs)
  function initCarousel(rootSelector, interval = 4000){
    const root = document.querySelector(rootSelector);
    if (!root || root.dataset.initialized === '1') return;
    root.dataset.initialized = '1';

    const track = root.querySelector('.carousel-track');
    const slides = Array.from(root.querySelectorAll('.slide'));
    const dotsWrap = root.querySelector('.carousel-dots');
    let i = 0, timer;

    const update = (n) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      dotsWrap.querySelectorAll('button').forEach((b, bi) =>
        b.setAttribute('aria-current', bi === i ? 'true' : 'false')
      );
    };

    // dots
    if (dotsWrap){
      dotsWrap.innerHTML = '';
      slides.forEach((_, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${idx + 1}`);
        b.addEventListener('click', () => { update(idx); restart(); });
        dotsWrap.appendChild(b);
      });
    }

    const next = () => update(i + 1);
    const restart = () => { clearInterval(timer); timer = setInterval(next, interval); };

    update(0);
    timer = setInterval(next, interval);
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', restart);
  }

  // Hero carousel (if present)
  initCarousel('.carousel');

  // Show Edit button when logged in (token set by admin.html)
  const editBtn = document.getElementById('edit-home-btn');
  if (editBtn && localStorage.getItem('adminToken')) {
    editBtn.hidden = false;
  }

  // Featured Programs → load from API, then init the right-side carousel
  (async ()=>{
    const wrap = document.querySelector('.programs-carousel');
    if (!wrap) return;
    try{
      const items = await getJSON(`${API_BASE}/api/programs`);
      const track = wrap.querySelector('.carousel-track');
      track.innerHTML = items.map(p=>`
        <article class="card slide">
          <h3>${p.title}</h3>
          <p>${p.body}</p>
          <a class="arrow" href="${p.link || '#'}">Learn more</a>
        </article>
      `).join('');
      initCarousel('.programs-carousel', 5000);
    }catch(err){
      // If API unavailable, keep the static slides already in the HTML
      console.error('Programs load failed:', err.message);
      initCarousel('.programs-carousel', 5000);
    }
  })();

  // Footer year
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
