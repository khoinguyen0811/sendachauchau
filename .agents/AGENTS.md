# AGENTS.md - Quy Tắc & Ràng Buộc Hoạt Động (Sen Đá Châu Châu)

## 1. Nguyên Tắc Sửa Lỗi Triệt Để (Root Cause Resolution)
- **Không sửa lỗi ngọn / vá tạm**: Nghiêm cấm mọi hình thức sửa lỗi bề nổi (superficial symptom patches), nuốt lỗi try/catch rỗng, hoặc trả về fallback giả khi chưa xử lý nguyên nhân gốc.
- **Tìm nguyên nhân gốc rễ**: Mọi phương án sửa code hoặc cấu hình bắt buộc phải dựa trên bằng chứng log/traceback cụ thể.
- **Tránh vòng lặp sửa lỗi vô nghĩa**: Không lặp lại cùng một câu lệnh lỗi nhiều lần mà không phân tích và giải quyết lý do tại sao lệnh thất bại.

## 2. Bằng Chứng Thực Nghiệm & Kiểm Thử Chi Tiết (Empirical Verification & Testing)
- **Nghiêm cấm báo cáo thành công suông**: Tuyệt đối không tuyên bố hoàn thành công việc hoặc đã sửa xong bug khi chưa chạy lệnh kiểm thử/build xác minh thực tế.
- **Cung cấp bằng chứng cụ thể**: Báo cáo gửi người dùng luôn phải đính kèm bằng chứng thực nghiệm rõ ràng (ví dụ: HTTP 200 OK, kết quả chạy script kiểm tra, hình ảnh/log xác nhận).
- **Kiểm thử kỹ lưỡng trước khi báo cáo**: Phải kiểm tra chi tiết trên cả giao diện di động (Mobile) và máy tính (Desktop) trước khi bàn giao kết quả.

## 3. Xác Nhận Yêu Cầu Khi Chưa Đủ Thông Tin (Clarification Protocol)
- **Không đoán mò logic hoặc đường dẫn**: Không tự ý suy đoán nếu chưa xem file nguồn hoặc nếu yêu cầu chưa đủ rõ ràng.
- **Dừng lại và hỏi người dùng**: Khi phát hiện điểm chưa hiểu, thiếu thông tin hoặc yêu cầu mâu thuẫn, phải dừng lại và đưa ra câu hỏi xác nhận rõ ràng với người dùng trước khi viết code.

## 4. Quy Trình Quản Lý Git & Đẩy Code (Git & Branching Workflow)
- **Không đẩy code khi chưa có yêu cầu rõ ràng**: Tuyệt đối KHÔNG chạy `git push` lên remote repository nếu người dùng chưa đưa ra yêu cầu đẩy code.
- **Quy trình đẩy code chuẩn khi được yêu cầu**:
  1. Kéo mã nguồn mới nhất về: `git pull origin main`
  2. Tạo một nhánh mới riêng biệt: `git checkout -b feature/<ten-tinh-nang>` hoặc `fix/<ten-bug>`
  3. Commit và đẩy code lên nhánh mới vừa tạo: `git push origin <ten-nhanh-moi>`

## 5. Ràng Buộc Đặc Biệt Khi Thao Tác Backend (matbaows-core-admin)
- **Kiến trúc hệ thống**: Đây là Laravel 12 Ecommerce Core (1 database độc lập). Tuyệt đối **KHÔNG** thêm multi-tenant, **KHÔNG** tự ý cài thêm React/Vue/Livewire nếu không có yêu cầu.
- **Storefront & Theme**: Nếu cắt HTML vào theme, giữ nguyên kiến trúc Laravel Blade component + Vanilla JS. Không dựng lại frontend bằng framework riêng. Không tự tạo page-builder kéo thả (sử dụng inline editing `contenteditable`).
- **Lưu trữ Media**: Lưu file ảnh với **đường dẫn tương đối** (relative path), KHÔNG lưu URL tuyệt đối (http...) vào Database.
- **Kiểm chứng nghiêm ngặt (Lệnh bắt buộc)**:
  - Khi sửa backend, bắt buộc phải chạy `php artisan test` và `php -l`.
  - **Tối kỵ**: Tuyệt đối không chạy lệnh `migrate:fresh`, `migrate:reset`, `db:wipe` trên database thật. Không để lộ `.env` secrets, access token ra console hay log.
- **Nguồn chân lý (Source of Truth)**: Code thực tế (Migration > Route > Service) có độ tin cậy cao hơn tài liệu. Phải đọc `matbaows-core-admin/AI_BUILD_PROMPT.md` chi tiết nếu làm task về Backend.
