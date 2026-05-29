"use client";

import { useState, useRef, useEffect } from "react";
import { uploadLeadPhoto } from "@/lib/storage";
import { Trash2, Upload } from "lucide-react";

interface JobPhoto {
  id: string;
  url: string;
  photoType: string;
}

const CATEGORIES = [
  { key: "before",   label: "Before",   color: "text-blue-600   bg-blue-50   border-blue-200" },
  { key: "progress", label: "Progress", color: "text-amber-600  bg-amber-50  border-amber-200" },
  { key: "after",    label: "After",    color: "text-green-600  bg-green-50  border-green-200" },
] as const;

type Category = typeof CATEGORIES[number]["key"];

const JOB_PHOTO_TYPES = ["before", "progress", "after"];
const PER_CATEGORY_LIMIT = 10;

export default function JobPhotosSection({ leadId }: { leadId: string }) {
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [uploading, setUploading] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRefs = useRef<Record<Category, HTMLInputElement | null>>({
    before: null, progress: null, after: null,
  });

  useEffect(() => {
    fetch(`/api/leads/${leadId}/photos`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.photos) {
          setPhotos(data.photos.filter((p: JobPhoto) => JOB_PHOTO_TYPES.includes(p.photoType)));
        }
      })
      .catch(() => {});
  }, [leadId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, category: Category) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const currentCount = photos.filter((p) => p.photoType === category).length;
    const slots = PER_CATEGORY_LIMIT - currentCount;
    if (slots <= 0) return;

    const toUpload = files.slice(0, slots);
    setUploading(category);

    for (const file of toUpload) {
      try {
        const url = await uploadLeadPhoto(file, leadId);
        const res = await fetch(`/api/leads/${leadId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: url, photoType: category }),
        });
        if (res.ok) {
          const photo = await res.json();
          setPhotos((prev) => [...prev, photo]);
        }
      } catch {
        // silent — individual photo failure shouldn't block others
      }
    }

    setUploading(null);
    if (inputRefs.current[category]) inputRefs.current[category]!.value = "";
  }

  async function handleDelete(photoId: string) {
    setDeleting(photoId);
    await fetch(`/api/leads/${leadId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDeleting(null);
  }

  const hasAny = photos.length > 0;

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] px-5 py-5 space-y-5">
      <p className="text-[.9rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>
        Job Photos
        {hasAny && (
          <span className="ml-2 text-slate-400 font-normal text-sm">({photos.length})</span>
        )}
      </p>

      {CATEGORIES.map(({ key, label, color }) => {
        const categoryPhotos = photos.filter((p) => p.photoType === key);
        const isUploading = uploading === key;
        const atLimit = categoryPhotos.length >= PER_CATEGORY_LIMIT;

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>
                  {label}
                </span>
                <span className={`text-xs tabular-nums ${atLimit ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                  {categoryPhotos.length}/{PER_CATEGORY_LIMIT}
                </span>
              </div>
              <button
                onClick={() => inputRefs.current[key]?.click()}
                disabled={isUploading || atLimit}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-3 h-3" />
                {isUploading ? "Uploading..." : atLimit ? "Limit reached" : "Upload"}
              </button>
              <input
                ref={(el) => { inputRefs.current[key] = el; }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e, key)}
              />
            </div>

            {categoryPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {categoryPhotos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[#E2E8F0]">
                    <a href={photo.url} target="_blank" rel="noopener noreferrer">
                      <img src={photo.url} alt={label} className="w-full h-full object-cover" />
                    </a>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deleting === photo.id}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => !atLimit && inputRefs.current[key]?.click()}
                className="border border-dashed border-gray-200 rounded-xl py-5 text-center text-xs text-gray-300 hover:border-gray-400 hover:text-gray-400 cursor-pointer transition-colors"
              >
                No {label.toLowerCase()} photos yet
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
