/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ADMIN_URL?: string;
  /** Link file APK (mặc định /downloads/HomeService.apk trong thư mục public) */
  readonly VITE_APK_URL?: string;
  readonly VITE_APK_VERSION?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
