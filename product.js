/* product.js
   Product listing + shared cart UI for product.html
   - Uses localStorage key 'palme_cart_v1' to share cart across pages
   - Renders product grid, quick-view modal, and cart panel
   - Add / increase / decrease quantity operations with event delegation
*/

(() => {
  // ---------- Utilities ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const formatPrice = n => `$${Number(n).toFixed(2)}`;
  const debounce = (fn, wait = 200) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };

  // ---------- DOM references ----------
  const searchInput = $('#search');
  const categoriesWrap = $('#categories');
  const sortSelect = $('#sort');
  const productsGrid = $('#productsGrid');
  const loadMoreBtn = $('#loadMore');
  const modal = $('#modal');
  const modalClose = $('#modalClose');
  const modalImg = $('#modalImg');
  const modalName = $('#modalName');
  const modalDesc = $('#modalDesc');
  const modalPrice = $('#modalPrice');
  const modalAdd = $('#modalAdd');

  // Cart elements
  const cartIcon = $('.cart-icon');
  const cartTab = $('.cart-tab');
  const cartList = $('.cart-list');
  const cartTotalEl = $('.cart-total');
  const closeCartBtn = $('.close-btn');
  const CART_KEY = 'palme_cart_v1';

  // ---------- Product Data ----------
  // Replace image paths & data as needed
  const PRODUCTS = [
    { id:'burger-01', name:'Double Beef Burger', price:200, img:'images/burger.png', category:'Fast Food', desc:'Juicy double beef with cheese.'},
    { id:'burger-02', name:'Classic Chicken Burger', price:180, img:'images/burger.png', category:'Fast Food', desc:'Crispy chicken with fresh lettuce.'},
    { id:'burger-03', name:'Veggie Delight', price:150, img:'images/burger.png', category:'Fast Food', desc:'Plant-based burger.'},
    { id:'snack-01', name:'Potato Chips (200g)', price:40, img:'images/snack.png', category:'Snacks', desc:'Crunchy salted chips.'},
    { id:'snack-02', name:'Mixed Nuts 250g', price:220, img:'images/snack.png', category:'Snacks', desc:'Healthy nut mix.'},
    { id:'milk-01', name:'Fresh Milk 1L', price:75, img:'images/milk.png', category:'Dairy', desc:'Full cream fresh milk.'},
    { id:'juice-01', name:'Orange Juice 500ml', price:65, img:'images/juice.png', category:'Beverage', desc:'No added sugar.'},
    { id:'veg-01', name:'Organic Tomatoes 1kg', price:120, img:'images/tomato.png', category:'Vegetables', desc:'Locally sourced tomatoes.'},
    { id:'ice-01', name:'Vanilla Ice Cream 500g', price:150, img:'images/icecream.png', category:'Frozen', desc:'Creamy vanilla.'},
    { id:'bread-01', name:'Whole Grain Bread', price:55, img:'images/bread.png', category:'Bakery', desc:'Baked fresh daily.'}
  ];

  // ---------- UI State ----------
  let activeCategory = 'All';
  let query = '';
  let sortBy = 'relevance';
  let page = 0;
  const PAGE_SIZE = 6;

  // ---------- Cart State ----------
  let cart = {}; // { id: { ...product, qty } }

  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      cart = raw ? JSON.parse(raw) : {};
    } catch (e) {
      cart = {};
    }
  };
  const saveCart = () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) { /* ignore */ }
    updateCartBadge();
  };

  const updateCartBadge = () => {
    const totalQty = Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
    // update all badges on page
    document.querySelectorAll('.cart-value').forEach(b => b.textContent = totalQty);
  };

  // ---------- Products UI ----------
  const getCategories = () => {
    const set = new Set(PRODUCTS.map(p => p.category));
    return ['All', ...Array.from(set)];
  };

  const filterProducts = () => {
    const text = query.trim().toLowerCase();
    return PRODUCTS.filter(p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (text && !p.name.toLowerCase().includes(text) && !(p.desc || '').toLowerCase().includes(text)) return false;
      return true;
    }).sort((a,b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // relevance
    });
  };

  const renderCategories = () => {
    if (!categoriesWrap) return;
    const cats = getCategories();
    categoriesWrap.innerHTML = cats.map(c => `<button class="filter-btn${c===activeCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`).join(' ');
  };

  const renderProductsGrid = (reset = false) => {
    const list = filterProducts();
    if (reset) {
      page = 0;
      productsGrid.innerHTML = '';
    }
    const start = page * PAGE_SIZE;
    const slice = list.slice(start, start + PAGE_SIZE);
    if (!slice.length && page === 0) {
      productsGrid.innerHTML = `<p style="padding:1rem;color:#666;">No products found.</p>`;
      loadMoreBtn.style.display = 'none';
      return;
    }
    const html = slice.map(p => `
      <article class="product-card" data-id="${p.id}">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        <h4>${p.name}</h4>
        <div class="meta">
          <div>${formatPrice(p.price)}</div>
          <div>
            <a href="#" class="btn quick-view" data-id="${p.id}">Quick view</a>
          </div>
        </div>
        <div style="margin-top:.75rem;">
          <a href="#" class="btn add-to-cart" data-id="${p.id}">Add to Cart</a>
        </div>
      </article>
    `).join('');
    productsGrid.insertAdjacentHTML('beforeend', html);

    const moreLeft = (start + PAGE_SIZE) < list.length;
    loadMoreBtn.style.display = moreLeft ? 'inline-block' : 'none';
  };

  // ---------- Cart UI render ----------
  const renderCartUI = () => {
    if (!cartList) return;
    const items = Object.values(cart);
    if (!items.length) {
      cartList.innerHTML = `<p style="padding:1rem;text-align:center;color:#666;">Your cart is empty.</p>`;
      cartTotalEl.textContent = formatPrice(0);
      updateCartBadge();
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

    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    cartTotalEl.textContent = formatPrice(total);
    updateCartBadge();
  };

  // ---------- Cart operations ----------
  const addToCart = (productId, qty = 1) => {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    if (!cart[productId]) cart[productId] = { ...p, qty: 0 };
    cart[productId].qty += qty;
    if (cart[productId].qty <= 0) delete cart[productId];
    saveCart();
    renderCartUI();
  };

  const changeQty = (productId, nextQty) => {
    if (!cart[productId]) return;
    cart[productId].qty = nextQty;
    if (cart[productId].qty <= 0) delete cart[productId];
    saveCart();
    renderCartUI();
  };

  // ---------- Modal functions ----------
  const openModal = (productId) => {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    modalImg.src = p.img;
    modalImg.alt = p.name;
    modalName.textContent = p.name;
    modalDesc.textContent = p.desc || '';
    modalPrice.textContent = formatPrice(p.price);
    modalAdd.dataset.id = p.id;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  };
  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  // ---------- Cart panel open/close ----------
  const openCart = () => {
    cartTab.classList.add('cart-tab-active');
    cartTab.setAttribute('aria-hidden', 'false');
    renderCartUI();
  };
  const closeCart = () => {
    cartTab.classList.remove('cart-tab-active');
    cartTab.setAttribute('aria-hidden', 'true');
  };

  // ---------- Event Handlers ----------
  const attachListeners = () => {
    // category clicks
    categoriesWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      activeCategory = btn.dataset.cat;
      renderCategories();
      renderProductsGrid(true);
    });

    // sort
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProductsGrid(true);
    });

    // search (debounced)
    searchInput.addEventListener('input', debounce((e) => {
      query = e.target.value;
      renderProductsGrid(true);
    }, 250));

    // load more
    loadMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      page++;
      renderProductsGrid(false);
    });

    // product grid delegation (quick view & add-to-cart)
    productsGrid.addEventListener('click', (e) => {
      const qv = e.target.closest('.quick-view');
      if (qv) {
        e.preventDefault();
        openModal(qv.dataset.id);
        return;
      }
      const atc = e.target.closest('.add-to-cart');
      if (atc) {
        e.preventDefault();
        addToCart(atc.dataset.id, 1);
        const btn = atc;
        const prev = btn.textContent;
        btn.textContent = 'Added ✓';
        setTimeout(() => btn.textContent = prev, 900);
      }
    });

    // modal controls
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modal.classList.contains('active')) closeModal();
        if (cartTab.classList.contains('cart-tab-active')) closeCart();
      }
    });
    modalAdd.addEventListener('click', (e) => {
      e.preventDefault();
      const id = modalAdd.dataset.id;
      addToCart(id, 1);
      const old = modalAdd.textContent;
      modalAdd.textContent = 'Added ✓';
      setTimeout(() => modalAdd.textContent = old, 900);
    });

    // cart icon opens cart
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });

    // close cart button
    closeCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeCart();
    });

    // cart quantity delegation
    cartList.addEventListener('click', (e) => {
      const dec = e.target.closest('.qty-decrease');
      const inc = e.target.closest('.qty-increase');
      if (!dec && !inc) return;
      e.preventDefault();
      const id = (dec || inc).dataset.id;
      const current = cart[id] ? cart[id].qty : 0;
      const next = dec ? current - 1 : current + 1;
      changeQty(id, next);
    });

    // close mobile menu when clicking outside (reuse mobile menu markup)
    document.addEventListener('click', (ev) => {
      const mobileMenu = $('.mobile-menu');
      const hamburger = $('.hamburger');
      if (!mobileMenu || !hamburger) return;
      if (!mobileMenu.classList.contains('mobile-menu-active')) return;
      if (ev.target.closest('.mobile-menu') || ev.target.closest('.hamburger')) return;
      mobileMenu.classList.remove('mobile-menu-active');
    });
    // hamburger toggle
    const hamburger = $('.hamburger');
    const mobileMenu = $('.mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenu.classList.toggle('mobile-menu-active');
      });
    }

    // prevent default on empty anchors globally
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href').trim();
      if (href === '#' || href === '') e.preventDefault();
    });
  };

  // ---------- Init ----------
  const init = () => {
    loadCart();
    renderCategories();
    renderProductsGrid(true);
    renderCartUI();
    attachListeners();
    updateCartBadge();
  };

  // run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

})();
