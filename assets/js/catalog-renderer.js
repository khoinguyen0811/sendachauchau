(() => {
  "use strict";

  const DATA_FILES = [
    "data/categories.json",
    "data/catalog-products.json",
    "data/product-variants.json",
    "data/product-descriptions.json",
    "data/product-media.json",
  ];
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
  const plainText = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const formatPrice = (value) => value == null ? "Liên hệ" : `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
  const productUrl = (id) => `chi-tiet-san-pham.html?id=${encodeURIComponent(id)}`;
  const listUrl = (categoryId) => `san-pham.html${categoryId ? `?category=${encodeURIComponent(categoryId)}` : ""}`;

  async function loadCatalog() {
    const responses = await Promise.all(DATA_FILES.map((file) => fetch(file)));
    if (responses.some((response) => !response.ok)) throw new Error("Không thể tải dữ liệu sản phẩm.");
    const [categoriesFile, productsFile, variantsFile, descriptionsFile, mediaFile] = await Promise.all(responses.map((response) => response.json()));
    const categories = categoriesFile.categories;
    const products = productsFile.products;
    const variants = variantsFile.variants;
    const descriptions = descriptionsFile.descriptions;
    const media = mediaFile.media;
    const categoryById = new Map(categories.map((item) => [item.id, item]));
    const productsByCategory = new Map(categories.map((item) => [item.id, []]));
    products.forEach((item) => productsByCategory.get(item.categoryId)?.push(item));
    const variantsByProduct = new Map(products.map((item) => [item.id, []]));
    variants.forEach((item) => variantsByProduct.get(item.productId)?.push(item));
    const descriptionByProduct = new Map(descriptions.map((item) => [item.productId, item]));
    const mediaByProduct = new Map(media.map((item) => [item.productId, item]));
    return { categories, products, categoryById, productsByCategory, variantsByProduct, descriptionByProduct, mediaByProduct };
  }

  function enrich(product, catalog) {
    const variants = catalog.variantsByProduct.get(product.id) || [];
    const prices = variants.map((item) => item.commerce?.["Giá bán"]).filter(Number.isFinite);
    return {
      ...product,
      category: catalog.categoryById.get(product.categoryId),
      variants,
      description: catalog.descriptionByProduct.get(product.id),
      media: catalog.mediaByProduct.get(product.id),
      image: catalog.mediaByProduct.get(product.id)?.primaryImageUrl || "",
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
    };
  }

  function productCard(product, compact = false) {
    const subtitle = product.category?.name || "Sản phẩm từ Sen đá Châu Châu";
    const price = product.minPrice === product.maxPrice 
      ? formatPrice(product.minPrice) 
      : `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`;
    const image = product.image 
      ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.onerror=null; this.src='assets/image/logo.png';">` 
      : `<img src="assets/image/logo.png" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain p-4 bg-stone-100 opacity-60">`;

    return `<article class="bg-[#F5F4EF] rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:bg-white transition-colors duration-300 group min-w-0 border border-stone-200/60 hover:border-[#264332]/30">
      <div>
        <div class="relative aspect-square rounded-xl overflow-hidden mb-3 bg-stone-100">
          <a href="${productUrl(product.id)}" class="block w-full h-full">
            ${image}
          </a>
        </div>
        <a href="${productUrl(product.id)}">
          <h4 class="font-serif-title text-sm sm:text-base font-normal text-primary mb-1 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">${escapeHtml(product.name)}</h4>
        </a>
        <p class="text-[11px] sm:text-xs text-stone-500 mb-2.5 line-clamp-1">${escapeHtml(subtitle)}</p>
      </div>

      <div class="space-y-2 pt-2 border-t border-stone-200/50 mt-auto">
        <div class="flex items-center justify-between gap-1">
          <span class="font-bold text-xs sm:text-sm text-primary whitespace-nowrap">${price}</span>
          <button class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 transition-colors shrink-0" title="Yêu thích">
            <span class="material-symbols-outlined text-base sm:text-lg">favorite</span>
          </button>
        </div>
        <button data-quick-add-id="${escapeHtml(product.id)}" class="w-full py-2 px-2 bg-[#264332] text-white hover:bg-[#1C3A27] active:scale-[0.98] transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">shopping_cart</span>
          <span>Thêm vào giỏ</span>
        </button>
      </div>
    </article>`;
  }

  function isProductInCategory(product, categoryId, catalog) {
    if (!categoryId) return true;
    if (product.categoryId === categoryId) return true;

    const targetCat = catalog.categoryById?.get(categoryId);
    const prodCat = catalog.categoryById?.get(product.categoryId);

    if (targetCat && prodCat) {
      if (prodCat.path && targetCat.name && prodCat.path.includes(targetCat.name)) {
        return true;
      }
      let curr = prodCat;
      while (curr && curr.parentId) {
        if (curr.parentId === categoryId) return true;
        curr = catalog.categoryById.get(curr.parentId);
      }
    }

    if (product.categoryId && categoryId) {
      const cleanTarget = categoryId.replace(/^cate-/, "");
      if (product.categoryId.includes(cleanTarget)) return true;
    }

    return false;
  }

  function categoryLink(category, active = false) {
    return `<a href="${listUrl(category.id)}" class="flex items-center justify-between p-2 rounded-lg ${active ? "text-primary font-bold bg-[#F5F4EF]" : "hover:text-primary hover:bg-stone-50"}">
      <span>${escapeHtml(category.name)}</span><span class="text-[10px] ${active ? "bg-primary text-white px-2 py-0.5 rounded-full" : "text-stone-400"}">${category.productCount}</span>
    </a>`;
  }

  function renderListing(catalog) {
    const grid = document.getElementById("catalog-product-grid");
    if (!grid) return;
    const categoryList = document.getElementById("catalog-category-list");
    const summary = document.getElementById("catalog-summary");
    const sort = document.getElementById("catalog-sort");
    const search = document.querySelector("[data-catalog-search]");
    const initialCategoryId = new URLSearchParams(location.search).get("category") || "";
    const productCount = (category) => catalog.products.filter((p) => isProductInCategory(p, category.id, catalog)).length;
    const leafCategories = catalog.categories.filter((item) => item.isLeaf).map((item) => ({ ...item, realCount: productCount(item) })).filter((item) => item.realCount > 0).sort((a, b) => b.realCount - a.realCount);
    const pageSize = 12;
    let currentPage = 1;
    let query = (new URLSearchParams(location.search).get("q") || "").trim().toLocaleLowerCase("vi");
    let sortBy = "default";

    // Selected Categories State (Array of checked category IDs)
    let selectedCategoryIds = initialCategoryId ? [initialCategoryId] : [];

    // Select2 Advanced Filters State
    let selectedPrice = "all";
    let selectedSizes = [];
    let selectedEnv = "all";

    if (window.jQuery && $.fn.select2) {
      const $priceSelect = $("#select2-price");
      const $sizeSelect = $("#select2-size");
      const $envSelect = $("#select2-env");

      if ($priceSelect.length) {
        $priceSelect.select2({
          placeholder: "Tất cả khoảng giá",
          minimumResultsForSearch: Infinity,
          width: "100%"
        }).on("change", function () {
          selectedPrice = $(this).val() || "all";
          currentPage = 1;
          draw();
        });
      }

      if ($sizeSelect.length) {
        $sizeSelect.select2({
          placeholder: "Chọn kích thước chậu...",
          allowClear: true,
          width: "100%"
        }).on("change", function () {
          selectedSizes = $(this).val() || [];
          currentPage = 1;
          draw();
        });
      }

      if ($envSelect.length) {
        $envSelect.select2({
          placeholder: "Tất cả môi trường",
          minimumResultsForSearch: Infinity,
          width: "100%"
        }).on("change", function () {
          selectedEnv = $(this).val() || "all";
          currentPage = 1;
          draw();
        });
      }

      $("#btn-reset-filters").on("click", function () {
        if ($priceSelect.length) $priceSelect.val("all").trigger("change.select2");
        if ($sizeSelect.length) $sizeSelect.val(null).trigger("change.select2");
        if ($envSelect.length) $envSelect.val("all").trigger("change.select2");
        selectedCategoryIds = [];
        selectedPrice = "all";
        selectedSizes = [];
        selectedEnv = "all";
        currentPage = 1;
        renderCategoryCheckboxes();
        draw();
      });
    }

    // Function to render category checkboxes
    function renderCategoryCheckboxes() {
      if (!categoryList) return;
      const isAllChecked = selectedCategoryIds.length === 0;

      const badge = document.getElementById("cat-selected-badge");
      if (badge) {
        if (selectedCategoryIds.length > 0) {
          badge.textContent = `${selectedCategoryIds.length} đã chọn`;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }

      let html = `
        <li>
          <label class="flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F4EF] transition-colors cursor-pointer group select-none ${isAllChecked ? "bg-[#F5F4EF] font-bold text-primary" : ""}">
            <div class="flex items-center gap-2.5">
              <input
                type="checkbox"
                class="cat-checkbox-all rounded text-primary focus:ring-primary accent-[#264332] w-4 h-4 cursor-pointer"
                ${isAllChecked ? "checked" : ""}
              />
              <span class="text-xs font-semibold ${isAllChecked ? "text-primary font-bold" : "text-stone-700"} group-hover:text-primary">
                Tất cả sản phẩm
              </span>
            </div>
            <span class="text-[10px] font-bold ${isAllChecked ? "bg-[#264332] text-white px-2 py-0.5 rounded-full" : "text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full"}">
              ${catalog.products.length}
            </span>
          </label>
        </li>
      `;

      leafCategories.forEach((cat) => {
        const isChecked = selectedCategoryIds.includes(cat.id);
        html += `
          <li>
            <label class="flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F4EF] transition-colors cursor-pointer group select-none ${isChecked ? "bg-[#F5F4EF] font-bold text-primary" : ""}">
              <div class="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  class="cat-checkbox rounded text-primary focus:ring-primary accent-[#264332] w-4 h-4 cursor-pointer"
                  value="${cat.id}"
                  ${isChecked ? "checked" : ""}
                />
                <span class="text-xs font-semibold ${isChecked ? "text-primary font-bold" : "text-stone-700"} group-hover:text-primary">
                  ${escapeHtml(cat.name)}
                </span>
              </div>
              <span class="text-[10px] font-bold ${isChecked ? "bg-[#264332] text-white px-2 py-0.5 rounded-full" : "text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full"}">
                ${cat.realCount}
              </span>
            </label>
          </li>
        `;
      });

      categoryList.innerHTML = html;

      // Bind Checkbox Change Listeners
      categoryList.querySelectorAll(".cat-checkbox-all").forEach((input) => {
        input.addEventListener("change", (e) => {
          if (e.target.checked) {
            selectedCategoryIds = [];
            currentPage = 1;
            renderCategoryCheckboxes();
            draw();
          }
        });
      });

      categoryList.querySelectorAll(".cat-checkbox").forEach((input) => {
        input.addEventListener("change", (e) => {
          const val = e.target.value;
          if (e.target.checked) {
            if (!selectedCategoryIds.includes(val)) selectedCategoryIds.push(val);
          } else {
            selectedCategoryIds = selectedCategoryIds.filter((id) => id !== val);
          }
          currentPage = 1;
          renderCategoryCheckboxes();
          draw();
        });
      });
    }

    renderCategoryCheckboxes();

    if (search) {
      search.value = new URLSearchParams(location.search).get("q") || "";
      search.addEventListener("input", () => { query = search.value.trim().toLocaleLowerCase("vi"); currentPage = 1; draw(); });
    }
    if (sort) sort.addEventListener("change", () => { sortBy = sort.value; currentPage = 1; draw(); });

    function draw() {
      document.getElementById("catalog-pagination")?.remove();
      let items = catalog.products.map((item) => enrich(item, catalog));
      
      // Checkbox Category Multi-Filter
      if (selectedCategoryIds.length > 0) {
        items = items.filter((item) => selectedCategoryIds.some((catId) => isProductInCategory(item, catId, catalog)));
      }

      if (query) items = items.filter((item) => `${item.name} ${item.category?.pathLabel || ""}`.toLocaleLowerCase("vi").includes(query));

      // Select2 Price Filter
      if (selectedPrice === "under-100k") {
        items = items.filter((item) => (item.minPrice || 0) < 100000);
      } else if (selectedPrice === "100k-300k") {
        items = items.filter((item) => (item.minPrice || 0) >= 100000 && (item.minPrice || 0) <= 300000);
      } else if (selectedPrice === "300k-500k") {
        items = items.filter((item) => (item.minPrice || 0) >= 300000 && (item.minPrice || 0) <= 500000);
      } else if (selectedPrice === "over-500k") {
        items = items.filter((item) => (item.minPrice || 0) > 500000);
      }

      // Select2 Size Filter
      if (selectedSizes.length > 0) {
        items = items.filter((item) => {
          const nameLower = (item.name || "").toLowerCase();
          return selectedSizes.some((size) => {
            if (size === "mini") return nameLower.includes("mini") || nameLower.includes("5cm") || (item.minPrice || 0) < 50000;
            if (size === "small") return nameLower.includes("8cm") || nameLower.includes("nhỏ");
            if (size === "medium") return nameLower.includes("12cm") || nameLower.includes("vừa");
            if (size === "large") return nameLower.includes("15cm") || nameLower.includes("lớn");
            return true;
          });
        });
      }

      // Select2 Environment Filter
      if (selectedEnv === "indoor") {
        items = items.filter((item) => `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("trong nhà") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("bàn") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("lưỡi hổ") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("kim tiền"));
      } else if (selectedEnv === "outdoor") {
        items = items.filter((item) => `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("ngoài trời") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("sen đá") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("xương rồng") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("sân vườn"));
      } else if (selectedEnv === "easy") {
        items = items.filter((item) => `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("sen đá") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("lưỡi hổ") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("chậu"));
      }
      
      if (sortBy === "indoor") {
        items = items.filter((item) => `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("trong nhà") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("bàn") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("lưỡi hổ") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("kim tiền"));
      } else if (sortBy === "outdoor") {
        items = items.filter((item) => `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("ngoài trời") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("sen đá") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("xương rồng") || `${item.name} ${item.category?.name || ""}`.toLowerCase().includes("sân vườn"));
      } else if (sortBy === "price-asc") {
        items.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
      } else if (sortBy === "price-desc") {
        items.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
      }
      const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
      currentPage = Math.min(currentPage, pageCount);
      const start = (currentPage - 1) * pageSize;
      const shown = items.slice(start, start + pageSize);
      if (summary) summary.innerHTML = `Hiển thị <strong class="text-primary font-bold">${shown.length ? start + 1 : 0}–${start + shown.length}</strong> trên <strong class="text-primary font-bold">${items.length}</strong> sản phẩm`;
      grid.innerHTML = shown.length ? shown.map((item) => productCard(item)).join("") : `<p class="col-span-full text-center text-stone-500 py-12">Không tìm thấy sản phẩm phù hợp.</p>`;
      if (pageCount > 1) {
        const getPaginationItems = (current, total) => {
          if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
          const pages = [1];
          if (current > 3) pages.push("...");
          const start = Math.max(2, current - 1);
          const end = Math.min(total - 1, current + 1);
          for (let i = start; i <= end; i++) pages.push(i);
          if (current < total - 2) pages.push("...");
          pages.push(total);
          return pages;
        };

        const prevBtn = currentPage > 1
          ? `<button data-page="${currentPage - 1}" class="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 text-stone-700 font-bold hover:bg-stone-50 hover:border-primary transition-colors flex items-center justify-center shrink-0" title="Trang trước"><span class="material-symbols-outlined text-lg">arrow_back</span></button>`
          : "";

        const nextBtn = currentPage < pageCount
          ? `<button data-page="${currentPage + 1}" class="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 text-stone-700 font-bold hover:bg-stone-50 hover:border-primary transition-colors flex items-center justify-center shrink-0" title="Trang sau"><span class="material-symbols-outlined text-lg">arrow_forward</span></button>`
          : "";

        const pageButtons = getPaginationItems(currentPage, pageCount).map((item) => {
          if (item === "...") {
            return `<span class="w-10 h-10 flex items-center justify-center text-stone-400 font-bold select-none">...</span>`;
          }
          const isCurrent = item === currentPage;
          return `<button data-page="${item}" class="w-10 h-10 rounded-2xl text-xs font-bold transition-colors shrink-0 flex items-center justify-center ${isCurrent ? "bg-[#264332] text-white border border-[#264332]" : "bg-white border border-stone-200/80 text-stone-700 hover:bg-stone-50 hover:border-primary"}">${item}</button>`;
        }).join("");

        grid.insertAdjacentHTML("afterend", `<nav id="catalog-pagination" class="flex flex-wrap items-center justify-center gap-2 pt-8 w-full" aria-label="Phân trang sản phẩm">${prevBtn}${pageButtons}${nextBtn}</nav>`);
        document.querySelectorAll("#catalog-pagination [data-page]").forEach((button) => button.addEventListener("click", () => { currentPage = Number(button.dataset.page); draw(); window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" }); }));
      }
    }
    draw();
  }

  function flashSaleCard(product) {
    const minPrice = product.minPrice || 50000;
    const charCode = (product.id || "").charCodeAt((product.id || "").length - 1) || 5;
    const discountPercent = Math.min(40, Math.max(15, (charCode % 5 + 2) * 6));
    const originalPrice = Math.round((minPrice / (1 - discountPercent / 100)) / 1000) * 1000;
    const soldCount = Math.floor((charCode * 9) % 120 + 35);
    const progressPercent = Math.min(95, Math.max(40, Math.floor((soldCount / 180) * 100)));

    const image = product.image 
      ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.onerror=null; this.src='assets/image/logo.png';">` 
      : `<img src="assets/image/logo.png" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain p-4 bg-stone-100 opacity-60">`;

    return `<div class="w-52 sm:w-64 shrink-0 bg-[#F5F4EF] hover:bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 hover:border-[#264332]/40 transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div class="relative aspect-square rounded-xl overflow-hidden mb-3 bg-white">
          <span class="absolute top-2.5 left-2.5 z-10 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-${discountPercent}%</span>
          <a href="${productUrl(product.id)}" class="block w-full h-full">
            ${image}
          </a>
        </div>
        <a href="${productUrl(product.id)}">
          <h4 class="font-serif-title text-sm sm:text-base font-normal text-primary truncate group-hover:text-emerald-800 transition-colors">${escapeHtml(product.name)}</h4>
        </a>
        <p class="text-[11px] text-stone-500 mb-2">Đã bán ${soldCount} chậu</p>
      </div>

      <div>
        <div class="flex items-baseline gap-2">
          <span class="font-bold text-sm text-rose-600">${formatPrice(minPrice)}</span>
          <span class="text-xs text-stone-400 line-through">${formatPrice(originalPrice)}</span>
        </div>
        <div class="w-full bg-stone-200 h-2 rounded-full mt-2.5 overflow-hidden">
          <div class="bg-amber-500 h-full rounded-full" style="width: ${progressPercent}%;"></div>
        </div>
        <button data-quick-add-id="${escapeHtml(product.id)}" class="w-full mt-3 py-2.5 px-3 bg-[#264332] text-white hover:bg-[#1C3A27] active:scale-[0.98] transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">shopping_cart</span>
          <span>Thêm giỏ hàng ngay</span>
        </button>
      </div>
    </div>`;
  }

  function renderHome(catalog) {
    const flashSaleGrid = document.getElementById("home-flash-sale-grid");
    if (flashSaleGrid) {
      const realProductsWithImages = catalog.products.filter((p) => p.image && p.image.startsWith("assets/product/"));
      const flashItems = (realProductsWithImages.length >= 4 ? realProductsWithImages : catalog.products).slice(0, 8);
      flashSaleGrid.innerHTML = flashItems.map((item) => flashSaleCard(enrich(item, catalog))).join("");
    }

    const categoryGrid = document.getElementById("featured-category-grid");
    if (categoryGrid) {
      const leaves = catalog.categories.filter((item) => item.isLeaf).sort((a, b) => (catalog.productsByCategory.get(b.id)?.length || 0) - (catalog.productsByCategory.get(a.id)?.length || 0)).slice(0, 4);
      categoryGrid.innerHTML = leaves.map((category) => {
        const product = enrich(catalog.products.find((item) => item.categoryId === category.id), catalog);
        return `<a href="${listUrl(category.id)}" class="group relative rounded-[28px] overflow-hidden aspect-[3/4] bg-[#264332] flex flex-col justify-end p-6 transition-transform duration-500 hover:-translate-y-1">
          ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(category.name)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.remove()">` : ""}
          <div class="absolute inset-0 bg-gradient-to-t from-[#1C3A27]/90 via-[#1C3A27]/30 to-transparent"></div><div class="relative z-10 text-white space-y-2"><span class="text-xs uppercase tracking-widest">${catalog.productsByCategory.get(category.id)?.length || 0} sản phẩm</span><h3 class="font-serif-title text-2xl font-normal text-white">${escapeHtml(category.name)}</h3><span class="inline-flex text-xs text-white/80">Xem bộ sưu tập →</span></div>
        </a>`;
      }).join("");
    }

    const homeGrid = document.getElementById("home-new-product-grid");
    if (homeGrid) homeGrid.innerHTML = catalog.products.slice(0, 4).map((item) => productCard(enrich(item, catalog), true)).join("");

    const homeCatGrid = document.getElementById("home-category-product-grid");
    const pillContainer = document.getElementById("cate-pill-container");
    const moreCategoriesButton = document.getElementById("home-category-more");
    if (homeCatGrid) {
      const primaryCollections = [
        {
          id: "collection-sen-da",
          name: "Sen đá",
          icon: "filter_vintage",
          matches: (product) => /sen\s*đá/i.test(product.name || ""),
        },
        {
          id: "collection-xuong-rong",
          name: "Xương rồng",
          icon: "potted_plant",
          matches: (product) => /xương\s*rồng|cactus/i.test(product.name || ""),
        },
      ].map((collection) => ({
        ...collection,
        realCount: catalog.products.filter(collection.matches).length,
      }));

      let activeCategoryId = primaryCollections[0].id;
      let showingMoreCategories = false;
      const renderCatProducts = () => {
        const collection = primaryCollections.find((item) => item.id === activeCategoryId);
        const items = collection
          ? catalog.products.filter(collection.matches)
          : catalog.products.filter((p) => isProductInCategory(p, activeCategoryId, catalog));
        const shown = items.slice(0, 8).map((item) => productCard(enrich(item, catalog), true));
        homeCatGrid.innerHTML = shown.length 
          ? shown.join("") 
          : `<p class="col-span-full text-center text-stone-500 py-12">Không tìm thấy sản phẩm phù hợp trong danh mục này.</p>`;
      };

      if (pillContainer) {
        const categoriesWithCount = catalog.categories
          .map((cat) => ({
            ...cat,
            realCount: catalog.products.filter((p) => isProductInCategory(p, cat.id, catalog)).length,
          }))
          .filter((cat) => cat.realCount > 0)
          .sort((a, b) => b.realCount - a.realCount);

        const uniqueCategories = [];
        const seenNames = new Set();
        for (const cat of categoriesWithCount) {
          if (!seenNames.has(cat.name)) {
            seenNames.add(cat.name);
            uniqueCategories.push(cat);
          }
        }
        const topCategories = uniqueCategories.slice(0, 10);
        const getCategoryTab = (category, icon = "potted_plant") => {
          const isActive = category.id === activeCategoryId;
          return `
            <button data-category-id="${escapeHtml(category.id)}" class="cate-pill-tab w-full min-w-0 ${isActive ? "bg-[#264332] text-white active-pill" : "hover:bg-stone-100 text-stone-700"} px-4 py-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer">
              <div class="w-7 h-7 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"} flex items-center justify-center icon-box"><span class="material-symbols-outlined text-base">${icon}</span></div>
              <div>
                <span class="font-bold text-xs uppercase block leading-tight ${isActive ? "text-white" : "text-primary"}">${escapeHtml(category.name)}</span>
                <span class="text-[10px] ${isActive ? "text-white/80" : "text-stone-500"} font-normal">${category.realCount} sản phẩm</span>
              </div>
            </button>`;
        };

        const renderCategoryTabs = () => {
          const categoriesToShow = showingMoreCategories
            ? [{ id: "", name: "Tất cả", realCount: catalog.products.length }, ...topCategories]
            : primaryCollections;

          pillContainer.innerHTML = categoriesToShow
            .map((category) => getCategoryTab(category, category.icon || (category.id ? "potted_plant" : "eco")))
            .join("");

          pillContainer.querySelectorAll("[data-category-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
              activeCategoryId = btn.dataset.categoryId;
              renderCategoryTabs();
              renderCatProducts();
            });
          });
        };

        moreCategoriesButton?.addEventListener("click", () => {
          showingMoreCategories = !showingMoreCategories;
          activeCategoryId = showingMoreCategories ? "" : primaryCollections[0].id;
          moreCategoriesButton.setAttribute("aria-expanded", String(showingMoreCategories));
          moreCategoriesButton.innerHTML = showingMoreCategories
            ? `<span>Thu gọn danh mục</span><span class="group-hover:-translate-y-1 transition-transform">↑</span>`
            : `<span>Xem thêm danh mục</span><span class="group-hover:translate-x-1 transition-transform">→</span>`;
          renderCategoryTabs();
          renderCatProducts();
        });

        renderCategoryTabs();

        const prevBtn = document.getElementById("cate-prev-btn");
        const nextBtn = document.getElementById("cate-next-btn");
        if (prevBtn) {
          prevBtn.addEventListener("click", () => {
            pillContainer.scrollBy({ left: -280, behavior: "smooth" });
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            pillContainer.scrollBy({ left: 280, behavior: "smooth" });
          });
        }
      }
      renderCatProducts();
    }

    const allProductsLink = document.getElementById("home-all-products-link");
    if (allProductsLink) allProductsLink.href = "san-pham.html";
    const search = document.querySelector("[data-catalog-search]");
    if (search) search.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && search.value.trim()) location.href = `san-pham.html?q=${encodeURIComponent(search.value.trim())}`;
    });
  }

  function renderCategoryDropdown(catalog) {
    const container = document.querySelector("#dropdown-danh-muc .space-y-1");
    if (!container) return;
    const leaves = catalog.categories.filter((item) => item.isLeaf).sort((a, b) => (catalog.productsByCategory.get(b.id)?.length || 0) - (catalog.productsByCategory.get(a.id)?.length || 0)).slice(0, 8);
    container.innerHTML = leaves.map((category) => `<a href="${listUrl(category.id)}" class="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7EE] transition-colors group/item"><div class="flex items-center gap-4"><span class="material-symbols-outlined text-2xl text-[#244332]">potted_plant</span><span class="text-sm font-semibold text-stone-800">${escapeHtml(category.name)}</span></div><span class="text-xs text-stone-400 font-normal">${catalog.productsByCategory.get(category.id)?.length || 0} sp</span></a>`).join("");
  }

  function extractHashtagsAndCleanText(rawText = "") {
    if (!rawText) return { cleanText: "", hashtags: [] };
    const text = String(rawText)
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ");
    const hashtagRegex = /#([A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF\-]+)/g;
    const matches = [...text.matchAll(hashtagRegex)];
    const hashtags = Array.from(new Set(matches.map((m) => m[1].toLowerCase())));
    const cleanText = text
      .replace(hashtagRegex, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { cleanText, hashtags };
  }

  /*
   * Converts the seller's free-form Shopee description into readable blocks.
   * The original wording stays untouched; only the display structure changes.
   */
  function formatProductDescription(text = "") {
    const lines = String(text)
      .normalize("NFC")
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line, index, all) => line || (index > 0 && all[index - 1]));
    const blocks = [];
    let paragraph = [];
    let list = [];
    let listType = "bullet";

    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push(`<p class="leading-7 text-stone-600">${escapeHtml(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!list.length) return;
      const isOrdered = listType === "ordered";
      blocks.push(`<${isOrdered ? "ol" : "ul"} class="space-y-3 ${isOrdered ? "" : ""}">${list.map((item, index) => `<li class="flex gap-3 items-start"><span class="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#264332]/10 text-[#264332] inline-flex items-center justify-center text-[10px] font-bold">${isOrdered ? escapeHtml(item.marker || String(index + 1)) : '<span class="material-symbols-outlined text-sm">check</span>'}</span><span class="flex-1 leading-6 text-stone-600">${escapeHtml(item.text)}</span></li>`).join("")}</${isOrdered ? "ol" : "ul"}>`);
      list = [];
    };
    const flushContent = () => { flushParagraph(); flushList(); };
    const isDivider = (line) => /^[-–—_]{3,}$/.test(line);
    const getOrderedItem = (line) => line.match(/^(\d+)[.)]\s*(.+)$/);
    const getBulletItem = (line) => {
      const plainBullet = line.match(/^[-+•●▪◦]\s*(.+)$/);
      if (plainBullet) return plainBullet[1];
      const emojiBullet = line.match(/^\p{Extended_Pictographic}\s*(.+)$/u);
      return emojiBullet ? emojiBullet[1] : "";
    };
    const isHeading = (line) => {
      const letters = line.replace(/[^\p{L}]/gu, "");
      const upperCase = letters.length >= 4 && letters === letters.toLocaleUpperCase("vi-VN");
      return upperCase || (/^[^.!?]{3,72}:$/.test(line) && !getOrderedItem(line) && !getBulletItem(line));
    };

    for (const line of lines) {
      if (!line) { flushContent(); continue; }
      if (isDivider(line)) { flushContent(); continue; }

      const included = line.match(/^sản phẩm bao gồm\s*:\s*(.+)$/i);
      if (included) {
        flushContent();
        blocks.push(`<aside class="rounded-2xl border border-[#264332]/15 bg-[#F5F4EF] px-4 py-3.5 flex gap-3 items-start"><span class="material-symbols-outlined text-[#264332] mt-0.5">inventory_2</span><div><p class="text-xs font-bold uppercase tracking-wider text-[#264332]">Sản phẩm bao gồm</p><p class="mt-1 text-sm leading-6 text-stone-600">${escapeHtml(included[1])}</p></div></aside>`);
        continue;
      }

      const ordered = getOrderedItem(line);
      if (ordered) {
        flushParagraph();
        if (list.length && listType !== "ordered") flushList();
        listType = "ordered";
        list.push({ marker: ordered[1], text: ordered[2] });
        continue;
      }

      const bullet = getBulletItem(line);
      if (bullet) {
        flushParagraph();
        if (list.length && listType !== "bullet") flushList();
        listType = "bullet";
        list.push({ text: bullet });
        continue;
      }

      if (isHeading(line)) {
        flushContent();
        blocks.push(`<h3 class="font-serif-title text-lg sm:text-xl text-primary pt-2">${escapeHtml(line.replace(/:$/, ""))}</h3>`);
        continue;
      }

      if (list.length) flushList();
      paragraph.push(line);
    }
    flushContent();
    return blocks.join("");
  }

  function renderDetail(catalog) {
    const root = document.getElementById("product-detail-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const product = catalog.products.find((item) => item.id === id) || catalog.products[0];
    const data = enrich(product, catalog);
    let selected = data.variants[0];
    const categoryName = data.category?.name || "Sản phẩm";

    const rawDesc = data.description?.longDescription || "";
    const { cleanText: cleanLongDescription, hashtags } = extractHashtagsAndCleanText(rawDesc);
    const descriptionMarkup = formatProductDescription(cleanLongDescription);
    const hasShortDesc = Boolean(data.description?.shortDescription && data.description.shortDescription.trim() !== data.description.longDescription?.trim());
    const shortDescText = hasShortDesc 
      ? extractHashtagsAndCleanText(data.description.shortDescription).cleanText
      : "";

    const shortDescMarkup = shortDescText ? `<p class="text-sm text-stone-600 leading-relaxed">${escapeHtml(shortDescText)}</p>` : "";

    const hashtagPills = hashtags.length ? `
      <div class="pt-4 border-t border-stone-200/50">
        <div class="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          <span class="material-symbols-outlined text-sm text-[#264332]">tag</span>
          <span>Hashtags nổi bật</span>
        </div>
        <div class="flex flex-wrap gap-2">
          ${hashtags.map((tag) => `
            <a href="san-pham.html?q=${encodeURIComponent(tag)}" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F4EF] border border-stone-200/80 text-[#264332] hover:bg-[#264332] hover:text-white transition-all group">
              <span class="text-emerald-600 group-hover:text-amber-300 font-bold">#</span>
              <span>${escapeHtml(tag)}</span>
            </a>
          `).join("")}
        </div>
      </div>
    ` : "";

    const variantsMarkup = data.variants.map((variant, index) => {
      const label = Object.values(variant.selectedOptions || {}).join(" · ") || variant.sku || `Phiên bản ${index + 1}`;
      return `<button data-variant-id="${escapeHtml(variant.id)}" class="variant-choice bg-white border border-stone-200 hover:border-primary text-stone-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors">${escapeHtml(label)}</button>`;
    }).join("");
    const gallery = (data.media?.images || []).map((image) => `<button data-image-url="${escapeHtml(image.url)}" class="gallery-choice shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary"><img src="${escapeHtml(image.url)}" alt="Ảnh sản phẩm" class="w-full h-full object-cover" loading="lazy"></button>`).join("");
    const reviews = [
      ["Phan Đức Toàn", "5", "Sản phẩm rất đẹp, đóng gói cẩn thận. Shop phục vụ rất nhiệt tình!", "10/7/2026"],
      ["Lê Thị Thu", "4", "Cây tươi, ảnh đúng với mô tả. Mình sẽ tiếp tục ủng hộ shop.", "8/7/2026"],
      ["Nguyễn Văn Nam", "5", "Giao hàng nhanh, chất lượng đúng như mô tả.", "8/7/2026"],
    ];
    const reviewMarkup = reviews.map(([name, rating, text, date]) => `<article class="py-6 border-b border-stone-100 last:border-0"><div class="flex items-start gap-3"><span class="w-10 h-10 rounded-full bg-[#E8EEE9] text-primary flex items-center justify-center text-xs font-bold">${escapeHtml(name.split(" ").map((part) => part[0]).slice(-2).join(""))}</span><div class="flex-1"><div class="flex flex-wrap items-center gap-2"><h3 class="font-bold text-sm text-primary">${escapeHtml(name)}</h3><span class="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">✓ Đã mua tại Châu Châu</span><time class="ml-auto text-xs text-stone-400">${date}</time></div><p class="text-amber-400 tracking-widest mt-1">${"★".repeat(Number(rating))}<span class="text-stone-200">${"★".repeat(5 - Number(rating))}</span></p><p class="text-sm text-stone-600 mt-2">${escapeHtml(text)}</p><button class="text-xs text-stone-400 mt-3 hover:text-primary">♡ Hữu ích (0)</button></div></div></article>`).join("");

    // Filter related products in the same category
    const sameCatProducts = catalog.products.filter(
      (p) => p.id !== data.id && isProductInCategory(p, data.categoryId, catalog)
    );

    let relatedList = sameCatProducts;
    if (relatedList.length < 4) {
      const remaining = catalog.products.filter(
        (p) => p.id !== data.id && !relatedList.some((r) => r.id === p.id)
      );
      relatedList = [...relatedList, ...remaining];
    }

    const relatedMarkup = relatedList
      .slice(0, 4)
      .map((item) => productCard(enrich(item, catalog)))
      .join("");

    const relatedSection = `
      <section class="mt-12 bg-white rounded-3xl p-7 sm:p-8 border border-stone-200/80">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.15em] text-[#AE9077]">Gợi ý dành cho bạn</p>
            <h2 class="font-serif-title text-2xl sm:text-3xl text-[#264332] mt-1">Sản phẩm cùng danh mục (${escapeHtml(categoryName)})</h2>
          </div>
          <a href="san-pham.html?category=${encodeURIComponent(data.categoryId || "")}" class="text-xs font-bold text-[#264332] hover:text-[#AE9077] transition-colors flex items-center gap-1">
            <span>Xem tất cả ${escapeHtml(categoryName)}</span>
            <span>→</span>
          </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          ${relatedMarkup}
        </div>
      </section>
    `;

    root.innerHTML = `<div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8"><nav class="text-xs text-stone-500 flex gap-2 mb-6"><a href="index.html">Trang chủ</a><span>/</span><a href="san-pham.html">Sản phẩm</a><span>/</span><span class="text-primary">${escapeHtml(categoryName)}</span></nav><div class="grid grid-cols-1 lg:grid-cols-12 gap-10"><div class="lg:col-span-6 space-y-3"><div class="aspect-square bg-white rounded-3xl p-4 border border-stone-200 overflow-hidden"><img id="detail-image" src="${escapeHtml(data.image)}" alt="${escapeHtml(data.name)}" class="w-full h-full object-cover rounded-2xl" onerror="this.onerror=null; this.src='assets/image/logo.png';"></div><div id="detail-gallery" class="flex gap-3 overflow-x-auto pb-1">${gallery}</div></div><div class="lg:col-span-6 space-y-6"><div><span class="inline-flex text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">${data.variantCount} phiên bản</span><h1 class="font-serif-title text-3xl sm:text-4xl font-normal text-primary mt-3 mb-3">${escapeHtml(data.name)}</h1><p class="text-xs text-stone-500">Danh mục: ${escapeHtml(categoryName)}</p></div><div class="bg-[#F5F4EF] p-4 rounded-2xl"><span id="detail-price" class="text-3xl font-bold text-primary"></span></div>${shortDescMarkup}${hashtagPills}<div><p class="text-xs font-bold text-primary uppercase tracking-wider mb-3">Chọn phân loại</p><div class="flex flex-wrap gap-2" id="variant-choices">${variantsMarkup}</div></div><div class="flex flex-wrap items-center gap-3 pt-1"><div class="flex items-center border border-stone-300 rounded-xl overflow-hidden"><button data-quantity="-1" class="w-10 h-10 text-lg hover:bg-stone-50">−</button><span id="detail-quantity" class="w-10 text-center text-sm font-bold">1</span><button data-quantity="1" class="w-10 h-10 text-lg hover:bg-stone-50">+</button></div><button data-add-cart class="flex-1 min-w-40 border border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider">Thêm vào giỏ hàng</button><button data-buy-now class="flex-1 min-w-32 bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider">Mua ngay</button></div></div></div><section class="mt-16 bg-white rounded-3xl p-7 sm:p-8 border border-stone-200/80"><h2 class="font-serif-title text-2xl text-primary mb-5">Mô tả sản phẩm</h2><div class="space-y-5 text-sm">${descriptionMarkup || '<p class="leading-7 text-stone-600">Chưa có mô tả chi tiết.</p>'}</div>${hashtags.length ? `<div class="mt-8 pt-6 border-t border-stone-100"><div class="flex items-center gap-2 mb-3 text-xs font-bold text-stone-400 uppercase tracking-widest"><span class="material-symbols-outlined text-base text-primary">tag</span><span>Từ khóa liên quan (Hashtags)</span></div><div class="flex flex-wrap gap-2">${hashtags.map((tag) => `<a href="san-pham.html?q=${encodeURIComponent(tag)}" class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5F4EF] border border-stone-200/80 text-[#264332] hover:bg-[#264332] hover:text-[#264332] transition-all shadow-2xs group"><span class="text-emerald-600 font-black">#</span><span>${escapeHtml(tag)}</span></a>`).join("")}</div></div>` : ""}</section><section class="mt-10 bg-white rounded-3xl overflow-hidden border border-stone-200/80"><div class="p-7 sm:p-8 border-b border-stone-100"><p class="text-xs font-bold uppercase tracking-[.15em] text-secondary">Đánh giá & nhận xét</p><div class="grid grid-cols-1 md:grid-cols-[15rem_1fr] gap-8 items-center mt-5 rounded-2xl bg-[#F8F9F6] p-6"><div class="text-center md:border-r md:border-stone-200"><p class="text-5xl font-serif-title text-primary">4.7</p><p class="text-amber-400 text-xl tracking-widest mt-2">★★★★<span class="text-stone-200">★</span></p><p class="text-xs text-stone-500 mt-2">3 đánh giá & nhận xét</p></div><div class="space-y-2 text-xs">${[5,4,3,2,1].map((star, index) => `<div class="flex items-center gap-3"><span class="w-6">${star} ★</span><span class="h-2 flex-1 max-w-xs rounded-full bg-stone-200 overflow-hidden"><i class="block h-full bg-amber-400" style="width:${[70,30,0,0,0][index]}%"></i></span><span>${[70,30,0,0,0][index]}%</span></div>`).join("")}</div></div></div><div class="p-7 sm:p-8"><form id="review-form" class="rounded-2xl border border-dashed border-stone-300 bg-[#FAFBF8] p-5 mb-2"><h3 class="font-bold text-sm text-primary">Chia sẻ trải nghiệm của bạn</h3><div class="flex gap-1 text-amber-400 text-xl mt-2">★★★★★</div><textarea required placeholder="Viết đánh giá về sản phẩm..." class="w-full mt-3 h-24 rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-primary"></textarea><div class="flex flex-wrap justify-between items-center gap-3 mt-3"><label class="cursor-pointer border border-stone-200 bg-white px-3 py-2 rounded-xl text-xs font-semibold text-stone-600"><span class="material-symbols-outlined text-base align-middle">perm_media</span> Thêm ảnh / video<input id="review-media" type="file" accept="image/*,video/*" multiple class="hidden"></label><span id="review-upload-state" class="text-xs text-stone-400">Tối đa 5 ảnh hoặc video</span><button class="bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold">GỬI ĐÁNH GIÁ</button></div></form>${reviewMarkup}</div></section>${relatedSection}</div>`;
    const price = root.querySelector("#detail-price");
    const choices = root.querySelectorAll(".variant-choice");
    const galleryChoices = root.querySelectorAll(".gallery-choice");
    const showVariant = () => {
      price.textContent = formatPrice(selected?.commerce?.["Giá bán"]);
      const imageUrl = selected?.imageUrl || data.image;
      root.querySelector("#detail-image").src = imageUrl;
      choices.forEach((button) => {
        const isSelected = button.dataset.variantId === selected.id;
        button.setAttribute("aria-pressed", String(isSelected));
        button.style.setProperty("background-color", isSelected ? "#264332" : "#ffffff", "important");
        button.style.setProperty("color", isSelected ? "#ffffff" : "#374151", "important");
        button.style.setProperty("border-color", isSelected ? "#264332" : "#e7e5e4", "important");
        button.style.removeProperty("box-shadow");
      });
      galleryChoices.forEach((button) => button.classList.toggle("border-primary", button.dataset.imageUrl === imageUrl));
    };
    choices.forEach((button) => button.addEventListener("click", () => { selected = data.variants.find((item) => item.id === button.dataset.variantId); showVariant(); }));
    galleryChoices.forEach((button) => button.addEventListener("click", () => { root.querySelector("#detail-image").src = button.dataset.imageUrl; galleryChoices.forEach((item) => item.classList.toggle("border-primary", item === button)); }));
    let quantity = 1;
    root.querySelectorAll("[data-quantity]").forEach((button) => button.addEventListener("click", () => {
      quantity = Math.max(1, quantity + Number(button.dataset.quantity));
      root.querySelector("#detail-quantity").textContent = quantity;
    }));
    const addToCart = () => window.ShopCart?.add({
      productId: data.id,
      variantId: selected.id,
      name: data.name,
      imageUrl: selected.imageUrl || data.image,
      price: selected.commerce?.["Giá bán"] || 0,
      quantity,
      variantLabel: Object.values(selected.selectedOptions || {}).filter(Boolean).join(" · ") || selected.sku,
    });
    root.querySelector("[data-add-cart]")?.addEventListener("click", addToCart);
    root.querySelector("[data-buy-now]")?.addEventListener("click", () => { addToCart(); location.href = "thanh-toan.html"; });
    root.querySelector("#review-media")?.addEventListener("change", (event) => {
      const files = Array.from(event.target.files || []);
      root.querySelector("#review-upload-state").textContent = files.length ? `Đã chọn ${files.length} tệp` : "Tối đa 5 ảnh hoặc video";
    });
    root.querySelector("#review-form")?.addEventListener("submit", (event) => { event.preventDefault(); alert("Cảm ơn bạn! Đánh giá đã được ghi nhận để duyệt."); event.currentTarget.reset(); root.querySelector("#review-upload-state").textContent = "Tối đa 5 ảnh hoặc video"; });
    showVariant();
  }

  function initCustomSortDropdown() {
    const btn = document.getElementById("custom-sort-btn");
    const menu = document.getElementById("custom-sort-menu");
    const arrow = document.getElementById("custom-sort-arrow");
    const label = document.getElementById("custom-sort-label");
    const select = document.getElementById("catalog-sort");
    const options = document.querySelectorAll(".custom-sort-option");

    if (!btn || !menu) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = menu.classList.contains("hidden");
      if (isHidden) {
        menu.classList.remove("hidden");
        arrow?.classList.add("rotate-180");
      } else {
        menu.classList.add("hidden");
        arrow?.classList.remove("rotate-180");
      }
    });

    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add("hidden");
        arrow?.classList.remove("rotate-180");
      }
    });

    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        const val = opt.getAttribute("data-value");
        const textSpan = opt.querySelector("span");
        const text = textSpan ? textSpan.textContent.trim() : "";

        if (label && text) label.textContent = text;
        if (select) {
          select.value = val;
          select.dispatchEvent(new Event("change"));
        }

        options.forEach((o) => {
          o.classList.remove("bg-[#F5F4EF]", "text-[#264332]");
          o.classList.add("text-stone-700");
          const icon = o.querySelector(".check-icon");
          if (icon) icon.classList.add("opacity-0");
        });

        opt.classList.remove("text-stone-700");
        opt.classList.add("bg-[#F5F4EF]", "text-[#264332]");
        const activeIcon = opt.querySelector(".check-icon");
        if (activeIcon) activeIcon.classList.remove("opacity-0");

        menu.classList.add("hidden");
        arrow?.classList.remove("rotate-180");
      });
    });
  }

  function initCounterAnimations() {
    const counters = document.querySelectorAll(".counter-val[data-target]");
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute("data-target"), 10);
          const prefix = el.getAttribute("data-prefix") || "";
          const suffix = el.getAttribute("data-suffix") || "";
          const isLocale = el.getAttribute("data-format") === "locale";
          const duration = 1800; // 1.8 seconds animation
          let startTime = null;

          function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOut * target);

            const formattedVal = isLocale ? currentVal.toLocaleString("vi-VN") : currentVal;
            el.textContent = `${prefix}${formattedVal}${suffix}`;

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              const finalVal = isLocale ? target.toLocaleString("vi-VN") : target;
              el.textContent = `${prefix}${finalVal}${suffix}`;
            }
          }

          requestAnimationFrame(animate);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach((el) => observer.observe(el));
  }

  async function start() { 
    try {
      const catalog = await loadCatalog();
      window.__CURRENT_CATALOG__ = catalog;
      renderHome(catalog);
      renderListing(catalog);
      renderDetail(catalog);
      renderCategoryDropdown(catalog);
      initCustomSortDropdown();
      initCounterAnimations();
    } catch (error) {
      console.error(error);
      document.querySelectorAll("#catalog-product-grid, #home-new-product-grid").forEach((element) => { element.innerHTML = `<p class="col-span-full text-center text-stone-500 py-8">Không thể tải dữ liệu. Hãy mở website qua web server.</p>`; });
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quick-add-id]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const productId = btn.dataset.quickAddId;
    const catalog = window.__CURRENT_CATALOG__;
    if (!catalog) return;
    const rawProduct = catalog.products.find((p) => p.id === productId);
    if (!rawProduct) return;
    const product = enrich(rawProduct, catalog);
    const variants = product.variants || [];
    const firstVariant = variants[0];

    window.ShopCart?.add({
      productId: product.id,
      variantId: firstVariant?.id || `${product.id}-v1`,
      name: product.name,
      imageUrl: firstVariant?.imageUrl || product.image,
      price: firstVariant?.commerce?.["Giá bán"] || product.minPrice || 0,
      quantity: 1,
      variantLabel: firstVariant ? (Object.values(firstVariant.selectedOptions || {}).filter(Boolean).join(" · ") || firstVariant.sku || "Mặc định") : "Mặc định",
    });
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
