(() => {
  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Scroll reveal
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("reveal--in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: "40px 0px -10% 0px" }
    );

    for (const el of revealEls) io.observe(el);
  } else {
    for (const el of revealEls) el.classList.add("reveal--in");
  }

  // Active nav highlight
  const navLinks = Array.from(document.querySelectorAll(".nav a"))
    .map((a) => {
      const href = a.getAttribute("href");
      const id = href && href.startsWith("#") ? href.slice(1) : null;
      return { a: a, id: id };
    })
    .filter((x) => x.id);

  const sections = navLinks
    .map((x) => {
      const section = document.getElementById(x.id);
      return { a: x.a, id: x.id, section: section };
    })
    .filter((x) => x.section);

  const setActive = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportMid = y + window.innerHeight * 0.35;
    let current = null;
    for (const s of sections) {
      const el = s.section;
      if (el.offsetTop <= viewportMid) current = el;
    }
    for (const s of sections) s.a.classList.toggle("is-active", s.section === current);
  };

  window.addEventListener("scroll", setActive, { passive: true });
  window.addEventListener("resize", setActive);
  setActive();

  // Smooth scroll for nav links
  document.querySelectorAll('.nav a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Particle background (canvas)
  const canvas = document.getElementById("bg");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  window.addEventListener("resize", resize);

  const rand = (min, max) => min + Math.random() * (max - min);

  const baseCount = () => {
    const area = w * h;
    return Math.max(35, Math.min(95, Math.floor(area / 18000)));
  };

  let particles = [];

  const init = () => {
    const n = baseCount();
    particles = Array.from({ length: n }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.3, 0.3),
      r: rand(1.1, 2.2),
    }));
  };

  init();
  window.addEventListener("resize", init);

  const mouse = { x: w / 2, y: h / 2, active: false };
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    },
    { passive: true }
  );
  window.addEventListener("mouseleave", () => { mouse.active = false; });

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    // Subtle background bloom
    const g = ctx.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.7, h * 0.2, Math.max(w, h) * 0.7);
    g.addColorStop(0, "rgba(124, 92, 255, 0.06)");
    g.addColorStop(0.35, "rgba(77, 252, 255, 0.03)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Update & draw particles
    for (const p of particles) {
      const tx = mouse.active ? (mouse.x - w / 2) * 0.00035 : 0;
      const ty = mouse.active ? (mouse.y - h / 2) * 0.00035 : 0;
      p.vx += tx;
      p.vy += ty;

      // mild damping
      p.vx *= 0.995;
      p.vy *= 0.995;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;
      if (p.y < -30) p.y = h + 30;
      if (p.y > h + 30) p.y = -30;
    }

    // Connections
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > maxDist) continue;
        const t = 1 - d / maxDist;
        ctx.strokeStyle = "rgba(77, 252, 255, " + (0.12 * t) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Points
    for (const p of particles) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);

  // Tilt effect on avatar card
  const avatarCard = document.querySelector(".avatar-card");
  if (avatarCard) {
    avatarCard.addEventListener("mousemove", (e) => {
      const rect = avatarCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      avatarCard.style.transform = "perspective(600px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg)";
    });
    avatarCard.addEventListener("mouseleave", () => {
      avatarCard.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg)";
    });
  }

  // Typing effect for hero tagline
  const tagline = document.querySelector(".hero-tagline");
  if (tagline) {
    const text = tagline.textContent;
    tagline.textContent = "";
    tagline.style.visibility = "visible";
    let i = 0;
    const type = () => {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
        setTimeout(type, 28);
      }
    };
    setTimeout(type, 800);
  }
})();
