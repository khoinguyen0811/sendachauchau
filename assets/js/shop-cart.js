(() => {
  "use strict";
  const KEY = "chau-chau-cart-v1";
  const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const getItems = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const setItems = (items) => { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event("cart:update")); };
  const total = (items = getItems()) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = (items = getItems()) => items.reduce((sum, item) => sum + item.quantity, 0);
  function ensureSwal(cb) {
    if (window.Swal) { if (cb) cb(); return; }
    if (document.getElementById("swal2-cdn-script")) return;
    const script = document.createElement("script");
    script.id = "swal2-cdn-script";
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = () => { if (cb) cb(); };
    document.head.appendChild(script);
  }

  function showAddSuccessAlert(product) {
    ensureSwal(() => {
      if (!window.Swal) return;
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        customClass: {
          popup: "rounded-2xl shadow-xl border border-stone-200/80 bg-white font-sans text-xs p-4",
        },
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        }
      });

      Toast.fire({
        icon: "success",
        title: "Đã thêm vào giỏ hàng!",
        html: `<span class="text-stone-600 text-xs font-normal">Sản phẩm <b>${escapeHtml(product.name)}</b> đã được thêm vào giỏ.</span>`
      });
    });
  }

  function showOrderSuccessAlert(cb) {
    ensureSwal(() => {
      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "Đặt hàng thành công!",
          text: "Cảm ơn bạn đã lựa chọn Sen đá Châu Châu. Shop sẽ liên hệ xác nhận đơn hàng sớm nhất!",
          confirmButtonColor: "#264332",
          confirmButtonText: "Hoàn tất đơn hàng",
          customClass: {
            popup: "rounded-3xl shadow-2xl font-sans",
            confirmButton: "rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider"
          }
        }).then(() => {
          if (cb) cb();
        });
      } else {
        if (cb) cb();
      }
    });
  }

  function updateBadges() {
    document.querySelectorAll("[data-cart-count]").forEach((badge) => { badge.textContent = count(); });
  }
  function drawerMarkup() {
    return `<div id="cart-overlay" class="fixed inset-0 z-[100] hidden bg-black/50 backdrop-blur-sm"></div><aside id="cart-drawer" class="fixed right-0 top-0 z-[101] h-dvh w-full max-w-md translate-x-full bg-white shadow-2xl transition-transform duration-300 flex flex-col"><div class="flex items-center justify-between bg-primary px-6 py-5 text-white"><div><p class="text-xs uppercase tracking-[.18em] text-white/70">Châu Châu Garden</p><h2 class="font-serif-title text-xl">Giỏ hàng của bạn</h2></div><button data-close-cart class="w-9 h-9 rounded-full hover:bg-white/15 text-2xl" aria-label="Đóng giỏ hàng">×</button></div><div id="cart-drawer-items" class="flex-1 overflow-y-auto p-5"></div><div class="border-t border-stone-200 p-5"><div class="flex justify-between text-sm text-stone-600 mb-2"><span>Tạm tính</span><strong id="cart-subtotal"></strong></div><div class="flex justify-between text-lg font-bold text-[#AE9077] mb-4"><span>Tổng cộng</span><strong id="cart-total" class="text-[#AE9077]"></strong></div><div class="grid grid-cols-2 gap-3"><a href="gio-hang.html" class="text-center border border-[#264332] text-[#264332] py-3 rounded-xl text-xs font-bold hover:bg-[#264332] hover:text-white transition-colors">Xem giỏ hàng</a><a href="thanh-toan.html" class="text-center bg-[#AE9077] hover:bg-[#977B63] text-white py-3 rounded-xl text-xs font-bold transition-colors">Thanh toán</a></div></div></aside>`;
  }
  function itemMarkup(item) {
    return `<article class="flex gap-3 py-4 border-b border-stone-100"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="w-20 h-20 rounded-xl object-cover bg-stone-100" onerror="this.style.visibility='hidden'"><div class="min-w-0 flex-1"><h3 class="text-sm font-bold text-primary line-clamp-2">${escapeHtml(item.name)}</h3><p class="text-[11px] text-stone-500 mt-1 line-clamp-1">${escapeHtml(item.variantLabel || "Mặc định")}</p><p class="text-sm font-bold text-[#AE9077] mt-2">${money(item.price)}</p><div class="flex items-center justify-between mt-2"><div class="flex border border-stone-200 rounded-lg overflow-hidden"><button data-cart-quantity="${escapeHtml(item.key)}" data-delta="-1" class="w-7 h-7 hover:bg-stone-100">−</button><span class="w-7 h-7 text-xs flex items-center justify-center">${item.quantity}</span><button data-cart-quantity="${escapeHtml(item.key)}" data-delta="1" class="w-7 h-7 hover:bg-stone-100">+</button></div><button data-cart-remove="${escapeHtml(item.key)}" class="text-[11px] font-semibold text-rose-600">Xóa</button></div></div></article>`;
  }
  function renderDrawer() {
    const container = document.getElementById("cart-drawer-items");
    if (!container) return;
    const items = getItems();
    container.innerHTML = items.length ? items.map(itemMarkup).join("") : `<div class="h-full min-h-64 flex flex-col items-center justify-center text-center"><span class="material-symbols-outlined text-5xl text-stone-300 mb-3">shopping_bag</span><p class="font-serif-title text-xl text-[#264332]">Giỏ hàng đang trống</p><p class="text-xs text-stone-500 mt-2">Hãy chọn một chậu cây thật xinh nhé.</p></div>`;
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
    setItems(items);
    showAddSuccessAlert(product);
  }
  function change(key, delta) { const items = getItems(); const item = items.find((entry) => entry.key === key); if (!item) return; item.quantity += delta; setItems(items.filter((entry) => entry.quantity > 0)); renderDrawer(); }
  function remove(key) { setItems(getItems().filter((item) => item.key !== key)); renderDrawer(); }
  function bindHeaderCart() {
    document.querySelectorAll("a,button").forEach((element) => {
      if (element.dataset.cartBound) return;
      const isCartLink = element.getAttribute("href")?.includes("gio-hang.html") || 
                         element.textContent.includes("Giỏ hàng") || 
                         element.getAttribute("title") === "Giỏ hàng" ||
                         element.querySelector("[data-cart-count]");
      if (!isCartLink) return;
      element.dataset.cartBound = "true";
      element.addEventListener("click", (event) => { event.preventDefault(); open(); });
    });
  }
  function initCategoryDrawer() {
    if (!document.getElementById("category-drawer")) {
      const markup = `<div id="category-drawer-overlay" class="fixed inset-0 z-[110] hidden bg-black/50 backdrop-blur-xs transition-opacity duration-300"></div><aside id="category-drawer" class="fixed left-0 top-0 z-[111] h-dvh w-[85%] max-w-sm -translate-x-full bg-white shadow-2xl transition-transform duration-300 flex flex-col font-sans"><div class="flex items-center justify-between bg-[#264332] px-5 py-4 text-white shrink-0"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-xl">menu</span><h2 class="font-bold text-sm uppercase tracking-wider text-white">DANH MỤC SẢN PHẨM</h2></div><button data-close-category-drawer class="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-xl text-white transition-colors" aria-label="Đóng danh mục"><span class="material-symbols-outlined text-lg">close</span></button></div><div class="flex-1 overflow-y-auto py-2 divide-y divide-stone-100" id="category-drawer-items"><a href="san-pham.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">eco</span><span class="text-sm font-semibold">Tất cả sản phẩm</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html?category=cate-sen-da" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">potted_plant</span><span class="text-sm font-semibold">Sen đá</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html?category=cate-xuong-rong" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">potted_plant</span><span class="text-sm font-semibold">Xương rồng</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">forest</span><span class="text-sm font-semibold">Terrarium & Tiểu cảnh</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">view_in_ar</span><span class="text-sm font-semibold">Chậu cây & Phụ kiện</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">park</span><span class="text-sm font-semibold">Cây phong thủy</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">card_giftcard</span><span class="text-sm font-semibold">Combo quà tặng</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="lien-he.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">handyman</span><span class="text-sm font-semibold">Dịch vụ & Chăm sóc</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="tin-tuc.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">article</span><span class="text-sm font-semibold">Bài viết & Tin tức</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="gioi-thieu.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-stone-800 transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#264332] group-hover:scale-110 transition-transform">shield</span><span class="text-sm font-semibold">Bảo hành - Đổi trả</span></div><span class="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span></a><a href="san-pham.html" class="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F7EE] text-[#C86A4B] font-bold transition-colors group"><div class="flex items-center gap-3.5"><span class="material-symbols-outlined text-lg text-[#C86A4B] group-hover:scale-110 transition-transform">sell</span><span class="text-sm">Tin khuyến mãi & Ưu đãi</span></div><span class="material-symbols-outlined text-sm text-[#C86A4B] group-hover:translate-x-1 transition-transform">chevron_right</span></a></div></aside>`;
      document.body.insertAdjacentHTML("beforeend", markup);
    }
    const drawer = document.getElementById("category-drawer");
    const overlay = document.getElementById("category-drawer-overlay");
    const openDrawer = () => { overlay?.classList.remove("hidden"); drawer?.classList.remove("-translate-x-full"); };
    const closeDrawer = () => { overlay?.classList.add("hidden"); drawer?.classList.add("-translate-x-full"); };

    // Bind mobile drawer ONLY to mobile menu buttons
    document.querySelectorAll("#btn-toggle-category-drawer, [data-open-category-drawer]").forEach((btn) => {
      if (btn.dataset.categoryDrawerBound) return;
      btn.dataset.categoryDrawerBound = "true";
      btn.addEventListener("click", (e) => { e.preventDefault(); openDrawer(); });
    });
    document.querySelectorAll("[data-close-category-drawer], #category-drawer-overlay").forEach((btn) => {
      btn.addEventListener("click", closeDrawer);
    });

    // Bind desktop dropdown toggle for #btn-danh-muc if not bound by inline script
    const btnDanhMuc = document.getElementById("btn-danh-muc");
    const dropdownDanhMuc = document.getElementById("dropdown-danh-muc");
    const danhMucArrow = document.getElementById("danh-muc-arrow");

    if (btnDanhMuc && dropdownDanhMuc && !btnDanhMuc.dataset.dropdownBound) {
      btnDanhMuc.dataset.dropdownBound = "true";
      btnDanhMuc.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isHidden = dropdownDanhMuc.classList.contains("hidden");
        if (isHidden) {
          dropdownDanhMuc.classList.remove("hidden");
          if (danhMucArrow) danhMucArrow.style.transform = "rotate(180deg)";
        } else {
          dropdownDanhMuc.classList.add("hidden");
          if (danhMucArrow) danhMucArrow.style.transform = "rotate(0deg)";
        }
      });

      document.addEventListener("click", (e) => {
        if (!dropdownDanhMuc.contains(e.target) && !btnDanhMuc.contains(e.target)) {
          dropdownDanhMuc.classList.add("hidden");
          if (danhMucArrow) danhMucArrow.style.transform = "rotate(0deg)";
        }
      });
    }
  }

  function enableDragScroll(el) {
    if (!el || el.dataset.dragScrollBound) return;
    el.dataset.dragScrollBound = "true";
    let isDown = false, startX = 0, scrollLeft = 0, moved = false;
    el.style.cursor = "grab";
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true; moved = false;
      el.style.cursor = "grabbing";
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener("mouseleave", () => { isDown = false; el.style.cursor = "grab"; });
    el.addEventListener("mouseup", () => { isDown = false; el.style.cursor = "grab"; });
    el.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 4) moved = true;
      el.scrollLeft = scrollLeft - walk;
    });
    el.addEventListener("click", (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  function initDragScroll() {
    document.querySelectorAll("nav, .no-scrollbar, [data-drag-scroll], #cate-pill-container, .overflow-x-auto").forEach(enableDragScroll);
  }

  function init() {
    if (!document.getElementById("cart-drawer")) document.body.insertAdjacentHTML("beforeend", drawerMarkup());
    document.getElementById("cart-overlay")?.addEventListener("click", close);
    document.querySelector("[data-close-cart]")?.addEventListener("click", close);
    window.addEventListener("cart:update", updateBadges);
    bindHeaderCart(); updateBadges(); initCategoryDrawer(); initDragScroll();
  }
  function renderCartPage() {
    const root = document.getElementById("cart-page-root"); if (!root) return;
    const items = getItems();
    root.innerHTML = `<section class="max-w-6xl mx-auto px-4 py-12"><p class="text-xs font-bold uppercase tracking-[.18em] text-secondary">Giỏ hàng</p><h1 class="font-serif-title text-4xl text-primary mt-2">Chậu cây bạn đã chọn</h1><div class="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 mt-8"><div class="bg-white rounded-3xl border border-stone-200 p-5">${items.length ? items.map(itemMarkup).join("") : `<p class="text-stone-500 py-16 text-center">Giỏ hàng đang trống. <a class="text-primary font-bold" href="san-pham.html">Khám phá sản phẩm</a></p>`}</div><aside class="bg-[#F5F4EF] rounded-3xl p-6 h-fit"><h2 class="font-serif-title text-2xl text-primary">Tóm tắt đơn hàng</h2><div class="flex justify-between text-sm mt-5"><span>Tạm tính</span><strong>${money(total(items))}</strong></div><div class="border-t border-stone-300 mt-4 pt-4 flex justify-between text-lg font-bold text-[#AE9077]"><span>Tổng cộng</span><span class="text-[#AE9077]">${money(total(items))}</span></div><a href="thanh-toan.html" class="block text-center bg-[#AE9077] hover:bg-[#977B63] text-white mt-6 py-3.5 rounded-xl text-xs font-bold transition-colors ${items.length ? "" : "pointer-events-none opacity-40"}">TIẾN HÀNH THANH TOÁN</a></aside></div></section>`;
    root.querySelectorAll("[data-cart-quantity]").forEach((button) => button.addEventListener("click", () => { change(button.dataset.cartQuantity, Number(button.dataset.delta)); renderCartPage(); }));
    root.querySelectorAll("[data-cart-remove]").forEach((button) => button.addEventListener("click", () => { remove(button.dataset.cartRemove); renderCartPage(); }));
  }
  function renderCheckoutPage() {
    const items = getItems();
    const subtotalEl = document.getElementById("checkout-subtotal");
    const totalEl = document.getElementById("checkout-total");
    const itemsEl = document.getElementById("checkout-summary-items");
    const shippingFee = items.length ? 30000 : 0;
    const subtotal = total(items);
    const finalTotal = subtotal + shippingFee;

    if (itemsEl) {
      itemsEl.innerHTML = items.length
        ? items
            .map(
              (item) => `
          <div class="flex items-center justify-between gap-3 py-3 border-b border-stone-100">
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative shrink-0">
                <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="w-14 h-14 rounded-xl object-cover border border-stone-200" onerror="this.style.visibility='hidden'">
                <span class="absolute -top-1.5 -right-1.5 bg-[#264332] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">SL: ${item.quantity}</span>
              </div>
              <div class="min-w-0">
                <h4 class="text-xs font-bold text-stone-800 line-clamp-2 leading-snug">${escapeHtml(item.name)}</h4>
                <p class="text-[11px] text-stone-400 mt-0.5">${escapeHtml(item.variantLabel || "Mặc định")}</p>
              </div>
            </div>
            <span class="text-xs font-bold text-[#AE9077] shrink-0">${money(item.price * item.quantity)}</span>
          </div>
        `
            )
            .join("")
        : `<div class="py-8 text-center"><span class="material-symbols-outlined text-4xl text-stone-300 mb-2">shopping_cart</span><p class="text-xs text-stone-500 font-medium">Giỏ hàng của bạn đang trống.</p><a href="san-pham.html" class="inline-block mt-3 text-xs font-bold text-[#264332] hover:underline">Quay lại mua sắm →</a></div>`;
    }

    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (totalEl) totalEl.textContent = money(finalTotal);

    const form = document.getElementById("checkout-form");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "true";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        showOrderSuccessAlert(() => {
          localStorage.removeItem(KEY);
          location.href = "dat-hang-thanh-cong.html";
        });
      });
    }

    const root = document.getElementById("checkout-page-root");
    if (root && !root.children.length) {
      root.innerHTML = `<section class="max-w-6xl mx-auto px-4 py-12"><p class="text-xs font-bold uppercase tracking-[.18em] text-secondary">Thanh toán</p><h1 class="font-serif-title text-4xl text-primary mt-2">Thông tin đặt hàng</h1><form id="checkout-form" class="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 mt-8"><div class="bg-white rounded-3xl border border-stone-200 p-6 space-y-5"><h2 class="font-serif-title text-2xl text-primary">Thông tin nhận hàng</h2><div class="grid sm:grid-cols-2 gap-4"><input required placeholder="Họ và tên *" class="border border-stone-200 rounded-xl p-3 text-sm"><input required type="tel" placeholder="Số điện thoại *" class="border border-stone-200 rounded-xl p-3 text-sm"></div><input required placeholder="Địa chỉ nhận hàng *" class="w-full border border-stone-200 rounded-xl p-3 text-sm"><textarea placeholder="Ghi chú cho shop" class="w-full border border-stone-200 rounded-xl p-3 text-sm h-24"></textarea><label class="flex gap-3 items-center border border-primary rounded-xl p-4"><input type="radio" checked><span class="text-sm font-semibold">Thanh toán khi nhận hàng (COD)</span></label></div><aside class="bg-[#F5F4EF] rounded-3xl p-6 h-fit"><h2 class="font-serif-title text-2xl text-primary">Đơn hàng (${count(items)})</h2><div class="max-h-60 overflow-y-auto mt-3">${items.map(itemMarkup).join("") || `<p class="text-sm text-stone-500 py-5">Giỏ hàng đang trống.</p>`}</div><div class="border-t border-stone-300 mt-4 pt-4 flex justify-between text-lg font-bold text-[#AE9077]"><span>Tổng cộng</span><span class="text-[#AE9077]">${money(total(items))}</span></div><button ${items.length ? "" : "disabled"} class="w-full bg-[#AE9077] hover:bg-[#977B63] text-white mt-6 py-3.5 rounded-xl text-xs font-bold disabled:opacity-40">ĐẶT HÀNG</button></aside></form></section>`;
      root.querySelector("#checkout-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        showOrderSuccessAlert(() => {
          localStorage.removeItem(KEY);
          location.href = "dat-hang-thanh-cong.html";
        });
      });
    }
  }
  window.ShopCart = { add, open, close, init, renderCartPage, renderCheckoutPage, money };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
