# STATUS — laptop24h (app cũ / patch-based)
> Cập nhật lần cuối: 2026-04-16

## Mục đích file này
Khi bắt đầu phiên làm việc mới, AI đọc file này để biết chính xác trạng thái hiện tại mà không cần đọc lại toàn bộ lịch sử conversation.

---

## Cấu trúc repo hiện tại

```
laptop24h/
├── index.html        ← app chính, load patch.js?v=37
├── patch.js          ← 1098 dòng, chứa tất cả fix/feature bổ sung
└── STATUS.md         ← file này
```

---

## Phiên bản hiện tại

| File | Trạng thái |
|------|-----------|
| index.html | patch.js?v=**37** |
| patch.js | **1098 dòng**, commit: 5fd8f67 |

---

## Các block trong patch.js (theo thứ tự)

| Block | Mô tả | Trạng thái |
|-------|-------|-----------|
| Main IIFE (v1–v11) | Pagination, giao máy, payment type, ban kèm, auto da giao, nội dung bill | ✅ OK |
| **v32** | Discount row trên bill in (printRepairBill wrap) + bill giao máy | ✅ OK |
| **v33** | Fix SC ID collision — saveRepair coord + DB.s restore (thay v31) | ✅ OK |
| **v34** | Mở khóa #rm-capital (vốn linh kiện) cho nhân viên (non-admin) | ✅ OK |
| **v35** | Wire dv-discount vào calcDelivery + printDeliverBill — CÒN LẠI = tổng - cọc - giảm giá | ✅ OK |

---

## Firebase DB structure

```
repairs[]   → 2425 records
  fields: accessories, address, capital, cost, customerName, deliveredDate,
          deposit, device, id, issue, note, password, phone, receivedDate,
          serial, status, techName, ts, warrantyMonths

sales[]     → 9 records
  fields: billNo, change, customer, date, extraDiscount, items, note,
          paid, paymethod, phone, subtotal, total, ts, warranty

products[]  → 88 records
  fields: cost, id, name, note, price, stock, type, unit, warranty

customers[] → 6 records
debts[]     → 0 records
users[]     → (managed via Firebase Auth / DB)
```

---

## Tính năng đã có (app cũ)

- [x] Bán hàng — tạo đơn, chọn SP, tính tiền, in bill
- [x] Sửa chữa — nhận máy, phiếu SC, giao máy + bill, in
- [x] Khách hàng — CRUD
- [x] Công nợ — CRUD
- [x] Sản phẩm/Kho — CRUD (chưa có danh mục)
- [x] Lịch sử — xem lại giao dịch
- [x] Thống kê — doanh thu (chưa có lợi nhuận bán hàng)
- [x] Người dùng — CRUD, phân quyền admin/staff
- [x] Cài đặt bill
- [x] Giảm giá bill giao máy (v32 + v35)
- [x] SC ID collision fix (v33)
- [x] Vốn linh kiện hiện cho nhân viên (v34)

## Tính năng chưa làm (backlog)

- [ ] Thống kê: lợi nhuận bán hàng (doanh thu - vốn)
- [ ] Kho: danh mục (Laptop / Linh kiện / Phụ kiện + thêm mới)

---

## Quy tắc khi tiếp tục sửa app cũ

1. **Mỗi tính năng mới = 1 block IIFE mới** đặt ở cuối patch.js
2. **Đặt tên block**: `window._vXX...` (XX = số tiếp theo sau 35)
3. **Sau khi commit patch.js** → bump version trong index.html (v=37 → v=38, v.v.)
4. **Không xóa/sửa block cũ** — chỉ thêm mới hoặc wrap
5. Dùng `typeof funcName === 'function'` + setInterval 200ms để wrap hàm app gốc

## Cách tiếp tục đúng khi bắt đầu phiên mới

1. AI đọc file này
2. AI kiểm tra commit mới nhất trên GitHub
3. AI xác nhận version hiện tại trong index.html
4. Tiếp tục từ đúng chỗ đã dừng

---

## App mới đang được xây dựng

Repo riêng: **laptop24h-v2** (modular ES modules)
Trạng thái: Chưa bắt đầu (sẽ bắt đầu phiên tiếp theo)
App cũ vẫn chạy song song tại: https://nguyenlaptop24h.github.io/laptop24h/
