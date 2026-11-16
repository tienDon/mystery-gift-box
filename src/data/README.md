# Dữ liệu câu hỏi

`questions.json` chứa bộ 10 câu ở trạng thái `draft`. Đáp án được giữ theo dấu ✅ trong nội dung cung cấp, chưa được xác minh. Giao diện đọc trực tiếp từ file này; sửa dữ liệu rồi lưu để cập nhật bản chạy bằng Vite.

## Cấu trúc mỗi câu

- `id`: mã duy nhất, giữ ổn định khi sửa hoặc đổi vị trí câu.
- `type`: `single` (chọn một) hoặc `multiple` (chọn nhiều).
- `topic`: tên chủ đề ngắn.
- `prompt`: câu hỏi, không cần ghi số thứ tự.
- `options`: các đáp án có `id` riêng và nội dung `text`.
- `correctOptionIds`: danh sách mã đáp án đúng. Câu `single` có đúng một mã; câu `multiple` có thể có nhiều mã. Dùng mã thay vì vị trí để đổi thứ tự đáp án mà không làm sai kết quả.
- `explanation`: giải thích sau khi xác nhận; để chuỗi rỗng khi chưa viết.
- `references`: danh sách nguồn tham khảo; để `[]` khi chưa có. Mỗi nguồn có thể dùng `{ "label": "Tên nguồn", "url": null }`.
- `image`: `null` khi không có ảnh; khi bổ sung dùng cấu trúc dưới đây.

```json
{
  "src": "/images/quiz/q01.webp",
  "alt": "Mô tả nội dung ảnh",
  "caption": "Chú thích ảnh (có thể để trống)"
}
```

Đặt ảnh trong `public/images/quiz/`. Đường dẫn trong JSON bắt đầu từ `/images/quiz/`, không có phần `public`.

## Quy ước giao diện dự kiến

Người chơi chọn hoặc đổi đáp án trước khi bấm **Xác nhận đáp án**. Khi xác nhận, khóa lựa chọn và hiện phản hồi; cùng nút đó đổi thành **Câu tiếp theo**, hoặc **Nhận món quà** ở câu cuối. Câu chọn nhiều chỉ đúng hoàn toàn khi tập lựa chọn trùng với `correctOptionIds`.

Thêm câu mới bằng cách sao chép một câu, đặt `id` mới và sửa dữ liệu. Tổng số câu sẽ được lấy từ độ dài `questions`, không cần lưu thêm số tổng.

## Kiến trúc giao diện

- `App.jsx`: quản lý cảnh mở/đóng rương, vị trí câu hiện tại và chuyển sang lời chúc.
- `components/quiz/QuizCard.jsx`: hiển thị một câu; giữ lựa chọn và trạng thái xác nhận. Component được tạo lại theo `id` câu để xóa lựa chọn cũ và trả vùng nội dung về đầu.
- `components/quiz/quizLogic.js`: thao tác chọn một/chọn nhiều và so sánh tập đáp án, không phụ thuộc giao diện.
- `components/quiz/QuizCard.css`: style riêng cho quiz, bao gồm vùng nội dung cuộn và footer có chiều cao ổn định.

Ảnh được hiển thị khi `image.src` có giá trị. Giải thích và nguồn tham khảo chỉ xuất hiện sau khi xác nhận, dưới mục **Xem giải thích**; các trường trống không tạo nội dung giả. Chưa lưu tiến trình hoặc kết quả lên máy chủ.
