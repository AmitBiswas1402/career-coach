"use client";

import Image from "next/image";
import { Check, Trash2, Upload } from "lucide-react";

export type MenuItemDraft = {
  name: string;
  price: string;
  description: string;
  categoryId: string;
  isVeg: boolean;
  image: string;
};

type Category = { id: number; name: string };

type Props = {
  itemId: number;
  draft: MenuItemDraft;
  categoryName?: string | null;
  onDraftChange: (draft: MenuItemDraft) => void;
  onSave: () => void;
  onDelete: () => void;
  onImagePick: (file: File) => void;
  busyAction: string | null;
  uploadProgress: { type: string | null; percent: number };
  categories: Category[];
};

export function MenuItemCard({
  itemId,
  draft,
  categoryName,
  onDraftChange,
  onSave,
  onDelete,
  onImagePick,
  busyAction,
  uploadProgress,
  categories,
}: Props) {
  const selectedCategory = categories.find((c) => String(c.id) === draft.categoryId);

  return (
    <div className="rounded-2xl border border-orange-50 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={draft.name}
              onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
              placeholder="Food item name"
              className="min-w-[160px] flex-1 rounded-xl border border-slate-200 bg-[#fffaf5] px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="button"
              onClick={() => onDraftChange({ ...draft, isVeg: !draft.isVeg })}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                draft.isVeg ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-600"
              }`}
            >
              {draft.isVeg ? "Veg" : "Non-veg"}
            </button>
            {(selectedCategory || categoryName) && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                {selectedCategory?.name ?? categoryName}
              </span>
            )}
          </div>

          <textarea
            value={draft.description}
            onChange={(e) => onDraftChange({ ...draft, description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-[#fffaf5] px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-slate-500">₹</span>
              <input
                value={draft.price}
                onChange={(e) => onDraftChange({ ...draft, price: e.target.value })}
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                className="w-24 rounded-xl border border-slate-200 bg-[#fffaf5] px-3 py-2 text-sm font-bold text-orange-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <select
              value={draft.categoryId}
              onChange={(e) => onDraftChange({ ...draft, categoryId: e.target.value })}
              className="rounded-xl border border-slate-200 bg-[#fffaf5] px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50/60 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50">
              <Upload className="h-3.5 w-3.5" />
              {busyAction === `upload-item-${itemId}` ? "Uploading…" : "Change photo"}
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
            <button
              type="button"
              onClick={onSave}
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              {busyAction === `update-${itemId}` ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
          {uploadProgress.type === `item-${itemId}` && (
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-orange-50">
              <div className="h-1.5 bg-orange-400 transition-all" style={{ width: `${uploadProgress.percent}%` }} />
            </div>
          )}
        </div>

        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
          {draft.image ? (
            <Image src={draft.image} alt={draft.name || "Menu item"} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
          )}
        </div>
      </div>
    </div>
  );
}
