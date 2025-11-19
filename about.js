/* FILE: about.js */
// Lightweight page script: mobile menu, stats counter and simple accessibility
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  const hamburger = $('.desktop-action .hamburger');
  const mobileMenu = $('.mobile-menu');
  const cartIcon = $('.cart-icon');
  const cartValueEl = $('.cart-value');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => { e.preventDefault(); mobileMenu.classList.toggle('mobile-menu-active'); });
  }

  // open cart when cart icon clicked (simple UI feedback)
  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => { e.preventDefault(); document.querySelector('.cart-tab')?.classList.add('cart-tab-active'); });
  }

  // close cart when clicking Close
  const closeCartBtn = document.querySelector('.close-btn');
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', (e) => { e.preventDefault(); document.querySelector('.cart-tab')?.classList.remove('cart-tab-active'); });
  }

  // Stats counter
  const counters = $$('.stat-number');
  const animateCounter = (el) => {
    const target = Number(el.dataset.target) || 0;
    let current = 0;
    const step = Math.ceil(target / 80);
    const iv = setInterval(() => {
      current += step;
      if (current >= target) { el.textContent = target.toLocaleString(); clearInterval(iv); }
      else el.textContent = current.toLocaleString();
    }, 12);
  };

  // only animate when in viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) { animateCounter(ent.target); observer.unobserve(ent.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => observer.observe(c));

})();
