(() => {
  "use strict";
  const KEY = "chau-chau-cart-v1";
  const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const getItems = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const setItems = (items) => { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event("cart:update")); };
  const total = (items = getItems()) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = (items = getItems()) => items.reduce((sum, item) => sum + item.quantity, 0);

  function updateBadges() {
    document.querySelectorAll("[data-cart-count]").forEach((badge) => { badge.textContent = count(); });
  }
  function drawerMarkup() {
    return `<div id="cart-overlay" class="fixed inset-0 z-[100] hidden bg-black/50 backdrop-blur-sm"></div><aside id="cart-drawer" class="fixed right-0 top-0 z-[101] h-dvh w-full max-w-md translate-x-full bg-white shadow-2xl transition-transform duration-300 flex flex-col"><div class="flex items-center justify-between bg-primary px-6 py-5 text-white"><div><p class="text-xs uppercase tracking-[.18em] text-white/70">Châu Châu Garden</p><h2 class="font-serif-title text-xl">Giỏ hàng của bạn</h2></div><button data-close-cart class="w-9 h-9 rounded-full hover:bg-white/15 text-2xl" aria-label="Đóng giỏ hàng">×</button></div><div id="cart-drawer-items" class="flex-1 overflow-y-auto p-5"></div><div class="border-t border-stone-200 p-5"><div class="flex justify-between text-sm text-stone-600 mb-2"><span>Tạm tính</span><strong id="cart-subtotal"></strong></div><div class="flex justify-between text-lg font-bold text-primary mb-4"><span>Tổng cộng</span><strong id="cart-total"></strong></div><div class="grid grid-cols-2 gap-3"><a href="gio-hang.html" class="text-center border border-primary text-primary py-3 rounded-xl text-xs font-bold">Xem giỏ hàng</a><a href="thanh-toan.html" class="text-center bg-primary text-white py-3 rounded-xl text-xs font-bold">Thanh toán</a></div></div></aside>`;
  }
  function itemMarkup(item) {
    return `<article class="flex gap-3 py-4 border-b border-stone-100"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="w-20 h-20 rounded-xl object-cover bg-stone-100" onerror="this.style.visibility='hidden'"><div class="min-w-0 flex-1"><h3 class="text-sm font-bold text-primary line-clamp-2">${escapeHtml(item.name)}</h3><p class="text-[11px] text-stone-500 mt-1 line-clamp-1">${escapeHtml(item.variantLabel || "Mặc định")}</p><p class="text-sm font-bold text-primary mt-2">${money(item.price)}</p><div class="flex items-center justify-between mt-2"><div class="flex border border-stone-200 rounded-lg overflow-hidden"><button data-cart-quantity="${escapeHtml(item.key)}" data-delta="-1" class="w-7 h-7 hover:bg-stone-100">−</button><span class="w-7 h-7 text-xs flex items-center justify-center">${item.quantity}</span><button data-cart-quantity="${escapeHtml(item.key)}" data-delta="1" class="w-7 h-7 hover:bg-stone-100">+</button></div><button data-cart-remove="${escapeHtml(item.key)}" class="text-[11px] font-semibold text-rose-600">Xóa</button></div></div></article>`;
  }
  function renderDrawer() {
    const container = document.getElementById("cart-drawer-items");
    if (!container) return;
    const items = getItems();
    container.innerHTML = items.length ? items.map(itemMarkup).join("") : `<div class="h-full min-h-64 flex flex-col items-center justify-center text-center"><span class="material-symbols-outlined text-5xl text-stone-300 mb-3">shopping_bag</span><p class="font-serif-title text-xl text-primary">Giỏ hàng đang trống</p><p class="text-xs text-stone-500 mt-2">Hãy chọn một chậu cây thật xinh nhé.</p></div>`;
    document.getElementById("cart-subtotal").textContent = money(total(items));
    document.getElementById("cart-total").textContent = money(total(items));
    container.querySelectorAll("[data-cart-quantity]").forEach((button) => button.addEventListener("click", () => change(button.dataset.cartQuantity, Number(button.dataset.delta))));
    container.querySelectorAll("[data-cart-remove]").forEach((button) => button.addEventListener("click", () => remove(button.dataset.cartRemove)));
    updateBadges();
  }
  function open() { document.getElementById("cart-overlay")?.classList.remove("hidden"); document.getElementById("cart-drawer")?.classList.remove("translate-x-full"); renderDrawer(); }
  function close() { document.getElementById("cart-overlay")?.classList.add("hidden"); document.getElementById("cart-drawer")?.classList.add("translate-x-full"); }
  function add(product) {
    const items = getItems(); const key = `${product.productId}:${product.variantId}`;
    const existing = items.find((item) => item.key === key);
    if (existing) existing.quantity += product.quantity || 1;
    else items.push({ key, quantity: product.quantity || 1, ...product });
    setItems(items); open();
  }
  function change(key, delta) { const items = getItems(); const item = items.find((entry) => entry.key === key); if (!item) return; item.quantity += delta; setItems(items.filter((entry) => entry.quantity > 0)); renderDrawer(); }
  function remove(key) { setItems(getItems().filter((item) => item.key !== key)); renderDrawer(); }
  function bindHeaderCart() {
    document.querySelectorAll("a,button").forEach((element) => {
      if (element.dataset.cartBound || !element.textContent.includes("Giỏ hàng")) return;
      element.dataset.cartBound = "true";
      element.addEventListener("click", (event) => { event.preventDefault(); open(); });
      const existingBadge = element.querySelector("span.absolute");
      if (existingBadge) existingBadge.setAttribute("data-cart-count", "");
    });
  }
  function init() {
    if (!document.getElementById("cart-drawer")) document.body.insertAdjacentHTML("beforeend", drawerMarkup());
    document.getElementById("cart-overlay")?.addEventListener("click", close);
    document.querySelector("[data-close-cart]")?.addEventListener("click", close);
    window.addEventListener("cart:update", updateBadges);
    bindHeaderCart(); updateBadges();
  }
  function renderCartPage() {
    const root = document.getElementById("cart-page-root"); if (!root) return;
    const items = getItems();
    root.innerHTML = `<section class="max-w-6xl mx-auto px-4 py-12"><p class="text-xs font-bold uppercase tracking-[.18em] text-secondary">Giỏ hàng</p><h1 class="font-serif-title text-4xl text-primary mt-2">Chậu cây bạn đã chọn</h1><div class="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 mt-8"><div class="bg-white rounded-3xl border border-stone-200 p-5">${items.length ? items.map(itemMarkup).join("") : `<p class="text-stone-500 py-16 text-center">Giỏ hàng đang trống. <a class="text-primary font-bold" href="san-pham.html">Khám phá sản phẩm</a></p>`}</div><aside class="bg-[#F5F4EF] rounded-3xl p-6 h-fit"><h2 class="font-serif-title text-2xl text-primary">Tóm tắt đơn hàng</h2><div class="flex justify-between text-sm mt-5"><span>Tạm tính</span><strong>${money(total(items))}</strong></div><div class="border-t border-stone-300 mt-4 pt-4 flex justify-between text-lg font-bold text-primary"><span>Tổng cộng</span><span>${money(total(items))}</span></div><a href="thanh-toan.html" class="block text-center bg-primary text-white mt-6 py-3.5 rounded-xl text-xs font-bold ${items.length ? "" : "pointer-events-none opacity-40"}">TIẾN HÀNH THANH TOÁN</a></aside></div></section>`;
    root.querySelectorAll("[data-cart-quantity]").forEach((button) => button.addEventListener("click", () => { change(button.dataset.cartQuantity, Number(button.dataset.delta)); renderCartPage(); }));
    root.querySelectorAll("[data-cart-remove]").forEach((button) => button.addEventListener("click", () => { remove(button.dataset.cartRemove); renderCartPage(); }));
  }
  function renderCheckoutPage() {
    const root = document.getElementById("checkout-page-root"); if (!root) return;
    const items = getItems();
    root.innerHTML = `<section class="max-w-6xl mx-auto px-4 py-12"><p class="text-xs font-bold uppercase tracking-[.18em] text-secondary">Thanh toán</p><h1 class="font-serif-title text-4xl text-primary mt-2">Thông tin đặt hàng</h1><form id="checkout-form" class="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 mt-8"><div class="bg-white rounded-3xl border border-stone-200 p-6 space-y-5"><h2 class="font-serif-title text-2xl text-primary">Thông tin nhận hàng</h2><div class="grid sm:grid-cols-2 gap-4"><input required placeholder="Họ và tên *" class="border border-stone-200 rounded-xl p-3 text-sm"><input required type="tel" placeholder="Số điện thoại *" class="border border-stone-200 rounded-xl p-3 text-sm"></div><input required placeholder="Địa chỉ nhận hàng *" class="w-full border border-stone-200 rounded-xl p-3 text-sm"><textarea placeholder="Ghi chú cho shop" class="w-full border border-stone-200 rounded-xl p-3 text-sm h-24"></textarea><label class="flex gap-3 items-center border border-primary rounded-xl p-4"><input type="radio" checked><span class="text-sm font-semibold">Thanh toán khi nhận hàng (COD)</span></label></div><aside class="bg-[#F5F4EF] rounded-3xl p-6 h-fit"><h2 class="font-serif-title text-2xl text-primary">Đơn hàng (${count(items)})</h2><div class="max-h-60 overflow-y-auto mt-3">${items.map(itemMarkup).join("") || `<p class="text-sm text-stone-500 py-5">Giỏ hàng đang trống.</p>`}</div><div class="border-t border-stone-300 mt-4 pt-4 flex justify-between text-lg font-bold text-primary"><span>Tổng cộng</span><span>${money(total(items))}</span></div><button ${items.length ? "" : "disabled"} class="w-full bg-primary text-white mt-6 py-3.5 rounded-xl text-xs font-bold disabled:opacity-40">ĐẶT HÀNG</button></aside></form></section>`;
    root.querySelector("#checkout-form")?.addEventListener("submit", (event) => { event.preventDefault(); localStorage.removeItem(KEY); location.href = "dat-hang-thanh-cong.html"; });
  }
  window.ShopCart = { add, open, close, init, renderCartPage, renderCheckoutPage, money };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
