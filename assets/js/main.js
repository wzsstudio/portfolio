/* WZS Studio · portfólio: animações e interações */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

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
  const scrollTo = target => lenis ? lenis.scrollTo(target, { offset: 0, duration: 1.4 }) : document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });

  /* ---------- Quebra os títulos em linhas para a entrada ---------- */
  document.querySelectorAll('.reveal-lines').forEach(el => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(p => `<span class="ln"><span>${p.trim()}</span></span>`).join('');
  });

  /* ---------- Preloader ---------- */
  const loader = document.getElementById('loader');
  const count = document.getElementById('loader-count');
  const finishLoad = () => {
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
    intro();
  };
  if (reduce || !hasGsap) {
    loader.remove(); finishLoad();
  } else {
    const c = { v: 0 };
    gsap.timeline({ onComplete: finishLoad })
      .from('.loader__mark', { scale: .6, opacity: 0, duration: .6, ease: 'power3.out' })
      .to(c, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(c.v); } }, 0)
      .to('.loader__mark', { rotate: 180, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(loader, { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '+=.1')
      .set(loader, { display: 'none' });
  }

  function intro() {
    if (!hasGsap || reduce) return;
    gsap.from('.hero__logo svg', { yPercent: 18, opacity: 0, duration: 1.2, ease: 'power4.out' });
    gsap.from('.hero__claim, .hero .pill, .hero__foot > *', { y: 16, opacity: 0, duration: .9, stagger: .06, ease: 'power3.out', delay: .15 });
  }

  /* ---------- Topo: cor conforme a seção e nome da seção ---------- */
  const top = document.getElementById('top');
  const label = document.getElementById('top-section');
  const sections = [...document.querySelectorAll('main > section')];
  const updateTop = () => {
    const y = 30;
    let current = sections[0];
    for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { current = s; break; } }
    top.classList.toggle('on-dark', current.dataset.theme === 'dark');
    top.classList.toggle('is-scrolled', scrollY > innerHeight * .6);
    const name = current.dataset.label || '';
    if (current.classList.contains('works')) { label.classList.remove('show'); return; } // o título da própria seção já fica preso
    if (label.textContent !== name) label.textContent = name;
    label.classList.toggle('show', !!name);
  };
  addEventListener('scroll', updateTop, { passive: true });
  updateTop();

  /* ---------- Menu ---------- */
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menu-btn');
  const setMenu = open => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.firstChild.textContent = open ? 'Fechar ' : 'Menu ';
    document.body.classList.toggle('menu-open', open);
    if (open) { lenis && lenis.stop(); hasGsap && !reduce && gsap.from('.menu li a', { yPercent: 100, opacity: 0, duration: .7, stagger: .07, ease: 'power4.out' }); }
    else lenis && lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !document.querySelector(id)) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    scrollTo(id);
  }));

  /* ---------- Vídeos: tocam só quando aparecem ---------- */
  const playable = [...document.querySelectorAll('video[data-auto], .work video')];
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; if (!v.dataset.paused) v.play().catch(() => {}); }
    else v.pause();
  }), { threshold: .25 });
  playable.forEach(v => io.observe(v));

  const reel = document.getElementById('reel');
  const reelPill = document.getElementById('reel-pill');
  reelPill.addEventListener('click', () => {
    const paused = reelPill.getAttribute('aria-pressed') === 'true';
    reelPill.setAttribute('aria-pressed', !paused);
    reelPill.firstChild.textContent = paused ? 'Pausar ' : 'Tocar ';
    if (paused) { delete reel.dataset.paused; reel.play().catch(() => {}); } else { reel.dataset.paused = '1'; reel.pause(); }
  });

  /* ---------- Animações de rolagem ---------- */
  if (hasGsap && !reduce) {
    // Títulos sobem linha a linha
    document.querySelectorAll('.reveal-lines').forEach(el => {
      gsap.from(el.querySelectorAll('.ln > span'), {
        yPercent: 105, duration: 1.1, stagger: .08, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // Faixa do manifesto entra subindo e a imagem lateral com parallax
    gsap.from('.band', { yPercent: 12, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.band', start: 'top 95%' } });
    gsap.to('.aside__img', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.aside', start: 'top bottom', end: 'bottom top', scrub: true } });

    // "PROJETOS": as letras se espalham enquanto a seção passa (como o WORKS do noth.in)
    const letters = gsap.utils.toArray('.works__title span');
    const spread = () => Math.min(innerWidth * .9, 1300) / letters.length;
    gsap.timeline({ scrollTrigger: { trigger: '.works', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true } })
      .to(letters, { x: i => i * spread(), ease: 'none', duration: 1 })
      .to(letters, { x: 0, ease: 'none', duration: 1 });

    // Cada projeto sobe com leve parallax
    gsap.utils.toArray('.work').forEach((w, i) => {
      gsap.from(w, { y: 90, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: w, start: 'top 92%' } });
      gsap.to(w.querySelector('.work__media'), { yPercent: i % 2 ? -6 : 6, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Showreel abre até ocupar a tela inteira (no celular ele já entra inteiro)
    if (innerWidth > 760) gsap.to('#reel-frame', {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: '.reel', start: 'top top', end: '55% bottom', scrub: true },
    });

    // Imagens do estúdio
    gsap.from('.studio__big', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: '.studio__big', start: 'top 85%' } });
    gsap.to('.studio__small', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '.studio', start: 'top bottom', end: '40% top', scrub: true } });

    // Letras e pixels flutuando
    gsap.utils.toArray('.fl').forEach(el => {
      const s = parseFloat(el.dataset.speed || 0);
      gsap.fromTo(el, { y: innerHeight * s * 1.2, rotate: -s * 40 }, {
        y: -innerHeight * s * 1.2, rotate: s * 40, ease: 'none',
        scrollTrigger: { trigger: '.float', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.from('.fl--mark', { scale: .4, opacity: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.float', start: 'top 80%' } });

    // Logo gigante do rodapé
    gsap.from('.contact__logo svg', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: '.contact__logo', start: 'top 95%' } });
  }

  /* ---------- Texto embaralhado sobre o vídeo ---------- */
  const words = document.getElementById('glitch-words');
  const phrase = ['wzs studio_', 'wzs studio_', 'wzs studio_', 'feito do zero'];
  const junk = 'Pj(è !!" .   U§hs .  jkj . k .  rh';
  const glyphs = 'abcdefghijklmnopqrstuvwxyz_/.:§!(%';
  const spots = [[8, 12], [56, 18], [30, 34], [70, 46], [12, 58], [44, 70], [76, 78], [22, 86]];
  const blocks = spots.map(([x, y]) => {
    const el = document.createElement('span');
    el.style.left = x + '%'; el.style.top = y + '%';
    words.appendChild(el);
    return el;
  });
  const target = phrase.join('\n') + '\n' + junk;
  const scramble = (el, p) => {
    let out = '';
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      out += ch === '\n' || ch === ' ' ? ch : (Math.random() < p ? ch : glyphs[(Math.random() * glyphs.length) | 0]);
    }
    el.textContent = out;
  };
  let glitchOn = false;
  new IntersectionObserver(([en]) => { glitchOn = en.isIntersecting; }).observe(document.querySelector('.glitch'));
  let tick = 0;
  setInterval(() => {
    if (!glitchOn) return;
    tick++;
    blocks.forEach((b, i) => scramble(b, reduce ? 1 : .55 + .45 * Math.abs(Math.sin(tick / 9 + i))));
  }, 90);
  blocks.forEach(b => scramble(b, 1));

  /* ---------- Projeto aberto ---------- */
  const caseEl = document.getElementById('case');
  const caseInner = document.getElementById('case-inner');
  const caseClose = document.getElementById('case-close');
  let lastFocus = null;
  const openCase = id => {
    const tpl = document.getElementById('case-' + id);
    if (!tpl) return;
    lastFocus = document.activeElement;
    caseInner.replaceChildren(tpl.content.cloneNode(true));
    caseEl.hidden = false; caseEl.scrollTop = 0;
    document.body.classList.add('case-open');
    lenis && lenis.stop();
    playable.forEach(v => v.pause());
    const v = caseInner.querySelector('video');
    caseInner.querySelectorAll('.chapters button').forEach(b => b.addEventListener('click', () => {
      v.currentTime = parseFloat(b.dataset.t); v.play().catch(() => {});
    }));
    hasGsap && !reduce && gsap.from(caseInner.children, { y: 40, opacity: 0, duration: .8, stagger: .06, ease: 'power3.out' });
    caseClose.focus();
    history.replaceState(null, '', '#' + id);
  };
  const closeCase = () => {
    caseInner.querySelectorAll('video').forEach(v => v.pause());
    caseEl.hidden = true; caseInner.replaceChildren();
    document.body.classList.remove('case-open');
    lenis && lenis.start();
    history.replaceState(null, '', location.pathname);
    lastFocus && lastFocus.focus();
  };
  document.querySelectorAll('.work').forEach(w => w.querySelector('.work__open').addEventListener('click', () => openCase(w.dataset.case)));
  caseClose.addEventListener('click', closeCase);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!caseEl.hidden) closeCase(); else if (!menu.hidden) setMenu(false);
  });
  // Link direto para um projeto: .../portfolio/#dolce
  const hashCase = location.hash.slice(1);
  if (document.getElementById('case-' + hashCase)) setTimeout(() => openCase(hashCase), reduce ? 0 : 2600);
})();
