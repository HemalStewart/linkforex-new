import { UPLOADS_BASE_URL } from "@/lib/api";

export type StoredAdminUser = {
  id?: string | number;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  branch?: string;
  profile_photo?: string;
  profile_photo_url?: string;
};

export const resolveProfilePhotoUrl = (
  value?: string | null,
  fallback?: string | null
): string | null => {
  const absolute = String(fallback || "").trim();
  if (absolute) return absolute;

  const relative = String(value || "").trim();
  if (!relative) return null;
  if (/^https?:\/\//i.test(relative)) return relative;

  const normalized = relative.replace(/^\/+/, "");
  return `${UPLOADS_BASE_URL}/${normalized}`;
};

export const persistStoredUser = (nextUser: StoredAdminUser): void => {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(nextUser);
  if (localStorage.getItem("user")) {
    localStorage.setItem("user", serialized);
  } else {
    sessionStorage.setItem("user", serialized);
  }

  window.dispatchEvent(new StorageEvent("storage", { key: "user", newValue: serialized }));
  window.dispatchEvent(new CustomEvent("admin-user-updated", { detail: nextUser }));
};
