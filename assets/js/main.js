/* WZS Studio · portfólio: animações e interações */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const WHATS = 'https://wa.me/5554997147741?text=Ol%C3%A1%2C%20Wesley!%20Vi%20seu%20portf%C3%B3lio%20e%20quero%20um%20or%C3%A7amento.';

  /* ---------- Rolagem suave ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop();
  }
  const scrollTo = id => lenis ? lenis.scrollTo(id, { duration: 1.4 }) : $(id)?.scrollIntoView({ behavior: 'smooth' });

  /* ---------- Carregamento: um "npm run dev" de mentira ---------- */
  const log = $('#loader-log'), count = $('#loader-count'), loader = $('#loader');
  const lines = [
    '<span class="ok">$</span> npm run dev',
    '> wzs-portfolio@2026 dev',
    '  compilando html, css e javascript...',
    '  carregando 5 projetos e 1 showreel...',
    '<span class="ok">✓</span> pronto. abrindo o portfólio',
  ];
  const finish = () => {
    loader.remove();
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
    if (hasGsap) ScrollTrigger.refresh();
    typeCode();
  };
  if (reduce || !hasGsap) { finish(); }
  else {
    let i = 0;
    const tick = setInterval(() => { if (i < lines.length) log.innerHTML += (i ? '\n' : '') + lines[i++]; }, 260);
    const c = { v: 0 };
    gsap.timeline({ onComplete: () => { clearInterval(tick); finish(); } })
      .to(c, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(c.v); } })
      .to(loader, { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '+=.15');
  }

  /* ---------- Editor do hero: digita o código e "roda" ---------- */
  const code = $('#editor-code'), consoleEl = $('#editor-console'), runBtn = $('#editor-run');
  const src = [
    ['c', '// seu-negocio.js'],
    ['', '<k>const</k> site = <b>criarSite</b>({'],
    ['', '  negocio: <s>"o seu"</s>,'],
    ['', '  feitoDoZero: <k>true</k>,'],
    ['', '  celular: <s>"primeiro"</s>,'],
    ['', '  google: <s>"otimizado"</s>,'],
    ['', '  contato: <s>"WhatsApp"</s>,'],
    ['', '});'],
    ['', ''],
    ['', '<k>await</k> site.<b>publicar</b>();'],
  ];
  const paint = s => s.replace(/<k>(.*?)<\/k>/g, '<span class="k">$1</span>').replace(/<s>(.*?)<\/s>/g, '<span class="s">$1</span>').replace(/<b>(.*?)<\/b>/g, '<span class="b">$1</span>');
  const plain = s => s.replace(/<\/?[ksb]>/g, '');
  const renderAll = () => { code.innerHTML = src.map(([t, s]) => `<span class="ln">${t === 'c' ? `<span class="c">${s}</span>` : paint(s)}</span>`).join(''); };
  let typed = false;
  function typeCode() {
    if (typed) return; typed = true;
    if (reduce) { renderAll(); return; }
    let li = 0, ci = 0;
    const done = [];
    const step = () => {
      if (li >= src.length) { code.innerHTML = done.join('') + ''; renderAll(); code.lastChild.insertAdjacentHTML('beforeend', '<span class="caret"></span>'); return; }
      const [t, s] = src[li], p = plain(s);
      ci++;
      const partial = p.slice(0, ci);
      const cur = `<span class="ln">${t === 'c' ? `<span class="c">${partial}</span>` : partial}<span class="caret"></span></span>`;
      code.innerHTML = done.join('') + cur;
      if (ci >= p.length) { done.push(`<span class="ln">${t === 'c' ? `<span class="c">${s}</span>` : paint(s)}</span>`); li++; ci = 0; setTimeout(step, 90); }
      else setTimeout(step, 22 + Math.random() * 30);
    };
    step();
  }
  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    const out = [
      '<span class="muted">$ node seu-negocio.js</span>',
      '<span class="ok">✓</span> layout pronto para celular',
      '<span class="ok">✓</span> títulos e descrição para o Google',
      '<span class="ok">✓</span> botão do WhatsApp em todas as telas',
      `<span class="ok">✓</span> site no ar. <a href="${WHATS}" target="_blank" rel="noopener" style="color:#9ec5ff;text-decoration:underline">pedir o seu →</a>`,
    ];
    consoleEl.innerHTML = '';
    out.forEach((l, i) => setTimeout(() => {
      consoleEl.innerHTML += (i ? '<br>' : '') + l;
      if (i === out.length - 1) runBtn.disabled = false;
    }, reduce ? 0 : i * 380));
  });

  /* ---------- Revelação suave (IntersectionObserver) ---------- */
  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Frase que acende palavra por palavra ---------- */
  const tag = $('#tagline');
  const highlight = ['código', 'chamar', 'você.'];
  tag.innerHTML = tag.innerHTML.split(/<br\s*\/?>/i).map(line =>
    line.trim().split(/\s+/).map(w => `<span class="w${highlight.includes(w) ? ' hl' : ''}">${w}</span>`).join(' ')
  ).join(' <br>');
  const words = [...tag.querySelectorAll('.w')];
  const wordIO = new IntersectionObserver(es => es.forEach(e => {
    e.target.classList.toggle('on', reduce || e.boundingClientRect.top < innerHeight * .62);
  }), { rootMargin: '0px 0px -38% 0px', threshold: [0, 1] });
  words.forEach(w => wordIO.observe(w));

  /* ---------- Menu em pílula: some ao descer, volta ao subir; marca a seção atual ---------- */
  const island = $('#island');
  let lastY = 0;
  if (lenis) lenis.on('scroll', ({ scroll }) => {
    island.classList.toggle('is-hidden', scroll > lastY && scroll > 240 && $('#menu').hidden);
    lastY = scroll;
  });
  const navLinks = $$('.island__links a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach(s => secIO.observe(s));

  const menu = $('#menu'), burger = $('#burger');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); lenis && lenis.stop(); }
    else { menu.classList.remove('is-open'); menu.hidden = true; lenis && lenis.start(); }
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    scrollTo(id);
  }));

  /* ---------- Texto que se embaralha ao passar o mouse ---------- */
  const glyphs = '<>/{}[]=;_01#$&*';
  const scramble = (el, finalText, dur = 520) => {
    const start = performance.now();
    const run = now => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = finalText.split('').map((ch, i) => ch === ' ' || i < p * finalText.length ? ch : glyphs[(Math.random() * glyphs.length) | 0]).join('');
      if (p < 1) requestAnimationFrame(run); else el.textContent = finalText;
    };
    requestAnimationFrame(run);
  };
  if (!reduce) $$('[data-scramble]').forEach(el => {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const span = document.createElement('span'); span.textContent = node.textContent; node.replaceWith(span);
    const text = span.textContent;
    el.addEventListener('mouseenter', () => scramble(span, text));
  });
  const ct = $('[data-scramble-big]');
  if (ct && !reduce) new IntersectionObserver(([e]) => { if (e.isIntersecting) scramble(ct, 'CONTATO', 900); }, { threshold: .6 }).observe(ct);

  /* ---------- Cursor próprio e botões magnéticos ---------- */
  if (fine && !reduce) {
    const cur = $('#cursor'), label = $('#cursor-label');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('a, button, summary, input, [data-cursor]');
      const l = t?.dataset?.cursor || '';
      cur.classList.toggle('is-label', !!l);
      cur.classList.toggle('is-link', !!t && !l);
      label.textContent = l;
    });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));

    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Vídeos: tocam só quando aparecem ---------- */
  const playable = $$('video[data-auto], .work video');
  const vidIO = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; if (!v.dataset.paused) v.play().catch(() => {}); }
    else v.pause();
  }), { threshold: .25 });
  playable.forEach(v => vidIO.observe(v));
  const reel = $('#reel'), reelPill = $('#reel-pill');
  reelPill.addEventListener('click', () => {
    const paused = reelPill.getAttribute('aria-pressed') === 'true';
    reelPill.setAttribute('aria-pressed', !paused);
    reelPill.firstChild.textContent = paused ? 'Pausar ' : 'Tocar ';
    if (paused) { delete reel.dataset.paused; reel.play().catch(() => {}); } else { reel.dataset.paused = '1'; reel.pause(); }
  });

  /* ---------- Takes do showreel: legenda e barras ---------- */
  const takes = [
    { t: 0, p: 'JurisConta', l: 'A Justiça em 3D muda de pose a cada capítulo' },
    { t: 5.4, p: 'Forja Academia', l: 'O halter desmonta peça por peça na rolagem' },
    { t: 10.8, p: 'Hyper Frame Studio', l: 'A câmera desenhada vira o visor do portfólio' },
    { t: 16.7, p: 'Dolce Migliavaca', l: 'Cardápio arrastável com pedido no WhatsApp' },
    { t: 21.1, p: 'Dolce Migliavaca', l: 'Cheesecake em 3D que gira com o dedo' },
    { t: 25.5, p: 'App de treino', l: 'Séries, cargas e cronômetro de descanso' },
  ];
  const REEL_END = 30.5;
  const bars = $('#reel-bars'), cap = $('#reel-cap'), capP = $('#reel-proj'), capL = $('#reel-take');
  const barEls = takes.map((tk, i) => {
    const end = takes[i + 1] ? takes[i + 1].t : REEL_END;
    const b = document.createElement('button');
    b.style.setProperty('--w', (end - tk.t).toFixed(2));
    b.setAttribute('aria-label', tk.p + ': ' + tk.l);
    b.innerHTML = '<span><i></i></span>';
    b.addEventListener('click', () => { reel.currentTime = tk.t + .01; if (!reel.dataset.paused) reel.play().catch(() => {}); });
    bars.appendChild(b);
    return { fill: b.querySelector('i'), start: tk.t, end };
  });
  let curTake = 0;
  const reelTick = () => {
    const t = reel.currentTime;
    let k = takes.length - 1;
    while (k > 0 && t < takes[k].t) k--;
    if (k !== curTake) {
      curTake = k;
      cap.classList.add('swap');
      setTimeout(() => { capP.textContent = takes[k].p; capL.textContent = takes[k].l; cap.classList.remove('swap'); }, 250);
    }
    barEls.forEach((s, i) => {
      const p = i < k ? 1 : i > k ? 0 : Math.min(1, (t - s.start) / (s.end - s.start));
      s.fill.style.transform = 'scaleX(' + p + ')';
    });
    if (!reel.paused) requestAnimationFrame(reelTick);
  };
  reel.addEventListener('play', () => requestAnimationFrame(reelTick));
  reel.addEventListener('seeked', reelTick);

  /* ---------- Efeitos ligados à rolagem (GSAP) ---------- */
  if (hasGsap && !reduce) {
    gsap.to('.hero__logo svg', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.utils.toArray('.work').forEach((w, i) => {
      gsap.to(w.querySelector('.work__media'), { yPercent: i % 2 ? -6 : 6, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Showreel: o card cresce até ocupar a tela, com os cantos se desfazendo
    if (innerWidth > 767) gsap.fromTo('#reel-frame', { scale: .58, borderRadius: 24 }, {
      scale: 1, borderRadius: 0, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.reel', start: 'top 60%', end: '45% bottom', scrub: 1 },
    });
    // Palavras de código no contato fogem do mouse e flutuam na rolagem
    const floats = $$('#contact-float span');
    floats.forEach((el, i) => gsap.to(el, { y: (i % 2 ? -1 : 1) * 80, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } }));
    if (fine) $('.contact').addEventListener('pointermove', e => {
      const r = e.currentTarget.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5;
      floats.forEach((el, i) => gsap.to(el, { x: mx * (30 + i * 12), duration: 1.2, ease: 'power3.out' }));
      void my;
    });
  }

  /* ---------- Terminal interativo ---------- */
  const tOut = $('#term-out'), tIn = $('#term-in'), tForm = $('#term-form');
  const cmds = {
    ajuda: () => 'comandos: <span class="ok">sobre</span>, <span class="ok">stack</span>, <span class="ok">projetos</span>, <span class="ok">contato</span>, <span class="ok">orcamento</span>, <span class="ok">limpar</span>',
    sobre: () => 'Wesley Zanchettin de Souza\ndesenvolvedor front-end · Vila Flores, RS\natendo toda a região\nsites, landing pages e sistemas escritos do zero.',
    stack: () => 'front:  HTML, CSS, JavaScript, Three.js, GSAP\nback:   Node.js, Express, MySQL, Supabase\nextra:  PWA, Git, Cloudflare Pages, GitHub Pages',
    projetos: () => ['jurisconta', 'dolce', 'hyper', 'app', 'forja'].map((id, i) => `0${i + 1}  <a href="#${id}" data-open="${id}">${{ jurisconta: 'JurisConta', dolce: 'Dolce Migliavaca', hyper: 'Hyper Frame Studio', app: 'App de treino', forja: 'Forja Academia' }[id]}</a>`).join('\n') + '\n(clique para abrir)',
    contato: () => `whatsapp  <a href="https://wa.me/5554997147741" target="_blank" rel="noopener">+55 54 99714-7741</a>\ne-mail    <a href="mailto:wzs.studio11@gmail.com">wzs.studio11@gmail.com</a>`,
    orcamento: () => `<span class="ok">✓</span> ótimo. <a href="${WHATS}" target="_blank" rel="noopener">abrir conversa no WhatsApp →</a>`,
  };
  const alias = { help: 'ajuda', about: 'sobre', projects: 'projetos', contact: 'contato', 'orçamento': 'orcamento', ls: 'projetos', whoami: 'sobre', clear: 'limpar' };
  const print = html => { tOut.insertAdjacentHTML('beforeend', html + '\n'); tOut.scrollTop = tOut.scrollHeight; };
  const exec = raw => {
    const c = raw.trim().toLowerCase();
    if (!c) return;
    const name = alias[c] || c;
    print(`<span class="cmd"><span class="ok">$</span> ${c.replace(/</g, '&lt;')}</span>`);
    if (name === 'limpar') { tOut.innerHTML = ''; return; }
    print(cmds[name] ? cmds[name]() : `<span class="err">comando não encontrado: ${c.replace(/</g, '&lt;')}</span>. digite <span class="ok">ajuda</span>`);
  };
  print('<span class="c">bem-vindo ao terminal da WZS Studio.</span> digite <span class="ok">ajuda</span> para ver os comandos.');
  tForm.addEventListener('submit', e => { e.preventDefault(); exec(tIn.value); tIn.value = ''; });
  $$('#term-chips .chip').forEach(b => b.addEventListener('click', () => { exec(b.dataset.cmd); tIn.focus({ preventScroll: true }); }));
  tOut.addEventListener('click', e => { const a = e.target.closest('[data-open]'); if (a) { e.preventDefault(); openCase(a.dataset.open); } });
  $('#term').addEventListener('click', e => { if (!e.target.closest('a')) tIn.focus({ preventScroll: true }); });

  /* ---------- Projeto aberto ---------- */
  const caseEl = $('#case'), caseInner = $('#case-inner'), caseClose = $('#case-close');
  let lastFocus = null;
  function openCase(id) {
    const tpl = document.getElementById('case-' + id);
    if (!tpl) return;
    lastFocus = document.activeElement;
    caseInner.replaceChildren(tpl.content.cloneNode(true));
    caseEl.hidden = false; caseEl.scrollTop = 0;
    document.body.classList.add('case-open');
    lenis && lenis.stop();
    playable.forEach(v => v.pause());
    const v = caseInner.querySelector('video');
    caseInner.querySelectorAll('.chapters button').forEach(b => b.addEventListener('click', () => { v.currentTime = parseFloat(b.dataset.t); v.play().catch(() => {}); }));
    if (hasGsap && !reduce) gsap.from(caseInner.children, { y: 64, opacity: 0, filter: 'blur(12px)', duration: .9, stagger: .06, ease: 'power3.out' });
    caseClose.focus();
    history.replaceState(null, '', '#' + id);
  }
  const closeCase = () => {
    caseInner.querySelectorAll('video').forEach(v => v.pause());
    caseEl.hidden = true; caseInner.replaceChildren();
    document.body.classList.remove('case-open');
    lenis && lenis.start();
    history.replaceState(null, '', location.pathname);
    lastFocus && lastFocus.focus();
  };
  $$('.work').forEach(w => w.querySelector('.work__open').addEventListener('click', () => openCase(w.dataset.case)));
  caseClose.addEventListener('click', closeCase);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!caseEl.hidden) closeCase(); else if (!menu.hidden) setMenu(false);
  });
  const hashCase = location.hash.slice(1);
  if (document.getElementById('case-' + hashCase)) setTimeout(() => openCase(hashCase), reduce ? 0 : 2800);
})();
