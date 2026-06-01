# AI Limit Tracker

> Theo dõi giới hạn sử dụng các công cụ AI — nhận thông báo ngay khi limit được reset.

![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-Compatible-0078D4?style=flat-square&logo=microsoftedge&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Tổng quan

Nếu bạn dùng nhiều AI tool mỗi ngày (Claude, ChatGPT, Gemini, Cursor…), chắc bạn đã từng bị chặn giữa chừng vì rate limit rồi không biết bao giờ mới dùng lại được. **AI Limit Tracker** hiện ngay trên toolbar trình duyệt, đếm ngược thời gian reset của từng tool và gửi thông báo desktop ngay khi bạn có thể dùng lại.

---

## Tính năng

**🔔 Đếm ngược thời gian reset**  
Mỗi entry hiển thị countdown trực tiếp đến lúc limit reset. Khi đồng hồ về 0, trình duyệt tự động gửi thông báo.

**⚡ Thư viện preset sẵn có**  
11 preset cho các AI tool phổ biến, thời gian reset dựa theo chính sách rate limit được công bố của từng nền tảng:

| Tool | Nhà cung cấp | Thời gian reset |
|------|-------------|-----------------|
| Claude Pro | Anthropic | ~8 tiếng |
| Claude Opus | Anthropic | ~8 tiếng |
| ChatGPT Plus (GPT-4o) | OpenAI | 3 tiếng |
| ChatGPT o1/o3 | OpenAI | Hàng ngày |
| Gemini Advanced | Google | Hàng ngày |
| Perplexity Pro | Perplexity AI | ~4 tiếng |
| Grok Premium+ | xAI | 2 tiếng |
| Mistral Le Chat Pro | Mistral AI | Hàng ngày |
| GitHub Copilot Chat | GitHub / Microsoft | Hàng giờ |
| Cursor Pro | Cursor | Hàng tháng |
| Poe Subscriber | Quora | Hàng ngày |
| Custom Tool | — | Tùy chỉnh |

**🔗 Mở nhanh AI tool**  
Gắn URL vào mỗi entry. Click vào card để mở AI tool trong tab mới ngay lập tức. Chuột phải để chỉnh sửa.

**📋 Lịch sử URL theo preset**  
URL bạn đã nhập được ghi nhớ theo từng preset. Khi chỉnh sửa, dropdown hiện ra để chọn lại trong một click — có nút × để xóa các URL cũ.

**🖼️ Hỗ trợ tool tùy chỉnh**  
Thêm bất kỳ AI tool nào chưa có trong preset. Chọn emoji hoặc upload icon.

**📊 Theo dõi token đã dùng**  
Ghi lại lượng token tiêu thụ theo từng entry (hỗ trợ đơn vị tokens, K, M) để theo dõi song song với rate limit.

**💾 Export / Import**  
Sao lưu và khôi phục toàn bộ dữ liệu dưới dạng file ZIP gồm CSV và `preset_urls.json`. Tiện để đồng bộ giữa các máy.

**🟢 Badge trực tiếp**  
Icon trên toolbar hiển thị số tool đang available — nhìn là biết, không cần mở popup.

---

## Cài đặt

Extension này chưa có trên Chrome Web Store. Cài thủ công theo chế độ developer:

1. Tải ZIP mới nhất từ [Releases](../../releases) và giải nén
2. Mở `chrome://extensions` (hoặc `edge://extensions` nếu dùng Edge)
3. Bật **Developer mode** (góc trên bên phải)
4. Nhấn **Load unpacked** → chọn thư mục `ai-limit-tracker`
5. Icon extension xuất hiện trên toolbar

---

## Cách dùng

1. Click icon trên toolbar để mở tracker
2. Nhấn **＋ New** để thêm AI tool — chọn preset hoặc tạo tool tùy chỉnh
3. Khi bị rate limit, mở tracker và nhấn vào entry → **Set Limited**
4. Countdown bắt đầu. Bạn sẽ nhận thông báo khi limit được reset
5. Click vào card bất kỳ để mở AI tool đó trong tab mới

---

## Hỗ trợ trình duyệt

| Trình duyệt | Hỗ trợ |
|-------------|--------|
| Chrome | ✅ Đầy đủ |
| Microsoft Edge | ✅ Đầy đủ |
| Brave / Opera / Vivaldi | ✅ Đầy đủ (nền tảng Chromium) |
| Firefox | ❌ Chưa hỗ trợ |
| Safari | ❌ Chưa hỗ trợ |

---

## Công nghệ sử dụng

- **Vanilla JS** — không framework, không build step
- **Chrome Extension Manifest V3** — service worker, alarms API, storage API
- **JSZip** — export/import ZIP phía client

---

## Giấy phép

MIT
