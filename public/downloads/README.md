# Thư mục chứa file cài đặt ứng dụng Mobile

Đặt file APK vào đây với đúng tên **HomeService.apk** để nút "Tải ứng dụng Android" trên website hoạt động.

Tạo file APK từ repo HomeService-Mobile:

```bash
flutter build apk --release --dart-define=API_BASE_URL=http://<IP-may-chay-Backend>:8080/api
# File tạo ra: build/app/outputs/flutter-apk/app-release.apk
# Đổi tên thành HomeService.apk rồi chép vào thư mục này.
```

Muốn đặt file ở nơi khác (Google Drive, GitHub Release...) thì khai báo trong `.env`:

```
VITE_APK_URL=https://link-tai-file.apk
VITE_APK_VERSION=1.0.0
```
