(() => {
  const PRODUCT = { id: 'brewgo', name: 'BrewGo Portable Espresso', img: 'assets/brewgo.webp' };

  const COLORS = [
    { id: 'sort', name: 'Sort', hex: '#2b2725', bg: '#f2e9df' },
  ];

  const BUNDLES = [
    { id: '1', name: '1 stk', units: 1, price: 599, compare: 799 },
    { id: '2', name: '2 stk', units: 2, price: 1049, compare: 1598, tag: 'Spar 150 kr', sub: 'En til dig og en til en ven' },
  ];

  const ADDONS = [
    { id: 'adapter', name: 'Adapter til malet kaffe', price: 79 },
    { id: 'etui', name: 'Beskyttende rejseetui', price: 129 },
    { id: 'bil', name: '12V biloplader', price: 89 },
  ];

  const FREE_SHIPPING = 499;
  const SHIPPING = 49;
  const HOME_DELIVERY = 30;
  const STORAGE_KEY = 'brewgo-cart';

  const $ = (sel) => document.querySelector(sel);
  const kr = (n) => `${n.toLocaleString('da-DK')} kr`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = { color: COLORS[0], bundle: BUNDLES[0], addons: new Set() };
  let cart = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }

  // ---------- Produktvalg ----------
  function renderOptions() {
    $('#swatches').innerHTML = COLORS.map((c) =>
      `<button type="button" class="swatch" style="background:${c.hex}" data-color="${c.id}" aria-label="${c.name}" aria-pressed="${c === state.color}"></button>`
    ).join('');

    $('#bundles').innerHTML = BUNDLES.map((b) => `
      <label class="choice">
        <input type="radio" name="bundle" value="${b.id}" ${b === state.bundle ? 'checked' : ''}>
        <span class="grow"><span>${b.name}${b.tag ? `<span class="tag">${b.tag}</span>` : ''}</span>${b.sub ? `<span class="sub">${b.sub}</span>` : ''}</span>
        <strong>${kr(b.price)}</strong>
      </label>`).join('');

    $('#addons').innerHTML = ADDONS.map((a) => `
      <label class="choice">
        <input type="checkbox" value="${a.id}" ${state.addons.has(a.id) ? 'checked' : ''}>
        <span class="grow">${a.name}</span>
        <strong>+${kr(a.price)}</strong>
      </label>`).join('');
  }

  function updatePrice() {
    $('#price').textContent = kr(state.bundle.price);
    $('#compare').textContent = kr(state.bundle.compare);
    $('#colorName').textContent = state.color.name;
  }

  $('#swatches').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    state.color = COLORS.find((c) => c.id === btn.dataset.color);
    document.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', s === btn));
    updatePrice();
  });
  $('#bundles').addEventListener('change', (e) => {
    state.bundle = BUNDLES.find((b) => b.id === e.target.value);
    updatePrice();
  });
  $('#addons').addEventListener('change', (e) => {
    e.target.checked ? state.addons.add(e.target.value) : state.addons.delete(e.target.value);
  });

  const qtyInput = $('#qty');
  const clampQty = (n) => Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1));
  $('#qtyMinus').addEventListener('click', () => { qtyInput.value = clampQty(+qtyInput.value - 1); });
  $('#qtyPlus').addEventListener('click', () => { qtyInput.value = clampQty(+qtyInput.value + 1); });
  qtyInput.addEventListener('change', () => { qtyInput.value = clampQty(parseInt(qtyInput.value, 10)); });

  // ---------- Kurv ----------
  function addItem(item, qty) {
    const existing = cart.find((i) => i.key === item.key);
    if (existing) existing.qty = Math.min(99, existing.qty + qty);
    else cart.push({ ...item, qty });
  }

  $('#addToCart').addEventListener('click', () => {
    const qty = clampQty(parseInt(qtyInput.value, 10));
    addItem({
      key: `${PRODUCT.id}-${state.color.id}-${state.bundle.id}`,
      name: PRODUCT.name,
      meta: `${state.color.name} · ${state.bundle.name}`,
      price: state.bundle.price,
      img: PRODUCT.img,
    }, qty);
    state.addons.forEach((id) => {
      const a = ADDONS.find((x) => x.id === id);
      addItem({ key: `addon-${a.id}`, name: a.name, meta: 'Tilbehør', price: a.price, img: PRODUCT.img }, qty);
    });
    save();
    renderCart();
    toast('Lagt i kurven ☕');
    openCart();
  });

  const subtotal = () => cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingCost = (sub, delivery = 'pakkeshop') => {
    if (sub === 0) return 0;
    const base = sub >= FREE_SHIPPING ? 0 : SHIPPING;
    return base + (delivery === 'hjem' ? HOME_DELIVERY : 0);
  };

  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    $('#cartCount').textContent = count;

    const list = $('#cartItems');
    if (!cart.length) {
      list.innerHTML = '<li class="empty">Din kurv er tom.</li>';
    } else {
      list.innerHTML = cart.map((i) => `
        <li class="cart-item" data-key="${esc(i.key)}">
          <img src="${esc(i.img)}" alt="">
          <div>
            <div class="name">${esc(i.name)}</div>
            <div class="meta">${esc(i.meta)}</div>
            <div class="mini-qty">
              <button type="button" data-act="dec" aria-label="Færre">−</button>
              <span>${i.qty}</span>
              <button type="button" data-act="inc" aria-label="Flere">+</button>
              <button type="button" class="remove" data-act="rm">Fjern</button>
            </div>
          </div>
          <strong>${kr(i.price * i.qty)}</strong>
        </li>`).join('');
    }

    const sub = subtotal();
    const ship = shippingCost(sub);
    $('#subtotal').textContent = kr(sub);
    $('#shipping').textContent = sub === 0 ? '–' : ship === 0 ? 'Gratis' : kr(ship);
    $('#total').textContent = kr(sub + ship);
    $('#checkoutBtn').disabled = !cart.length;

    const left = FREE_SHIPPING - sub;
    $('#shipText').textContent = left > 0 ? `Du mangler ${kr(left)} for fri fragt` : 'Du har fri fragt 🎉';
    $('#shipFill').style.width = `${Math.min(100, (sub / FREE_SHIPPING) * 100)}%`;
  }

  $('#cartItems').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const key = btn.closest('.cart-item').dataset.key;
    const item = cart.find((i) => i.key === key);
    if (!item) return;
    if (btn.dataset.act === 'inc') item.qty = Math.min(99, item.qty + 1);
    if (btn.dataset.act === 'dec') item.qty -= 1;
    if (btn.dataset.act === 'rm' || item.qty <= 0) cart = cart.filter((i) => i !== item);
    save();
    renderCart();
  });

  const drawer = $('#drawer');
  const overlay = $('#overlay');
  function openCart() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
  }
  function closeCart() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
  }
  $('#cartOpen').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  // ---------- Kasse ----------
  const dialog = $('#checkout');
  const form = $('#checkoutForm');

  function updateCheckoutTotal() {
    const sub = subtotal();
    $('#checkoutTotal').textContent = kr(sub + shippingCost(sub, $('#delivery').value));
  }

  $('#checkoutBtn').addEventListener('click', () => {
    if (!cart.length) return;
    closeCart();
    form.hidden = false;
    $('#confirm').hidden = true;
    $('#formError').textContent = '';
    updateCheckoutTotal();
    dialog.showModal();
  });
  $('#delivery').addEventListener('change', updateCheckoutTotal);
  $('#checkoutClose').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('input').forEach((input) => {
      const valid = input.checkValidity() && input.value.trim() !== '';
      input.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      $('#formError').textContent = 'Udfyld venligst alle felter korrekt (postnummer skal være 4 cifre).';
      return;
    }
    const data = new FormData(form);
    $('#orderNo').textContent = `BG-${Date.now().toString().slice(-6)}`;
    $('#orderEmail').textContent = data.get('email');
    form.hidden = true;
    $('#confirm').hidden = false;
    cart = [];
    save();
    renderCart();
    form.reset();
  });
  $('#confirmClose').addEventListener('click', () => dialog.close());

  // ---------- Diverse ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  $('#newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#newsMsg').textContent = 'Tak! Din rabatkode er på vej i din indbakke.';
    e.target.reset();
  });

  $('#year').textContent = new Date().getFullYear();

  renderOptions();
  updatePrice();
  renderCart();
})();
