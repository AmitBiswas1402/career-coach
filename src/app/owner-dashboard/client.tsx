"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getOwnerDashboardData } from "@/actions/owner.action";
import {
  Menu,
  Plus,
  Trash2,
  PencilLine,
  Upload,
  Store,
  UtensilsCrossed,
  Check,
  X,
} from "lucide-react";

type Restaurant = Awaited<ReturnType<typeof getOwnerDashboardData>>["restaurants"][number];
type MenuItem = Awaited<ReturnType<typeof getOwnerDashboardData>>["menuItemsByRestaurant"][number] extends never
  ? never
  : Awaited<ReturnType<typeof getOwnerDashboardData>>["menuItemsByRestaurant"][number][number];
type DashboardData = Awaited<ReturnType<typeof getOwnerDashboardData>>;

const restaurantTypes = [
  { value: "veg", label: "Vegetarian", hint: "Pure veg menu", dot: "#22c55e" },
  { value: "non-veg", label: "Non-vegetarian", hint: "Chicken, meat, seafood", dot: "#ef4444" },
  { value: "both", label: "Mixed", hint: "Veg and non-veg dishes", dot: "#f97316" },
] as const;

export default function OwnerDashboardPage({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const { categories, restaurants, menuItemsByRestaurant } = initialData;

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    restaurants[0]?.id ?? null
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [restaurantDraft, setRestaurantDraft] = useState({ name: "", address: "", type: "both", image: "" });
  const [restaurantEdit, setRestaurantEdit] = useState({ name: "", address: "", type: "both", image: "" });
  const [selectedRestaurantImage, setSelectedRestaurantImage] = useState("");
  const [restaurantFilePreview, setRestaurantFilePreview] = useState("");

  const [menuForm, setMenuForm] = useState({ name: "", price: "", description: "", categoryId: "", isVeg: true, image: "" });
  const [menuItemDrafts, setMenuItemDrafts] = useState<Record<number, { name: string; price: string; description: string; categoryId: string; isVeg: boolean; image: string }>>({});
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuFilePreview, setMenuFilePreview] = useState("");

  const selectedRestaurant = useMemo(() => restaurants.find((r) => r.id === selectedRestaurantId) ?? null, [restaurants, selectedRestaurantId]);
  const restaurantItems = useMemo(() => (selectedRestaurantId ? menuItemsByRestaurant[selectedRestaurantId] ?? [] : []), [menuItemsByRestaurant, selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurant) return;
    setRestaurantEdit({ name: selectedRestaurant.name, address: selectedRestaurant.address || "", type: selectedRestaurant.type, image: selectedRestaurant.image || "" });
    setSelectedRestaurantImage("");
  }, [selectedRestaurantId, selectedRestaurant]);

  useEffect(() => {
    const drafts = restaurantItems.reduce<Record<number, typeof menuItemDrafts[number]>>((acc, item) => {
      acc[item.id] = { name: item.name, price: String(item.price), description: item.description || "", categoryId: item.categoryId ? String(item.categoryId) : "", isVeg: item.isVeg ?? true, image: item.image || "" };
      return acc;
    }, {});
    setMenuItemDrafts(drafts);
  }, [restaurantItems, selectedRestaurantId]);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Upload failed"); }
    const data = await response.json();
    return data.url as string;
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleRestaurantImagePick = async (file: File) => {
    setRestaurantFilePreview(URL.createObjectURL(file));
    setBusyAction("upload-restaurant-image");
    try {
      const url = await uploadImage(file);
      setRestaurantDraft((c) => ({ ...c, image: url }));
      setSelectedRestaurantImage(url);
      showNotice("success", "Restaurant image uploaded.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not upload image");
    } finally { setBusyAction(null); }
  };

  const handleMenuImagePick = async (file: File) => {
    setMenuFilePreview(URL.createObjectURL(file));
    setBusyAction("upload-menu-image");
    try {
      const url = await uploadImage(file);
      setMenuForm((c) => ({ ...c, image: url }));
      showNotice("success", "Menu image uploaded.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not upload image");
    } finally { setBusyAction(null); }
  };

  const createRestaurant = async () => {
    setBusyAction("create-restaurant");
    try {
      const response = await fetch("/api/restaurants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(restaurantDraft) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Could not create restaurant"); }
      showNotice("success", "Restaurant created!");
      router.refresh();
      setRestaurantDraft({ name: "", address: "", type: "both", image: "" });
      setRestaurantFilePreview("");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not create restaurant");
    } finally { setBusyAction(null); }
  };

  const updateRestaurant = async () => {
    if (!selectedRestaurant) return;
    setBusyAction("update-restaurant");
    try {
      const response = await fetch("/api/restaurants", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedRestaurant.id, name: restaurantEdit.name, address: restaurantEdit.address, type: restaurantEdit.type, image: selectedRestaurantImage || restaurantEdit.image || selectedRestaurant.image }) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Could not update restaurant"); }
      showNotice("success", "Restaurant updated successfully.");
      router.refresh();
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not update restaurant");
    } finally { setBusyAction(null); }
  };

  const deleteRestaurant = async () => {
    if (!selectedRestaurant) return;
    if (!window.confirm(`Delete "${selectedRestaurant.name}"? This also removes its menu items.`)) return;
    setBusyAction("delete-restaurant");
    try {
      const response = await fetch("/api/restaurants", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedRestaurant.id }) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Could not delete restaurant"); }
      showNotice("success", "Restaurant deleted.");
      router.refresh();
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not delete restaurant");
    } finally { setBusyAction(null); }
  };

  const createMenuItem = async () => {
    if (!selectedRestaurant) return;
    setBusyAction("create-menu-item");
    try {
      const response = await fetch("/api/menu-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId: selectedRestaurant.id, name: menuForm.name, price: Number(menuForm.price), description: menuForm.description, categoryId: menuForm.categoryId ? Number(menuForm.categoryId) : null, isVeg: menuForm.isVeg, image: menuForm.image }) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Could not create menu item"); }
      showNotice("success", "Menu item added!");
      router.refresh();
      setMenuForm({ name: "", price: "", description: "", categoryId: "", isVeg: true, image: "" });
      setMenuFile(null);
      setMenuFilePreview("");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not create menu item");
    } finally { setBusyAction(null); }
  };

  const updateMenuItemDraft = async (item: MenuItem) => {
    const draft = menuItemDrafts[item.id];
    if (!draft) return;
    setBusyAction(`update-${item.id}`);
    try {
      const response = await fetch("/api/menu-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, name: draft.name, price: Number(draft.price), description: draft.description, categoryId: draft.categoryId ? Number(draft.categoryId) : undefined, isVeg: draft.isVeg, image: draft.image }) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Could not update menu item"); }
      showNotice("success", "Menu item updated.");
      router.refresh();
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not update menu item");
    } finally { setBusyAction(null); }
  };

  const handleMenuItemImagePick = async (itemId: number, file: File) => {
    setBusyAction(`upload-item-${itemId}`);
    try {
      const url = await uploadImage(file);
      setMenuItemDrafts((c) => ({ ...c, [itemId]: { ...(c[itemId] || { name: "", price: "", description: "", categoryId: "", isVeg: true, image: "" }), image: url } }));
      showNotice("success", "Image uploaded.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not upload image");
    } finally { setBusyAction(null); }
  };

  const deleteMenuItem = async (itemId: number) => {
    if (!window.confirm("Delete this menu item?")) return;
    setBusyAction(`delete-${itemId}`);
    try {
      const response = await fetch("/api/menu-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: itemId }) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Could not delete menu item"); }
      showNotice("success", "Menu item deleted.");
      router.refresh();
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not delete menu item");
    } finally { setBusyAction(null); }
  };

  const hasRestaurants = restaurants.length > 0;

  return (
    <main className="min-h-screen bg-[#fffaf5]">
      {/* Subtle background texture */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* Toast notification */}
      {notice && (
        <div
          className={`fixed right-5 top-20 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-lg transition-all duration-300 ${
            notice.type === "success"
              ? "border-green-200 bg-white text-green-800"
              : "border-red-200 bg-white text-red-700"
          }`}
        >
          {notice.type === "success" ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
          <p className="text-sm font-medium">{notice.text}</p>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {!hasRestaurants ? (
          /* ── Empty state: no restaurants yet ── */
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-amber-400 to-orange-500" />
              <div className="p-8 sm:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200">
                  <Store className="h-7 w-7 text-white" />
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">Get started</p>
                <h2 className="mt-1.5 text-2xl font-black text-slate-900 sm:text-3xl">Create your first restaurant</h2>
                <p className="mt-2 text-slate-500">Fill in the details below to list your restaurant on GourmetGo.</p>

                <div className="mt-8 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Restaurant name</label>
                      <input
                        value={restaurantDraft.name}
                        onChange={(e) => setRestaurantDraft((c) => ({ ...c, name: e.target.value }))}
                        placeholder="e.g. The Spice Garden"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Address</label>
                      <input
                        value={restaurantDraft.address}
                        onChange={(e) => setRestaurantDraft((c) => ({ ...c, address: e.target.value }))}
                        placeholder="123 Main Street, City"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                      />
                    </div>
                  </div>

                  {/* Restaurant type */}
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-700">Restaurant type</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {restaurantTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setRestaurantDraft((c) => ({ ...c, type: type.value }))}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                            restaurantDraft.type === type.value
                              ? "border-orange-400 bg-orange-50 ring-1 ring-orange-200"
                              : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.dot }} />
                            <p className="text-[14px] font-bold text-slate-900">{type.label}</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{type.hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Restaurant photo</label>
                    <label className="flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-4 text-sm font-medium text-orange-600 transition hover:bg-orange-50">
                      <Upload className="h-4 w-4" />
                      {busyAction === "upload-restaurant-image" ? "Uploading..." : "Upload a photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleRestaurantImagePick(f); }} />
                    </label>
                    {restaurantFilePreview && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-orange-100">
                        <Image src={restaurantFilePreview} alt="Preview" width={800} height={300} className="h-44 w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRestaurantDraft({ name: "", address: "", type: "both", image: "" })}
                      className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={createRestaurant}
                      disabled={busyAction !== null || !restaurantDraft.name.trim()}
                      className="rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === "create-restaurant" ? "Creating…" : "Publish restaurant"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Dashboard with sidebar ── */
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Restaurant list */}
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
                      onClick={() => setSelectedRestaurantId(r.id)}
                      className={`w-full rounded-2xl px-4 py-3.5 text-left transition-all ${
                        selectedRestaurantId === r.id
                          ? "bg-orange-50 ring-1 ring-orange-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <p className={`truncate text-sm font-bold ${selectedRestaurantId === r.id ? "text-orange-600" : "text-slate-800"}`}>{r.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{r.address || "No address yet"}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add restaurant mini form */}
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
                    onChange={(e) => setRestaurantDraft((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Restaurant name"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  <input
                    value={restaurantDraft.address}
                    onChange={(e) => setRestaurantDraft((c) => ({ ...c, address: e.target.value }))}
                    placeholder="Address"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  <button
                    type="button"
                    onClick={createRestaurant}
                    disabled={!restaurantDraft.name.trim() || busyAction !== null}
                    className="w-full rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction === "create-restaurant" ? "Creating…" : "Create restaurant"}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main panel */}
            <div className="space-y-5">
              {selectedRestaurant ? (
                <>
                  {/* Restaurant details card */}
                  <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
                    <div className="h-1 w-full bg-linear-to-r from-orange-400 to-amber-400" />
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Restaurant details</p>
                          <h2 className="mt-1 text-2xl font-black text-slate-900">{selectedRestaurant.name}</h2>
                          <p className="mt-0.5 text-sm text-slate-400">{selectedRestaurant.address || "No address set"}</p>
                        </div>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={updateRestaurant}
                            disabled={busyAction !== null}
                            className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            {busyAction === "update-restaurant" ? "Saving…" : "Save changes"}
                          </button>
                          <button
                            type="button"
                            onClick={deleteRestaurant}
                            disabled={busyAction !== null}
                            className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Name</label>
                          <input
                            value={restaurantEdit.name}
                            onChange={(e) => setRestaurantEdit((c) => ({ ...c, name: e.target.value }))}
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Address</label>
                          <input
                            value={restaurantEdit.address}
                            onChange={(e) => setRestaurantEdit((c) => ({ ...c, address: e.target.value }))}
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                          />
                        </div>
                      </div>

                      {/* Type selector */}
                      <div className="mt-4">
                        <label className="mb-2 block text-[13px] font-semibold text-slate-700">Restaurant type</label>
                        <div className="flex flex-wrap gap-2.5">
                          {restaurantTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setRestaurantEdit((c) => ({ ...c, type: type.value }))}
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

                      {/* Image upload for edit */}
                      <div className="mt-4">
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Photo</label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-4 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50">
                          <Upload className="h-4 w-4" />
                          {busyAction === "upload-restaurant-image" ? "Uploading…" : "Replace photo"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleRestaurantImagePick(f); }} />
                        </label>
                        {(selectedRestaurantImage || selectedRestaurant.image) && (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-orange-100">
                            <Image src={selectedRestaurantImage || selectedRestaurant.image!} alt="Restaurant" width={800} height={280} className="h-40 w-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu items card */}
                  <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-50 px-6 py-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Menu management</p>
                        <h2 className="mt-0.5 text-xl font-black text-slate-900">Menu items</h2>
                      </div>
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-sm font-bold text-orange-600">
                        {restaurantItems.length} {restaurantItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {/* Add new item form */}
                    <div className="border-b border-orange-50 bg-[#fffdf9] px-6 py-5">
                      <p className="mb-3 text-[13px] font-bold text-slate-700">Add new item</p>
                      <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                        <input
                          value={menuForm.name}
                          onChange={(e) => setMenuForm((c) => ({ ...c, name: e.target.value }))}
                          placeholder="Food item name"
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <input
                          value={menuForm.price}
                          onChange={(e) => setMenuForm((c) => ({ ...c, price: e.target.value }))}
                          placeholder="Price (₹)"
                          type="number"
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <button
                          type="button"
                          onClick={createMenuItem}
                          disabled={!menuForm.name.trim() || busyAction !== null}
                          className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Plus className="h-4 w-4" />
                          {busyAction === "create-menu-item" ? "Adding…" : "Add item"}
                        </button>
                      </div>

                      {/* Extra fields */}
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                        <input
                          value={menuForm.description}
                          onChange={(e) => setMenuForm((c) => ({ ...c, description: e.target.value }))}
                          placeholder="Description (optional)"
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <select
                          value={menuForm.categoryId}
                          onChange={(e) => setMenuForm((c) => ({ ...c, categoryId: e.target.value }))}
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        >
                          <option value="">Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setMenuForm((c) => ({ ...c, isVeg: !c.isVeg }))}
                            className={`flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                              menuForm.isVeg ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-600"
                            }`}
                          >
                            <div className={`h-2.5 w-2.5 rounded-full ${menuForm.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                            {menuForm.isVeg ? "Veg" : "Non-veg"}
                          </button>
                          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-4 text-sm font-medium text-orange-600 transition hover:bg-orange-50">
                            <Upload className="h-4 w-4" />
                            {busyAction === "upload-menu-image" ? "Uploading…" : "Photo"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleMenuImagePick(f); }} />
                          </label>
                        </div>
                      </div>

                      {menuFilePreview && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-orange-100">
                          <Image src={menuFilePreview} alt="Menu item preview" width={400} height={200} className="h-32 w-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Existing items list */}
                    {restaurantItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                          <UtensilsCrossed className="h-7 w-7 text-orange-300" />
                        </div>
                        <p className="mt-4 font-bold text-slate-800">No menu items yet</p>
                        <p className="mt-1 text-sm text-slate-400">Add your first item using the form above.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-orange-50">
                        {restaurantItems.map((item) => {
                          const draft = menuItemDrafts[item.id];
                          if (!draft) return null;
                          return (
                            <div key={item.id} className="px-6 py-5">
                              <div className="grid gap-3 sm:grid-cols-[1fr_140px_160px_auto]">
                                <input
                                  value={draft.name}
                                  onChange={(e) => setMenuItemDrafts((c) => ({ ...c, [item.id]: { ...c[item.id]!, name: e.target.value } }))}
                                  className="h-11 rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                />
                                <input
                                  value={draft.price}
                                  onChange={(e) => setMenuItemDrafts((c) => ({ ...c, [item.id]: { ...c[item.id]!, price: e.target.value } }))}
                                  type="number"
                                  placeholder="Price (₹)"
                                  className="h-11 rounded-2xl border border-slate-200 bg-[#fffaf5] px-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                />
                                <select
                                  value={draft.categoryId}
                                  onChange={(e) => setMenuItemDrafts((c) => ({ ...c, [item.id]: { ...c[item.id]!, categoryId: e.target.value } }))}
                                  className="h-11 rounded-2xl border border-slate-200 bg-[#fffaf5] px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                >
                                  <option value="">Category</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setMenuItemDrafts((c) => ({ ...c, [item.id]: { ...c[item.id]!, isVeg: !c[item.id]!.isVeg } }))}
                                    className={`h-11 w-11 rounded-2xl border text-center text-[10px] font-black transition ${
                                      draft.isVeg ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-600"
                                    }`}
                                    title={draft.isVeg ? "Veg" : "Non-veg"}
                                  >
                                    {draft.isVeg ? "V" : "NV"}
                                  </button>
                                  <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 text-orange-500 transition hover:bg-orange-50" title="Upload image">
                                    <Upload className="h-4 w-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleMenuItemImagePick(item.id, f); }} />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => updateMenuItemDraft(item)}
                                    disabled={busyAction !== null}
                                    className="flex h-11 items-center gap-1.5 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                                  >
                                    {busyAction === `update-${item.id}` ? "…" : <Check className="h-4 w-4" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMenuItem(item.id)}
                                    disabled={busyAction !== null}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Item image preview */}
                              {(draft.image) && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-orange-100">
                                  <Image src={draft.image} alt={draft.name} width={120} height={80} className="h-20 w-28 object-cover" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-orange-100 bg-white px-8 py-20 text-center shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                    <Store className="h-8 w-8 text-orange-300" />
                  </div>
                  <p className="mt-5 text-xl font-black text-slate-900">No restaurant selected</p>
                  <p className="mt-2 text-sm text-slate-400">Pick one from the sidebar or create a new location.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}