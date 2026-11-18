import { apiFetch } from "@/lib/api";

export interface UploadResult {
  url: string;
  displayUrl: string;
  id: string | null;
}

export function uploadMenuImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch<UploadResult>("/uploads/menu-image", {
    method: "POST",
    formData,
  });
}

export function uploadProfileImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch<UploadResult>("/uploads/profile-image", {
    method: "POST",
    formData,
  });
}
