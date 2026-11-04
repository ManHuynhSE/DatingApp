# Hướng dẫn chạy client Mewdy (DatingApp)

Tài liệu này hướng dẫn cài đặt và chạy **client** (ứng dụng mobile) của repo [`ManHuynhSE/DatingApp`](https://github.com/ManHuynhSE/DatingApp).

## 1. Tổng quan

| Hạng mục | Giá trị |
|---|---|
| Tên app | Mewdy (`slug: mewdy`) |
| Framework | Expo SDK 57 + React Native 0.86 + React 19 |
| Ngôn ngữ | TypeScript |
| Điều hướng | Expo Router (entry: `expo-router/entry`) |
| State | Zustand |
| Xác thực | Firebase Auth (`@react-native-firebase/*`) + Google Sign-In |
| Package manager | **pnpm** (repo có `pnpm-lock.yaml`) |
| Android package | `com.gooner.mewdy` |
| iOS bundle id | `com.gooner.mewdy` |

> **Quan trọng:** app dùng native module (`@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-google-signin/google-signin`, `expo-dev-client`) nên **không chạy được bằng Expo Go**. Bạn phải chạy bằng **Development Build**.

Client này cần một **backend API** chạy riêng (xem biến `EXPO_PUBLIC_*_API_URL` ở mục 4). Repo này chỉ chứa phần client.

## 2. Yêu cầu môi trường

Cài sẵn các công cụ sau:

- **Node.js 24.x** — `eas.json` của repo build bằng Node `24.12.0`, nên dùng cùng phiên bản để tránh lệch.
- **pnpm** — cài bằng `npm install -g pnpm` hoặc `corepack enable`.
- **Git**.
- **Android:**
  - Android Studio (kèm Android SDK, Platform Tools, một emulator hoặc điện thoại thật bật USB debugging).
  - JDK (bản đi kèm Android Studio là đủ).
  - Biến môi trường `ANDROID_HOME` trỏ tới thư mục Android SDK.
- **iOS (tuỳ chọn):** chỉ chạy được trên macOS với Xcode. Lưu ý: repo hiện chỉ có `google-services.json` (Android); `app.json` chưa khai báo file cấu hình Firebase cho iOS, nên cần bổ sung `GoogleService-Info.plist` nếu muốn chạy iOS.

## 3. Cài đặt

```bash
git clone https://github.com/ManHuynhSE/DatingApp.git
cd DatingApp
pnpm install
```

## 4. Cấu hình biến môi trường

Sao chép file mẫu và điền giá trị:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows (cmd)
copy .env.example .env
```

Các biến trong `.env` (tất cả có tiền tố `EXPO_PUBLIC_` nên sẽ được nhúng vào bundle — **không đặt secret thật vào đây**):

| Biến | Ý nghĩa |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL backend API chính |
| `EXPO_PUBLIC_DATING_API_URL` | URL API phần dating (match, discovery...) |
| `EXPO_PUBLIC_AUTH_API_URL` | URL API xác thực |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase config |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase config |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase config |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase config |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase config |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase config |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID |

Lấy giá trị Firebase ở **Firebase Console → Project settings → Your apps**, và Google client ID ở **Google Cloud Console → APIs & Services → Credentials** (hoặc Firebase Console → Authentication → Sign-in method → Google).

### Địa chỉ backend theo môi trường chạy

Vì `localhost` bên trong thiết bị chính là thiết bị đó, hãy chọn URL phù hợp (ví dụ backend chạy cổng `3000`):

| Môi trường | Giá trị ví dụ |
|---|---|
| Android Emulator | `http://10.0.2.2:3000` |
| Điện thoại thật cùng Wi-Fi | `http://<IP-LAN-máy-bạn>:3000` (ví dụ `http://192.168.1.10:3000`) |
| Điện thoại thật qua USB | chạy `adb reverse tcp:3000 tcp:3000` rồi dùng `http://localhost:3000` |

`app.json` đã bật `usesCleartextTraffic` cho Android nên gọi HTTP (không phải HTTPS) trong lúc dev là được.

> Sau khi sửa `.env`, hãy khởi động lại Metro với cache sạch (script `pnpm start` đã có cờ `-c`).

## 5. Cấu hình Firebase / Google Sign-In (Android)

Repo đã có sẵn `google-services.json` ở thư mục gốc và `app.json` tham chiếu tới nó cho package `com.gooner.mewdy`.

- **Dùng Firebase project của riêng bạn:** thay `google-services.json` bằng file tải từ Firebase Console (app Android phải đúng package name `com.gooner.mewdy`, hoặc bạn đổi package trong `app.json` cho khớp), đồng thời cập nhật các biến `EXPO_PUBLIC_FIREBASE_*` trong `.env`.
- **Đăng nhập Google:** phải thêm **SHA-1 (và SHA-256) của debug keystore** vào app Android trong Firebase Console, nếu không sẽ gặp lỗi `DEVELOPER_ERROR`. Lấy SHA-1 bằng:

  ```bash
  cd android && ./gradlew signingReport   # macOS/Linux (sau khi đã có thư mục android/)
  cd android; .\gradlew signingReport     # Windows PowerShell
  ```
- Bật phương thức **Google** trong Firebase Console → Authentication → Sign-in method.

## 6. Chạy ứng dụng

### Cách 1 — Build local (khuyến nghị khi dev)

Thư mục `android/` và `ios/` **không nằm trong repo**; chúng được Expo sinh tự động (Continuous Native Generation) từ `app.json` và các config plugin (kể cả `plugins/with-kotlin-gradle-plugin`). Không sửa tay các thư mục này.

```bash
# Android: bật emulator hoặc cắm điện thoại (adb devices phải thấy thiết bị)
pnpm android
```

Lần đầu lệnh này sẽ sinh thư mục `android/`, build bằng Gradle và cài app dev client lên thiết bị — mất vài phút. Các lần sau chỉ cần chạy Metro:

```bash
pnpm start
```

rồi mở app **Mewdy** (dev client) đã cài trên thiết bị để kết nối tới Metro.

```bash
# iOS (chỉ macOS)
pnpm ios
```

### Cách 2 — Build development bằng EAS (không cần Android Studio)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

Profile `development` trong `eas.json` tạo file **APK** (`developmentClient: true`, `distribution: internal`). Tải APK về cài lên điện thoại, sau đó chạy `pnpm start` để kết nối.

> `app.json` đang chứa `extra.eas.projectId` của tài khoản Expo gốc. Nếu bạn dùng tài khoản Expo khác, chạy `npx eas-cli@latest init` để tạo/liên kết project mới (và cập nhật `projectId`).

### Các script có sẵn

| Lệnh | Tác dụng |
|---|---|
| `pnpm start` | Chạy Metro dev server (`expo start -c --localhost`, xoá cache) |
| `pnpm android` | Build và chạy bản Android (`expo run:android`) |
| `pnpm ios` | Build và chạy bản iOS (`expo run:ios`) |
| `pnpm web` | Chạy bản web (`expo start --web`) — chưa kiểm chứng, vì app dùng module native Firebase/Google Sign-In nên có thể không hoạt động đầy đủ trên web |
| `pnpm lint` | Kiểm tra lint (`expo lint`) |

Kiểm tra kiểu và cấu hình dự án:

```bash
npx tsc --noEmit     # typecheck
npx expo-doctor      # chẩn đoán lỗi phụ thuộc/cấu hình
```

### Lưu ý về script `start`

Script `start` viết là `set NODE_OPTIONS=--dns-result-order=ipv4first && expo start -c --localhost`. Cú pháp `set VAR=...` này dành cho **Windows cmd**. Trên macOS/Linux lệnh vẫn chạy được nhưng biến `NODE_OPTIONS` không được áp dụng; nếu gặp lỗi phân giải DNS/IPv6, chạy thủ công:

```bash
NODE_OPTIONS=--dns-result-order=ipv4first npx expo start -c --localhost
```

Cờ `--localhost` khiến Metro chỉ lắng nghe trên localhost. Với điện thoại thật dùng USB, chạy `adb reverse tcp:8081 tcp:8081`; với Wi-Fi, bỏ cờ `--localhost` (`npx expo start -c`).

## 7. Cấu trúc thư mục chính

```
DatingApp/
├── app/            # Mã nguồn ứng dụng (Expo Router; xem ghi chú bên dưới)
├── src/            # Mã nguồn dùng chung (component, hook, util, ...)
├── theme/          # Theme, design tokens
├── assets/         # Ảnh, icon (mewdy_icon.png, favicon.png, ...)
├── plugins/        # Expo config plugin tuỳ chỉnh (with-kotlin-gradle-plugin)
├── App.tsx, index.ts
├── app.json        # Cấu hình Expo (permissions, plugins, package name)
├── eas.json        # Profile build EAS (development / preview / production)
├── firestore.rules # Quy tắc bảo mật Firestore
├── google-services.json  # Cấu hình Firebase cho Android
├── .env.example    # Mẫu biến môi trường
└── PLAN.md         # Kế hoạch triển khai dự án
```

> Ghi chú: nội dung chi tiết của `app/`, `src/` và `plugins/` chưa được kiểm tra trực tiếp (GitHub chặn truy cập tự động vào trang liệt kê thư mục), nên mô tả ở trên dựa trên tên thư mục và `package.json`/`app.json`. `AGENTS.md` của repo nói route nằm trong `src/app/`; hãy mở repo để xác nhận.

## 8. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| App báo thiếu native module (liên quan Firebase / Google Sign-In) khi mở bằng Expo Go | Không dùng Expo Go. Build dev client bằng `pnpm android` hoặc EAS (mục 6). |
| Sau khi thêm/đổi thư viện native, app crash hoặc không nhận | Build lại dev client: `pnpm android`. Nếu vẫn lỗi: `npx expo prebuild --clean` rồi `pnpm android`. |
| `Network request failed` / không gọi được API | Kiểm tra `EXPO_PUBLIC_*_API_URL` (mục 4), backend đang chạy, thiết bị cùng mạng. Emulator dùng `10.0.2.2`, không dùng `localhost`. |
| Google Sign-In báo `DEVELOPER_ERROR` | Chưa thêm SHA-1/SHA-256 của keystore vào Firebase, hoặc `GOOGLE_*_CLIENT_ID` sai (mục 5). |
| Thay đổi `.env` nhưng app không cập nhật | Dừng Metro và chạy lại `pnpm start` (đã xoá cache bằng `-c`); biến `EXPO_PUBLIC_*` được nhúng lúc bundle. |
| Gradle build lỗi Kotlin / phiên bản | App ép `kotlinVersion 2.3.20` qua `expo-build-properties` và plugin `with-kotlin-gradle-plugin`. Dùng JDK và Android SDK đủ mới, chạy lại `pnpm install` rồi `pnpm android`. |
| Thiết bị không thấy trong `adb devices` | Bật USB debugging, cắm lại cáp, hoặc khởi động emulator trước khi chạy `pnpm android`. |
| Cảnh báo phiên bản package không tương thích | `npx expo install --fix`, sau đó `npx expo-doctor`. |

## 9. Ghi chú khi phát triển

- Thêm thư viện bằng `npx expo install <package>` thay vì `pnpm add` để Expo chọn phiên bản tương thích với SDK.
- Chạy `pnpm lint` và `npx tsc --noEmit` trước khi commit.
- Không commit file `.env` chứa giá trị thật.
