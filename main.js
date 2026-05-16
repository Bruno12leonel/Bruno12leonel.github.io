/* navbar — scroll & mobile toggle */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const navLinks  = document.getElementById('nav-links');
  const navToggle = document.getElementById('nav-toggle');
  const links     = navLinks.querySelectorAll('a');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    highlightActiveSection();
  });

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  function highlightActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }
})();

/* theme toggle */
(function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();

/* hero canvas — multi-agent architecture diagram */
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], particles = [];

  function getColors() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      surface:   light ? '#e4dfd8' : '#181818',
      border:    light ? '#c0b8ae' : '#303030',
      borderHi:  light ? '#907870' : '#505050',
      accent:    '#c8622e',
      accentDim: light ? 'rgba(200,98,46,0.14)' : 'rgba(200,98,46,0.12)',
      text:      light ? '#1a1714' : '#d8d2c8',
      textDim:   light ? '#6c6058' : '#6a6460',
    };
  }

  // Node layout: positions as fractions of W and H
  // 3 tiers, max 3 nodes wide — safe for any reasonable canvas width
  const DEFS = [
    { id: 'orch',   label: 'ORCHESTRATOR', sub: 'LLM RUNTIME',  rx: 0.50, ry: 0.12, main: true },
    { id: 'rag',    label: 'RAG AGENT',    sub: 'RETRIEVAL',     rx: 0.18, ry: 0.44 },
    { id: 'mcp',    label: 'MCP SERVER',   sub: 'TOOL GATEWAY',  rx: 0.50, ry: 0.44 },
    { id: 'prompt', label: 'PROMPT ENG',   sub: 'FEW-SHOT',      rx: 0.82, ry: 0.44 },
    { id: 'vecdb',  label: 'VECTOR DB',    sub: 'EMBEDDINGS',    rx: 0.18, ry: 0.78 },
    { id: 'tools',  label: 'TOOLS',        sub: 'SEARCH · CODE', rx: 0.50, ry: 0.78 },
    { id: 'memory', label: 'MEMORY',       sub: 'CONTEXT STORE', rx: 0.82, ry: 0.78 },
  ];

  const EDGES = [
    { from: 'orch',   to: 'rag'    },
    { from: 'orch',   to: 'mcp'    },
    { from: 'orch',   to: 'prompt' },
    { from: 'rag',    to: 'vecdb'  },
    { from: 'mcp',    to: 'tools'  },
    { from: 'prompt', to: 'memory' },
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width  || canvas.parentElement.offsetWidth / 2;
    H = rect.height || 420;
    canvas.width  = W;
    canvas.height = H;

    const NW = Math.min(120, W * 0.28);
    const NH = 42;

    nodes = DEFS.map(d => ({
      ...d,
      x:  d.rx * W,
      y:  d.ry * H,
      nw: NW,
      nh: NH,
    }));

    particles = [];
    EDGES.forEach(e => {
      const f = nodes.find(n => n.id === e.from);
      const t = nodes.find(n => n.id === e.to);
      if (!f || !t) return;
      for (let i = 0; i < 2; i++) {
        particles.push({ f, t, progress: i * 0.5, speed: 0.003 + Math.random() * 0.002 });
      }
    });
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawEdge(e, C) {
    const f = nodes.find(n => n.id === e.from);
    const t = nodes.find(n => n.id === e.to);
    if (!f || !t) return;
    const x1 = f.x, y1 = f.y + f.nh;
    const x2 = t.x, y2 = t.y;
    const my = (y1 + y2) / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, my, x2, my, x2, y2);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawNode(n, C) {
    const x = n.x - n.nw / 2, y = n.y, w = n.nw, h = n.nh, r = 5;
    rr(x, y, w, h, r);
    ctx.fillStyle = n.main ? C.accentDim : C.surface;
    ctx.fill();
    rr(x, y, w, h, r);
    ctx.strokeStyle = n.main ? C.accent : C.border;
    ctx.lineWidth = n.main ? 1.5 : 1;
    ctx.stroke();

    // left bar
    ctx.beginPath();
    ctx.moveTo(x + r, y + 9);
    ctx.lineTo(x + r, y + h - 9);
    ctx.strokeStyle = n.main ? C.accent : C.borderHi;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = n.x + 3;

    ctx.font = `500 ${Math.max(8, w * 0.082)}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = n.main ? C.accent : C.text;
    ctx.fillText(n.label, cx, y + h * 0.34);

    ctx.font = `400 ${Math.max(7, w * 0.068)}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = C.textDim;
    ctx.fillText(n.sub, cx, y + h * 0.68);
  }

  function drawParticles(C) {
    particles.forEach(p => {
      p.progress = (p.progress + p.speed) % 1;
      const t = p.progress;
      const x1 = p.f.x, y1 = p.f.y + p.f.nh;
      const x2 = p.t.x, y2 = p.t.y;
      const my = (y1 + y2) / 2;
      const mt = 1 - t;
      const px = mt*mt*mt*x1 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x2;
      const py = mt*mt*mt*y1 + 3*mt*mt*t*my + 3*mt*t*t*my + t*t*t*y2;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = p.f.main ? C.accent : C.borderHi;
      ctx.fill();
    });
  }

  function loop() {
    const C = getColors();
    ctx.clearRect(0, 0, W, H);
    EDGES.forEach(e => drawEdge(e, C));
    drawParticles(C);
    nodes.forEach(n => drawNode(n, C));
    requestAnimationFrame(loop);
  }

  // wait for layout before first sizing
  window.addEventListener('load', () => { resize(); loop(); });
  window.addEventListener('resize', resize);
})();

/* reveal on scroll */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
})();
