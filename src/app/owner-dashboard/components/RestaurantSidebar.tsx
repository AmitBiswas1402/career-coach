"use client";

import Image from "next/image";
import { Plus, Store, Upload } from "lucide-react";
import { restaurantTypes } from "../constants";

type Restaurant = {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  type: string;
  published: boolean | null;
};

type Category = { id: number; name: string };

type RestaurantDraft = {
  name: string;
  address: string;
  type: string;
  image: string;
  categories: number[];
};

type Props = {
  restaurants: Restaurant[];
  selectedRestaurantId: number | null;
  onSelectRestaurant: (id: number) => void;
  restaurantDraft: RestaurantDraft;
  onDraftChange: (draft: RestaurantDraft) => void;
  onCreateRestaurant: () => void;
  onImagePick: (file: File) => void;
  filePreview: string;
  busyAction: string | null;
  uploadProgress: { type: string | null; percent: number };
  allCategories: Category[];
};

function RestaurantThumb({ image, name }: { image: string | null; name: string }) {
  if (image) {
    return (
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-orange-100">
        <Image src={image} alt={name} fill className="object-cover" sizes="48px" />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
      <Store className="h-5 w-5 text-orange-300" />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const match = restaurantTypes.find((t) => t.value === type);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: match?.dot ?? "#94a3b8" }} />
      {match?.label ?? type}
    </span>
  );
}

export function RestaurantSidebar({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  restaurantDraft,
  onDraftChange,
  onCreateRestaurant,
  onImagePick,
  filePreview,
  busyAction,
  uploadProgress,
  allCategories,
}: Props) {
  return (
    <aside className="space-y-5">
      <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
        <div className="border-b border-orange-50 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Your locations</p>
            <Store className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-0.5 text-lg font-black text-slate-900">Restaurants</p>
        </div>
        <div className="space-y-1.5 p-3">
          {restaurants.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRestaurant(r.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                selectedRestaurantId === r.id
                  ? "bg-orange-50 ring-1 ring-orange-200"
                  : "hover:bg-slate-50"
              }`}
            >
              <RestaurantThumb image={r.image} name={r.name} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-bold ${selectedRestaurantId === r.id ? "text-orange-600" : "text-slate-800"}`}>
                  {r.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{r.address || "No address yet"}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <TypeBadge type={r.type} />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {r.published ? "Live" : "Draft"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
        <div className="border-b border-orange-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-bold text-slate-900">Add restaurant</p>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <input
            value={restaurantDraft.name}
            onChange={(e) => onDraftChange({ ...restaurantDraft, name: e.target.value })}
            placeholder="Restaurant name"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
          />
          <input
            value={restaurantDraft.address}
            onChange={(e) => onDraftChange({ ...restaurantDraft, address: e.target.value })}
            placeholder="Address"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
          />

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Restaurant type</p>
            <div className="flex flex-wrap gap-2">
              {restaurantTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onDraftChange({ ...restaurantDraft, type: type.value })}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    restaurantDraft.type === type.value
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-600 hover:border-orange-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Cuisine categories</p>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {allCategories.map((cat) => {
                const selected = restaurantDraft.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? restaurantDraft.categories.filter((id) => id !== cat.id)
                        : [...restaurantDraft.categories, cat.id];
                      onDraftChange({ ...restaurantDraft, categories: next });
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
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
          </div>

          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-3.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50">
            <Upload className="h-4 w-4" />
            {busyAction === "upload-restaurant-image"
              ? `Uploading… ${uploadProgress.type === "restaurant" ? `${uploadProgress.percent}%` : ""}`
              : "Upload photo"}
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
          {(filePreview || restaurantDraft.image) && (
            <div className="relative h-24 overflow-hidden rounded-xl border border-orange-100">
              <Image
                src={filePreview || restaurantDraft.image}
                alt="Preview"
                fill
                className="object-cover"
                sizes="280px"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onCreateRestaurant}
            disabled={!restaurantDraft.name.trim() || busyAction !== null}
            className="w-full rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "create-restaurant" ? "Creating…" : "Create restaurant"}
          </button>
        </div>
      </div>
    </aside>
  );
}
