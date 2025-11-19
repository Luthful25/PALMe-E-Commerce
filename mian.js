/* main.js
   Vanilla JS for Palme E-Commerce
   Features: mobile menu, product render, cart, swiper init, subscribe validation
*/

(() => {
  // ---------- Utilities ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const q = (sel) => document.querySelector(sel);

  const formatPrice = (n) => {
    // returns like $12.00
    return `$${Number(n).toFixed(2)}`;
  };

  const debounce = (fn, wait = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  // ---------- Elements ----------
  const hamburger = $('.desktop-action .hamburger');
  const mobileMenu = $('.mobile-menu');
  const cartIcon = $('.cart-icon');
  const cartValueEl = $('.cart-value');
  const cartTab = $('.cart-tab');
  const cartList = $('.cart-list');
  const cartTotalEl = $('.cart-total');
  const closeCartBtn = $('.close-btn');
  const cardList = $('.card-list');
  const subscribeBtn = $('.input-container .btn');
  const emailInput = $('#email');

  // ---------- Product Data (edit here) ----------
  // Update this array to change products shown on the page
  const PRODUCTS = [
    {
      id: 'burger-01',
      name: 'Double Beef Burger',
      price: 200,
      img: 'images/burger.png',
    },
    {
      id: 'burger-02',
      name: 'Classic Chicken Burger',
      price: 180,
      img: 'images/burger.png',
    },
    {
      id: 'burger-03',
      name: 'Veggie Delight',
      price: 150,
      img: 'images/burger.png',
    },
    {
      id: 'burger-04',
      name: 'Cheesy Supreme',
      price: 220,
      img: 'images/burger.png',
    },
  ];

  // ---------- Cart state ----------
  let cart = {}; // { productId: { ...product, qty } }

  // Load cart from localStorage
  const CART_KEY = 'palme_cart_v1';
  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        cart = JSON.parse(raw) || {};
      }
    } catch (e) {
      console.error('Failed to load cart', e);
      cart = {};
    }
  };
  const saveCart = () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  };

  // ---------- Render products ----------
  const renderProducts = () => {
    if (!cardList) return;
    cardList.innerHTML = PRODUCTS.map(p => `
      <div class="order-card" data-id="${p.id}">
        <div class="card-image">
          <img src="${p.img}" alt="${p.name}">
        </div>
        <h4>${p.name}</h4>
        <h4 class="price">${formatPrice(p.price)}</h4>
        <a href="#" class="btn add-to-cart" data-id="${p.id}">Add to Cart</a>
      </div>
    `).join('');
  };

  // ---------- Cart rendering ----------
  const renderCart = () => {
    if (!cartList || !cartTotalEl || !cartValueEl) return;

    const items = Object.values(cart);
    if (items.length === 0) {
      cartList.innerHTML = `<p style="padding:1rem;text-align:center;color:#666;">Your cart is empty.</p>`;
      cartTotalEl.textContent = formatPrice(0);
      cartValueEl.textContent = 0;
      return;
    }

    cartList.innerHTML = items.map(item => `
      <div class="item" data-id="${item.id}">
        <div class="item-image">
          <img src="${item.img}" alt="${item.name}">
        </div>
        <div style="flex:1;">
          <h4>${item.name}</h4>
          <h4 class="item-total">${formatPrice(item.price * item.qty)}</h4>
        </div>
        <div class="flex" style="align-items:center;">
          <a href="#" class="quantity-btn qty-decrease" data-id="${item.id}" aria-label="Decrease quantity">-</a>
          <h4 class="quantity-value">${item.qty}</h4>
          <a href="#" class="quantity-btn qty-increase" data-id="${item.id}" aria-label="Increase quantity">+</a>
        </div>
      </div>
    `).join('');

    // compute total
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    cartTotalEl.textContent = formatPrice(total);
    cartValueEl.textContent = items.reduce((s, it) => s + it.qty, 0);
  };

  // ---------- Cart operations ----------
  const addToCart = (productId, qty = 1) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    if (!cart[productId]) {
      cart[productId] = { ...product, qty: 0 };
    }
    cart[productId].qty += qty;
    if (cart[productId].qty <= 0) delete cart[productId];
    saveCart();
    renderCart();
    openCart(); // give quick feedback by opening
  };

  const setQuantity = (productId, qty) => {
    if (!cart[productId]) return;
    cart[productId].qty = qty;
    if (cart[productId].qty <= 0) delete cart[productId];
    saveCart();
    renderCart();
  };

  // ---------- UI controls ----------
  const openCart = () => {
    cartTab.classList.add('cart-tab-active');
  };
  const closeCart = () => {
    cartTab.classList.remove('cart-tab-active');
  };
  const toggleMobileMenu = () => {
    mobileMenu.classList.toggle('mobile-menu-active');
  };

  // ---------- Prevent empty links default behavior globally ----------
  const preventEmptyLinks = (e) => {
    const el = e.target.closest('a[href]');
    if (!el) return;
    const href = el.getAttribute('href').trim();
    if (href === '#' || href === '' ) {
      e.preventDefault();
    }
  };
  document.addEventListener('click', preventEmptyLinks);

  // ---------- Event listeners ----------
  const attachListeners = () => {
    // hamburger toggle (click + keyboard)
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMobileMenu();
      });
      hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMobileMenu();
        }
      });
      // close if user clicks outside mobile menu
      document.addEventListener('click', (ev) => {
        if (!mobileMenu.classList.contains('mobile-menu-active')) return;
        if (ev.target.closest('.mobile-menu') || ev.target.closest('.hamburger')) return;
        mobileMenu.classList.remove('mobile-menu-active');
      });
    }

    // cart icon opens cart
    if (cartIcon) {
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
      });
    }
    // close button
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeCart();
      });
    }

    // product add to cart (event delegation on cardList)
    if (cardList) {
      cardList.addEventListener('click', (e) => {
        const add = e.target.closest('.add-to-cart');
        if (!add) return;
        e.preventDefault();
        const id = add.dataset.id;
        if (!id) return;
        addToCart(id, 1);
      });
    }

    // cart quantity controls (delegation)
    if (cartList) {
      cartList.addEventListener('click', (e) => {
        const dec = e.target.closest('.qty-decrease');
        const inc = e.target.closest('.qty-increase');
        if (dec || inc) {
          e.preventDefault();
          const id = (dec || inc).dataset.id;
          if (!id) return;
          const current = cart[id] ? cart[id].qty : 0;
          const next = dec ? current - 1 : current + 1;
          setQuantity(id, next);
        }
      });

      // allow clicking the entire item to remove? (not included intentionally)
    }

    // close cart when pressing Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (mobileMenu.classList.contains('mobile-menu-active')) {
          mobileMenu.classList.remove('mobile-menu-active');
        }
        if (cartTab.classList.contains('cart-tab-active')) {
          cartTab.classList.remove('cart-tab-active');
        }
      }
    });

    // email subscribe (simple validation)
    if (subscribeBtn && emailInput) {
      subscribeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          // small inline feedback
          const old = subscribeBtn.textContent;
          subscribeBtn.textContent = 'Enter valid email';
          setTimeout(() => subscribeBtn.textContent = old, 1500);
          return;
        }
        // pretend to subscribe
        const old = subscribeBtn.textContent;
        subscribeBtn.textContent = 'Subscribed ✓';
        emailInput.value = '';
        setTimeout(() => subscribeBtn.textContent = old, 2000);
      });
    }

    // simple debounced resize handler to re-render if needed later
    window.addEventListener('resize', debounce(() => {
      // placeholder if we need responsive JS adjustments
    }, 250));
  };

  // ---------- Swiper init ----------
  const initSwiper = () => {
    try {
      if (typeof Swiper !== 'undefined') {
        // Using your prev/next IDs
        new Swiper('.mySwiper', {
          loop: true,
          navigation: {
            nextEl: '#next',
            prevEl: '#prev',
          },
          // small sensible defaults
          slidesPerView: 1,
          spaceBetween: 20,
          breakpoints: {
            780: { slidesPerView: 1 },
            1000: { slidesPerView: 1 },
          }
        });
      }
    } catch (e) {
      console.warn('Swiper init failed or not loaded', e);
    }
  };

  // ---------- Init ----------
  const init = () => {
    loadCart();
    renderProducts();
    renderCart();
    attachListeners();
    initSwiper();

    // Accessibility: make mobile menu focusable
    if (mobileMenu) mobileMenu.setAttribute('role', 'menu');
  };

  // Run init on DOMContentLoaded (script is deferred so DOM ready should be OK)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
