# Frontend Context (ECommerce-Tech)

## 1. Tổng quan
- Frontend dùng **Next.js App Router** (thư mục `src/app`) + **React 19** + **TypeScript** + **Tailwind CSS v4**.
- Đây là giao diện cho hệ thống e-commerce đa vai trò: customer, vendor/shop manager, shipper, admin/manager.
- Header + Footer dùng chung toàn app trong `src/app/layout.tsx`.

## 2. Công nghệ & scripts chính
- Dependencies chính: `next@16`, `react@19`, `react-hot-toast`, `lucide-react`, `recharts`.
- Scripts trong `package.json`:
  - `npm run dev`: chạy local
  - `npm run build`: build production
  - `npm run start`: chạy production server

## 3. Cấu trúc thư mục
- `src/app`: pages theo App Router (route-based).
- `src/components`: UI và feature components:
  - `layout/` (Header, UserMenu, CartIcon, WishlistIcon, NotificationBell…)
  - `home/`, `products/`, `cart/`, `orders/`, `seller/`, `ui/`
- `src/hooks`: custom hooks (`useAddToCart`, `useWishlist`, `useAuth`, `useNotifications`).
- `src/lib`: helper/API layer (`api.ts`, `auth.ts`, `notificationApi.ts`, format helpers…).
- `src/types`: shared domain types.

## 4. Các route chính (high-level)
- Public/customer: `/`, `/products`, `/products/[id]`, `/cart`, `/checkout`, `/wishlist`, `/orders`, `/orders/[orderId]`, `/profile`.
- Auth: `/login`, `/register`.
- Seller/manager/shipper: `/seller`, `/seller/orders`, `/seller/analytics`, `/seller/forecast`, `/manager/orders`, `/shipper/orders`.
- Marketing/discovery: `/flash-sale`, `/best-sellers`, `/new-releases`, `/brands`, `/shops`, `/about`.

## 5. Cách frontend gọi backend
- `src/lib/api.ts` là API client trung tâm:
  - map service -> base URL qua `SERVICE_URLS` (user/shop/product/order/cart/recommendation…).
  - tự gắn `Authorization` và `userId` header từ `localStorage` (có thể tắt bằng options).
  - chuẩn hóa lỗi qua `ApiError`, `getUserFacingErrorMessage`.
  - wrappers: `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiPutText`.

## 6. Auth/session & đồng bộ state giữa component
- Auth đọc từ `localStorage` qua `src/lib/auth.ts` (`accessToken/token`, `userId`, `role`).
- Logout xóa localStorage và bắn custom events:
  - `authUpdated`
  - `wishlistUpdated`
- Nhiều component lắng nghe event để tự refresh state:
  - `UserMenu`, `NotificationBell`, `WishlistIcon`, `CartIcon`, các trang sản phẩm/cart/wishlist.
- Pattern hiện tại là event-driven trên `window` thay vì global state library.

## 7. Notification flow
- `src/lib/notificationApi.ts`: gọi API notification (`unread count`, `unread list`, `mark read`, `mark all`).
- `src/hooks/useNotifications.ts`: external store + polling (`15s`) + cache unread list (`8s`) + optimistic update.
- `NotificationBell` render badge/unread panel và điều hướng theo `referenceType`.

## 8. Lưu ý kỹ thuật
- `next.config.ts` đang dùng `images.domains` (đã deprecated, nên đổi sang `images.remotePatterns` khi có dịp).
- README hiện tại là template cũ, không phản ánh đầy đủ domain e-commerce hiện tại; file này dùng để thay thế bối cảnh thực tế.

