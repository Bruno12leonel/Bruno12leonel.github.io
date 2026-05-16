/* =============================================
   NAVBAR — scroll & mobile toggle
   ============================================= */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.getElementById('nav-links');
  const navToggle = document.getElementById('nav-toggle');
  const links = navLinks.querySelectorAll('a');

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

/* =============================================
   REVEAL ON SCROLL
   ============================================= */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        animateSkillBars(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));

  function animateSkillBars(container) {
    container.querySelectorAll('.skill-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  }
})();

/* =============================================
   TYPED TITLE
   ============================================= */
(function initTyped() {
  const el = document.getElementById('typed-title');
  if (!el) return;
  const titles = ['AI Engineer', 'Multi-Agent Architect', 'LLM Specialist', 'RAG Developer'];
  let ti = 0, ci = 0, deleting = false;

  function type() {
    const current = titles[ti];
    if (!deleting) {
      el.textContent = current.slice(0, ++ci);
      if (ci === current.length) { deleting = true; return setTimeout(type, 2000); }
    } else {
      el.textContent = current.slice(0, --ci);
      if (ci === 0) { deleting = false; ti = (ti + 1) % titles.length; }
    }
    setTimeout(type, deleting ? 60 : 100);
  }
  type();
})();

/* =============================================
   HERO CANVAS — SISTEMA MULTI-AGENTE ANIMADO
   ============================================= */
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ---- resize ---- */
  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); buildGraph(); });

  /* ---- paleta ---- */
  const C = {
    cyan:   '#00d4ff',
    purple: '#7c3aed',
    green:  '#00ff88',
    yellow: '#ffd60a',
    bg:     '#0a0a0f',
  };

  /* ---- definição dos nós ---- */
  const NODE_DEFS = [
    {
      id: 'orchestrator',
      label: 'Orchestrator',
      sublabel: 'thinking...',
      color: C.cyan,
      radius: 38,
      icon: '⚡',
    },
    {
      id: 'rag',
      label: 'RAG Agent',
      sublabel: 'retrieving...',
      color: C.purple,
      radius: 28,
      icon: '🔍',
    },
    {
      id: 'tool',
      label: 'Tool Agent',
      sublabel: 'executing...',
      color: C.green,
      radius: 28,
      icon: '⚙️',
    },
    {
      id: 'prompt',
      label: 'Prompt Agent',
      sublabel: 'generating...',
      color: C.yellow,
      radius: 28,
      icon: '✍️',
    },
    {
      id: 'memory',
      label: 'Memory',
      sublabel: 'storing...',
      color: '#a78bfa',
      radius: 22,
      icon: '🧠',
    },
    {
      id: 'vectordb',
      label: 'Vector DB',
      sublabel: 'indexed',
      color: C.purple,
      radius: 18,
      icon: '🗄️',
    },
    {
      id: 'search',
      label: 'Web Search',
      sublabel: 'fetching...',
      color: C.green,
      radius: 18,
      icon: '🌐',
    },
    {
      id: 'code',
      label: 'Code Exec',
      sublabel: 'running...',
      color: C.green,
      radius: 18,
      icon: '💻',
    },
    {
      id: 'sysprompt',
      label: 'System Prompt',
      sublabel: 'loaded',
      color: C.yellow,
      radius: 18,
      icon: '📋',
    },
  ];

  /* ---- arestas (edges) ---- */
  const EDGES = [
    { from: 'orchestrator', to: 'rag' },
    { from: 'orchestrator', to: 'tool' },
    { from: 'orchestrator', to: 'prompt' },
    { from: 'orchestrator', to: 'memory' },
    { from: 'rag', to: 'vectordb' },
    { from: 'rag', to: 'memory' },
    { from: 'tool', to: 'search' },
    { from: 'tool', to: 'code' },
    { from: 'prompt', to: 'sysprompt' },
  ];

  /* ---- posições relativas (0..1) → convertidas para px ---- */
  const POSITIONS = {
    orchestrator: { rx: 0.5,  ry: 0.42 },
    rag:          { rx: 0.25, ry: 0.25 },
    tool:         { rx: 0.75, ry: 0.25 },
    prompt:       { rx: 0.75, ry: 0.62 },
    memory:       { rx: 0.25, ry: 0.62 },
    vectordb:     { rx: 0.1,  ry: 0.12 },
    search:       { rx: 0.88, ry: 0.1  },
    code:         { rx: 0.88, ry: 0.42 },
    sysprompt:    { rx: 0.88, ry: 0.78 },
  };

  /* ---- estrutura dos nós em runtime ---- */
  let nodes = [];

  function buildGraph() {
    const W = canvas.width, H = canvas.height;
    nodes = NODE_DEFS.map(def => {
      const pos = POSITIONS[def.id];
      return {
        ...def,
        x: pos.rx * W,
        y: pos.ry * H,
        pulse: Math.random() * Math.PI * 2,
        statusTimer: Math.random() * 100,
        statusIdx: 0,
      };
    });
  }
  buildGraph();

  /* ---- partículas nas arestas ---- */
  const STATUSES = {
    orchestrator: ['thinking...', 'routing...', 'coordinating...'],
    rag:          ['retrieving...', 'searching...', 'embedding...'],
    tool:         ['executing...', 'calling...', 'parsing result...'],
    prompt:       ['generating...', 'formatting...', 'streaming...'],
    memory:       ['storing...', 'indexing...', 'ready'],
    vectordb:     ['indexed', 'querying...', 'ranked'],
    search:       ['fetching...', 'crawling...', 'done'],
    code:         ['running...', 'compiling...', 'output ready'],
    sysprompt:    ['loaded', 'injected', 'active'],
  };

  class Particle {
    constructor(fromNode, toNode) {
      this.from = fromNode;
      this.to   = toNode;
      this.t    = 0;
      this.speed = 0.004 + Math.random() * 0.004;
      this.color = fromNode.color;
    }
    update() { this.t += this.speed; }
    get done() { return this.t >= 1; }
    get x() { return this.from.x + (this.to.x - this.from.x) * this.t; }
    get y() { return this.from.y + (this.to.y - this.from.y) * this.t; }
  }

  const particles = [];
  let frame = 0;

  function spawnParticles() {
    if (frame % 40 === 0) {
      const edgeDef = EDGES[Math.floor(Math.random() * EDGES.length)];
      const fromNode = nodes.find(n => n.id === edgeDef.from);
      const toNode   = nodes.find(n => n.id === edgeDef.to);
      if (fromNode && toNode) particles.push(new Particle(fromNode, toNode));
    }
  }

  /* ---- renderização ---- */
  function drawEdge(fromNode, toNode) {
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = fromNode.color + '30';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawNode(node) {
    const pulse = Math.sin(node.pulse) * 0.15 + 1;
    const r = node.radius;

    /* anel externo pulsante */
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * pulse + 6, 0, Math.PI * 2);
    ctx.strokeStyle = node.color + '25';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* círculo de fundo */
    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
    grad.addColorStop(0, node.color + '40');
    grad.addColorStop(1, node.color + '10');
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    /* borda */
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = node.color + 'cc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* ícone */
    ctx.font = `${r * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.icon, node.x, node.y - 4);

    /* label */
    ctx.font = `600 ${Math.max(9, r * 0.35)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#fff';
    ctx.fillText(node.label, node.x, node.y + r + 14);

    /* sublabel (status) */
    const statuses = STATUSES[node.id] || ['active'];
    ctx.font = `${Math.max(8, r * 0.28)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = node.color + 'bb';
    ctx.fillText(statuses[node.statusIdx % statuses.length], node.x, node.y + r + 26);
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function updateNodes() {
    nodes.forEach(node => {
      node.pulse += 0.03;
      node.statusTimer++;
      if (node.statusTimer > 90) {
        node.statusTimer = 0;
        node.statusIdx++;
      }
    });
  }

  /* ---- loop principal ---- */
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* arestas */
    EDGES.forEach(e => {
      const f = nodes.find(n => n.id === e.from);
      const t = nodes.find(n => n.id === e.to);
      if (f && t) drawEdge(f, t);
    });

    /* partículas */
    spawnParticles();
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      drawParticle(particles[i]);
      if (particles[i].done) particles.splice(i, 1);
    }

    /* nós */
    nodes.forEach(drawNode);

    updateNodes();
    frame++;
    requestAnimationFrame(loop);
  }

  loop();
})();
