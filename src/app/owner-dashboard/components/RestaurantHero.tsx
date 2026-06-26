"use client";

import { useRef } from "react";
import { GlobeLock, Rocket, Trash2, Upload } from "lucide-react";
import { restaurantTypes } from "../constants";

type Restaurant = {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  type: string;
  rating: string | null;
  published: boolean | null;
  categories: { id: number; name: string }[];
};

type Category = { id: number; name: string };

type RestaurantEdit = {
  name: string;
  address: string;
  type: string;
  image: string;
  published: boolean;
  categories: number[];
};

type Props = {
  restaurant: Restaurant;
  restaurantEdit: RestaurantEdit;
  onEditChange: (edit: RestaurantEdit) => void;
  selectedImage: string;
  imagePreview: string;
  onImagePick: (file: File) => void;
  onGoLive: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  menuItemCount: number;
  busyAction: string | null;
  uploadProgress: { type: string | null; percent: number };
  allCategories: Category[];
  isGoLiveEnabled: boolean;
  hasPendingChanges: boolean;
};

export function RestaurantHero({
  restaurant,
  restaurantEdit,
  onEditChange,
  selectedImage,
  imagePreview,
  onImagePick,
  onGoLive,
  onUnpublish,
  onDelete,
  menuItemCount,
  busyAction,
  uploadProgress,
  allCategories,
  isGoLiveEnabled,
  hasPendingChanges,
}: Props) {
  const heroImage = imagePreview || selectedImage || restaurantEdit.image || restaurant.image || "";
  const typeLabel = restaurantTypes.find((t) => t.value === restaurantEdit.type)?.label ?? restaurantEdit.type;
  const isLive = restaurantEdit.published;
  const isGoingLive = busyAction === "go-live-restaurant";
  const isUploading = busyAction === "upload-restaurant-image";
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
      <div className="relative h-52 w-full overflow-hidden sm:h-60">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt={restaurant.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-orange-100 via-orange-50 to-white">
            <Upload className="h-8 w-8 text-orange-300" />
            <p className="text-sm font-medium text-orange-400">No cover photo yet</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />

        <div className="pointer-events-auto absolute bottom-4 right-4 z-20">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-black/45 px-3.5 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Upload className="h-4 w-4" />
            {isUploading
              ? `Uploading${uploadProgress.type === "restaurant" ? ` ${uploadProgress.percent}%` : "…"}`
              : heroImage ? "Change cover" : "Upload cover"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImagePick(f);
              e.target.value = "";
            }}
          />
          {uploadProgress.type === "restaurant" && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-orange-400 transition-all" style={{ width: `${uploadProgress.percent}%` }} />
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-6 pr-40 sm:pr-44">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">Restaurant</p>
          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{restaurant.name}</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-white/90">
            <span className="rounded-lg bg-white/15 px-3 py-1 font-medium backdrop-blur">{typeLabel}</span>
            <span className="rounded-lg bg-white/15 px-3 py-1 font-medium backdrop-blur">
              ⭐ {restaurant.rating ?? "4.5"}
            </span>
            <span
              className={`rounded-lg px-3 py-1 font-medium backdrop-blur ${
                isLive ? "bg-green-500/30 text-green-100" : "bg-amber-500/30 text-amber-100"
              }`}
            >
              {isLive ? "Live — visible to customers" : "Draft — hidden from customers"}
            </span>
            {menuItemCount > 0 && (
              <span className="rounded-lg bg-white/15 px-3 py-1 font-medium backdrop-blur">
                {menuItemCount} menu item{menuItemCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Edit details</p>
            <p className="mt-1 text-sm text-slate-500">Update how your restaurant appears to customers.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onGoLive}
              disabled={!isGoLiveEnabled || busyAction !== null}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isGoLiveEnabled
                  ? "bg-linear-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
                  : "border border-green-200 bg-green-50 text-green-700"
              }`}
            >
              <Rocket className="h-3.5 w-3.5" />
              {isGoingLive ? "Going live…" : isLive && !hasPendingChanges ? "Live" : "Go live"}
            </button>
            {isLive ? (
              <button
                type="button"
                onClick={onUnpublish}
                disabled={busyAction !== null}
                className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
              >
                <GlobeLock className="h-3.5 w-3.5" />
                {busyAction === "unpublish-restaurant" ? "Hiding…" : "Take offline"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onDelete}
              disabled={busyAction !== null}
              className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        {!isLive && (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-800/80">
            {hasPendingChanges
              ? "You have unsaved changes. Click Go live when you're ready to show customers your latest restaurant and menu."
              : menuItemCount > 0
                ? "Your restaurant is saved as a draft. Click Go live to make it visible on search and ordering."
                : "Add menu items below, then click Go live when you're ready. You can go live without menu items and add food later."}
          </p>
        )}

        {isLive && hasPendingChanges && (
          <p className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/70 px-5 py-4 text-sm text-orange-800/80">
            You have unsaved changes. Click Go live to update what customers see.
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Name</label>
            <input
              value={restaurantEdit.name}
              onChange={(e) => onEditChange({ ...restaurantEdit, name: e.target.value })}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Address</label>
            <input
              value={restaurantEdit.address}
              onChange={(e) => onEditChange({ ...restaurantEdit, address: e.target.value })}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">Restaurant type</label>
          <div className="flex flex-wrap gap-2.5">
            {restaurantTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onEditChange({ ...restaurantEdit, type: type.value })}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                  restaurantEdit.type === type.value
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"
                }`}
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: type.dot }} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">Visibility</label>
          <span
            className={`inline-flex rounded-2xl border px-4 py-2.5 text-sm font-semibold ${
              isLive ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-700"
            }`}
          >
            {isLive ? "Published — visible to customers" : "Draft — hidden from search"}
          </span>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">Cuisine categories</label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => {
              const selected = restaurantEdit.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? restaurantEdit.categories.filter((id) => id !== cat.id)
                      : [...restaurantEdit.categories, cat.id];
                    onEditChange({ ...restaurantEdit, categories: next });
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-500 hover:border-orange-200"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {restaurant.categories.length > 0 && restaurantEdit.categories.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">Currently linked: {restaurant.categories.map((c) => c.name).join(", ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
