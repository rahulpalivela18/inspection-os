import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isAdminRole(role?: string) {
  return role === "admin" || role === "super_admin";
}

// Initials for avatars — falls back from name → email → "?".
export function getInitials(name?: string, email?: string) {
  const source = (name?.trim() || email?.trim() || "?").charAt(0);
  return source.toUpperCase();
}

export function ensureJpeg(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () =>
      reject(new Error("Failed to load image for PDF export"));
    img.src =
      src.startsWith("http") && !src.startsWith(location.origin)
        ? `/api/image-proxy?url=${encodeURIComponent(src)}`
        : src;
  });
}
