"use client";

import Image from "next/image";
import { Globe, GlobeLock, PencilLine, Rocket, Trash2, Upload } from "lucide-react";
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
  onImagePick: (file: File) => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  menuItemCount: number;
  busyAction: string | null;
  uploadProgress: { type: string | null; percent: number };
  allCategories: Category[];
};

export function RestaurantHero({
  restaurant,
  restaurantEdit,
  onEditChange,
  selectedImage,
  onImagePick,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
  menuItemCount,
  busyAction,
  uploadProgress,
  allCategories,
}: Props) {
  const heroImage = selectedImage || restaurantEdit.image || restaurant.image;
  const typeLabel = restaurantTypes.find((t) => t.value === restaurantEdit.type)?.label ?? restaurantEdit.type;
  const isLive = restaurantEdit.published;
  const isPublishing = busyAction === "publish-restaurant";
  const isUnpublishing = busyAction === "unpublish-restaurant";

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
      <div className="relative h-48 w-full overflow-hidden sm:h-56">
        {heroImage ? (
          <Image src={heroImage} alt={restaurant.name} fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-orange-100 via-orange-50 to-white" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

        {!isLive && (
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <button
              type="button"
              onClick={onPublish}
              disabled={busyAction !== null}
              className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Rocket className="h-4 w-4" />
              {isPublishing ? "Publishing…" : "Publish restaurant"}
            </button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6">
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
            {!isLive ? (
              <button
                type="button"
                onClick={onPublish}
                disabled={busyAction !== null}
                className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                <Rocket className="h-3.5 w-3.5" />
                {isPublishing ? "Publishing…" : "Publish"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onUnpublish}
                disabled={busyAction !== null}
                className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
              >
                <GlobeLock className="h-3.5 w-3.5" />
                {isUnpublishing ? "Hiding…" : "Unpublish"}
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={busyAction !== null}
              className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <PencilLine className="h-3.5 w-3.5" />
              {busyAction === "update-restaurant" ? "Saving…" : "Save changes"}
            </button>
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
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-900">Ready to go live?</p>
              <p className="mt-0.5 text-sm text-amber-800/80">
                {menuItemCount > 0
                  ? `Publishing will make your restaurant and ${menuItemCount} menu item${menuItemCount === 1 ? "" : "s"} visible to customers on search and ordering.`
                  : "Add menu items below first, then publish when you're ready. You can still publish now and add food later."}
              </p>
            </div>
            <button
              type="button"
              onClick={onPublish}
              disabled={busyAction !== null}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <Globe className="h-4 w-4" />
              {isPublishing ? "Publishing…" : "Publish now"}
            </button>
          </div>
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
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold ${
                isLive ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-700"
              }`}
            >
              {isLive ? "Published — visible to customers" : "Draft — hidden from search"}
            </span>
            {!isLive ? (
              <button
                type="button"
                onClick={onPublish}
                disabled={busyAction !== null}
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                <Rocket className="h-3.5 w-3.5" />
                {isPublishing ? "Publishing…" : "Make live"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onUnpublish}
                disabled={busyAction !== null}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
              >
                <GlobeLock className="h-3.5 w-3.5" />
                {isUnpublishing ? "Hiding…" : "Take offline"}
              </button>
            )}
          </div>
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

        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Photo</label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-4 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50">
            <Upload className="h-4 w-4" />
            {busyAction === "upload-restaurant-image"
              ? `Uploading… ${uploadProgress.type === "restaurant" ? `${uploadProgress.percent}%` : ""}`
              : "Replace photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImagePick(f);
              }}
            />
          </label>
          {uploadProgress.type === "restaurant" && (
            <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-orange-50">
              <div className="h-2 bg-orange-400 transition-all" style={{ width: `${uploadProgress.percent}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
