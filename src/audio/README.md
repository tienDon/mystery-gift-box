# Âm thanh kho báu

Bản hiện tại dùng nhạc nền **Once Upon a Time (loop)** của **TAD**, được nguồn OpenGameArt phát hành CC0. File MP3 được lưu tại `public/audio/treasure-theme.mp3`, nén 96 kbps, khoảng 693 KB và dài khoảng 58 giây. Nguồn và giấy phép được ghi trong `public/audio/CREDITS.md`.

Nhạc được tải và giải mã khi bật loa lần đầu, lặp bằng Web Audio. Giai điệu tổng hợp cũ được giữ làm dự phòng trong lúc tải hoặc khi tải lỗi. Các hiệu ứng vẫn là âm thanh gốc tạo bằng Web Audio; không thêm thư viện phụ. Hai đoạn báo đúng/sai được mở rộng thành giai điệu lên/xuống riêng; nhạc nền tự hạ trong khoảng 0,9–1,15 giây để nghe rõ kết quả.

- `TreasureAudio.js`: tải nhạc nền, vòng hợp âm dự phòng, hiệu ứng và mức âm lượng. `MUSIC_LEVELS` đặt mức nền 0,64 ở ngoài rương và 0,46 trong quiz. Các âm `shake`, `open`, `coins`, `tap`, `page`, `correct`, `review`, `reward`, `close` có thể được thay bằng file ghi âm sau này mà giữ nguyên tên sự kiện.
- `useTreasureAudio.js`: kết nối với React, nút bật/tắt, vòng đời trang và trạng thái cảnh.
- `App.jsx`: phát âm theo cảnh rương; âm đóng phát sau 500 ms để khớp nắp rương.
- `QuizCard.jsx`: chỉ thông báo thao tác chọn và kết quả xác nhận, không quản lý nguồn phát.

Mặc định tắt; chạm nút loa để bật. AudioContext chỉ được tạo khi bật âm thanh trong thao tác người dùng. Nhạc nhỏ hơn khi làm quiz, tắt dần khi đóng rương. Khi trang bị ẩn, các nguồn âm và bộ hẹn giờ nhạc bị dừng, context tạm ngưng; trở lại trang chỉ tiếp tục khi người dùng vẫn bật loa. Unmount giải phóng context. Không lưu lựa chọn loa qua lần tải trang.

Kiểm tra logic: `node --test src/audio/TreasureAudio.test.js`. Các kiểm tra dùng AudioContext giả; cần nghe thử trong Telegram Android/iOS để đánh giá chất âm, âm lượng và chính sách phát của WebView thực tế.
