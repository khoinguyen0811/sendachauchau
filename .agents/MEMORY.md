# MEMORY.md - Nhật Ký & Ghi Nhớ Dự Án Sen Đá Châu Châu

## 1. Tổng Quan Dự Án
- **Tên website**: Sen đá Châu Châu (Tên cũ: Sen Đá Succulent Garden).
- **Lĩnh vực**: Thương mại điện tử bán lẻ Sen đá, Xương rồng, Cây cảnh để bàn, Phụ kiện tiểu cảnh tại TP.HCM.
- **Công nghệ**: HTML5 (Semantic), Vanilla CSS / TailwindCSS (CDN), JavaScript (ES6+ Modular), Google Fonts (MuseoModerno, Cormorant Garamond, Plus Jakarta Sans), Material Symbols / Flaticon Icons.
- **Cấu trúc Dữ liệu**:
  - `data/products.json`: Danh sách 1,115 sản phẩm.
  - `data/product-media.json`: 230 bản ghi media hình ảnh.
  - `data/product-variants.json`: 1,115 bản ghi biến thể.
  - `data/categories.json`, `data/category-products.json`.
- **Hệ thống Backend Core (matbaows-core-admin)**: Project cũng chứa một core Backend viết bằng Laravel 12 tích hợp sẵn tại `matbaows-core-admin`. Chứa REST API, Admin UI, xử lý thanh toán, giỏ hàng, và phân quyền.
- **Tài nguyên Hình ảnh**: 724 hình ảnh sản phẩm đã được tải về cục bộ và lưu trữ tại `assets/product/`. Không sử dụng link ảnh từ Shopee CDN (`cf.shopee.vn`).

---

## 2. Lịch Sử Các Thay Đổi & Việc Đã Làm
1. **Thiết Kế Thương Hiệu & Logo**:
   - Đã thay logo chính thức Sen đá Châu Châu trên tất cả các trang (`index.html`, `san-pham.html`, `chi-tiet-san-pham.html`, `gioi-thieu.html`, `tin-tuc.html`, `lien-he.html`, `gio-hang.html`, `thanh-toan.html`).
   - Đã đổi tiêu đề web và copyright footer thành **Sen đá Châu Châu**.
2. **Nội Bộ Hóa 100% Hình Ảnh Sản Phẩm (Phase 1 & Phase 2)**:
   - Phase 1: Tải toàn bộ 724 ảnh sản phẩm độc đáo từ Shopee CDN về `assets/product/`.
   - Phase 2: Chuyển đổi 100% đường dẫn trong `products.json`, `product-media.json`, `product-variants.json` sang `assets/product/<id>.jpg`.
3. **Loại Bỏ Thông Tin Shopee**:
   - Đã xóa nút "Xem nguồn trên Shopee" và "Mã Shopee" trong trang `chi-tiet-san-pham.html`.
4. **Tối Ưu Responsive Mobile & Viewport Overflow**:
   - Đêm lại thuộc tính `overflow-x: hidden; max-width: 100vw;` trên `html, body` ở tất cả các file HTML để ngăn chặn tuyệt đối lỗi tràn lề khoảng trắng bên phải trên di động.
   - Thiết kế lại Sub-Navbar Header thành 2 tầng/co dãn linh hoạt (`flex-col lg:flex-row`). Nút "DANH MỤC SẢN PHẨM" chiếm full-width trên di động, các link điều hướng cuộn ngang mượt mà (`no-scrollbar`).
   - Thêm thanh **Mobile Bottom Navigation Bar** cố định phía dưới màn hình di động (`md:hidden`) hỗ trợ 5 icon điều hướng nhanh.
5. **Loại Bỏ Hiệu Ứng Bóng Đổ (Box-Shadow Removal)**:
   - Đã xóa toàn bộ bóng đổ quá đậm (`shadow-2xl`, `shadow-xl`, `shadow-lg`, `shadow-md`, `shadow-sm`, `shadow-xs`, `shadow-2xs`) trên tất cả các trang HTML và JS, chuyển sang giao diện phẳng tinh tế với đường viền nhẹ (`border border-stone-200/80`).
6. **Cập Nhật Giao Diện Sản Phẩm & Bộ Sưu Tập**:
   - Thêm nút "Thêm giỏ hàng ngay" vào card sản phẩm.
   - Thêm trình định dạng bài viết/mô tả chi tiết sản phẩm (`formatProductDescription`).
   - Phân chia bộ sưu tập Sen đá & Xương rồng nổi bật trên trang chủ.

---

## 3. Trạng Thái Hiện Tại & Công Việc Cần Làm Tiếp Theo
- **Local Web Server**: Đang chạy ổn định trên cổng 8000 (`http://localhost:8000`).
- **Mã Nguồn Git Remote**: Đã đồng bộ với branch `main` của repository `https://github.com/khoinguyen0811/sendachauchau.git`.
- **Nhiệm vụ cần tuân thủ**:
  - Đọc `MEMORY.md` và `AGENTS.md` trong thư mục `.agents/` trước khi thực hiện bất kỳ thao tác nào.
  - Cập nhật nhật ký công việc vào `.agents/MEMORY.md` sau mỗi lần thực hiện.
