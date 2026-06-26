"use client";

import { useEffect, useMemo, useRef, useState, startTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getOwnerDashboardData } from "@/actions/owner.action";
import { Check, Plus, Store, Upload, UtensilsCrossed, X } from "lucide-react";
import { restaurantTypes } from "./constants";
import { MenuItemCard } from "./components/MenuItemCard";
import { RestaurantHero } from "./components/RestaurantHero";
import { RestaurantSidebar } from "./components/RestaurantSidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Restaurant = Awaited<ReturnType<typeof getOwnerDashboardData>>["restaurants"][number];
type MenuItem = Awaited<ReturnType<typeof getOwnerDashboardData>>["menuItemsByRestaurant"][number][number];
type DashboardData = Awaited<ReturnType<typeof getOwnerDashboardData>>;

const emptyRestaurantDraft = () => ({
  name: "",
  address: "",
  type: "both",
  image: "",
  categories: [] as number[],
});

type RestaurantSnapshot = {
  name: string;
  address: string;
  type: string;
  image: string;
  categories: number[];
  published: boolean;
};

function snapshotFromRestaurant(restaurant: {
  name: string;
  address: string | null;
  type: string;
  image: string | null;
  published: boolean | null;
  categories: { id: number }[];
}): RestaurantSnapshot {
  return {
    name: restaurant.name,
    address: restaurant.address || "",
    type: restaurant.type,
    image: restaurant.image || "",
    published: restaurant.published ?? false,
    categories: restaurant.categories.map((c) => c.id).sort((a, b) => a - b),
  };
}

function snapshotsEqual(a: RestaurantSnapshot, b: RestaurantSnapshot) {
  return (
    a.name === b.name &&
    a.address === b.address &&
    a.type === b.type &&
    a.image === b.image &&
    a.published === b.published &&
    JSON.stringify(a.categories) === JSON.stringify(b.categories)
  );
}

export default function OwnerDashboardPage({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const { categories, restaurants, menuItemsByRestaurant } = initialData;

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    restaurants[0]?.id ?? null
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ type: string | null; percent: number }>({
    type: null,
    percent: 0,
  });

  const [restaurantDraft, setRestaurantDraft] = useState(emptyRestaurantDraft);
  const [restaurantEdit, setRestaurantEdit] = useState({
    name: "",
    address: "",
    type: "both",
    image: "",
    published: true,
    categories: [] as number[],
  });
  const [selectedRestaurantImage, setSelectedRestaurantImage] = useState("");
  const [restaurantFilePreview, setRestaurantFilePreview] = useState("");
  const [restaurantDirty, setRestaurantDirty] = useState(false);
  const [goLiveBaseline, setGoLiveBaseline] = useState<RestaurantSnapshot | null>(() => {
    const initialRestaurant = restaurants[0];
    return initialRestaurant ? snapshotFromRestaurant(initialRestaurant) : null;
  });

  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: "",
    isVeg: true,
    image: "",
  });
  const [menuItemDrafts, setMenuItemDrafts] = useState<
    Record<number, { name: string; price: string; description: string; categoryId: string; isVeg: boolean; image: string }>
  >({});
  const [menuFilePreview, setMenuFilePreview] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    destructive?: boolean;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const isMountedRef = useRef(true);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId]
  );
  const restaurantItems = useMemo(
    () => (selectedRestaurantId ? menuItemsByRestaurant[selectedRestaurantId] ?? [] : []),
    [menuItemsByRestaurant, selectedRestaurantId]
  );

  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of restaurantItems) {
      const key = item.categoryName ?? "Uncategorized";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [restaurantItems]);

  const currentRestaurantImage =
    restaurantFilePreview ||
    selectedRestaurantImage ||
    restaurantEdit.image ||
    selectedRestaurant?.image ||
    "";

  const currentRestaurantSnapshot = useMemo((): RestaurantSnapshot | null => {
    if (!selectedRestaurant) return null;
    return {
      name: restaurantEdit.name.trim(),
      address: restaurantEdit.address.trim(),
      type: restaurantEdit.type,
      image: currentRestaurantImage,
      published: restaurantEdit.published,
      categories: [...restaurantEdit.categories].sort((a, b) => a - b),
    };
  }, [currentRestaurantImage, restaurantEdit, selectedRestaurant]);

  const hasRestaurantChanges = useMemo(() => {
    if (restaurantDirty) return true;
    if (!goLiveBaseline || !currentRestaurantSnapshot) return false;
    return !snapshotsEqual(currentRestaurantSnapshot, goLiveBaseline);
  }, [restaurantDirty, currentRestaurantSnapshot, goLiveBaseline]);

  const hasMenuDraftChanges = useMemo(() => {
    return restaurantItems.some((item) => {
      const draft = menuItemDrafts[item.id];
      if (!draft) return false;
      return (
        draft.name.trim() !== item.name ||
        draft.price !== String(item.price) ||
        (draft.description || "") !== (item.description || "") ||
        (draft.categoryId || "") !== (item.categoryId ? String(item.categoryId) : "") ||
        (draft.isVeg ?? true) !== (item.isVeg ?? true) ||
        (draft.image || "") !== (item.image || "")
      );
    });
  }, [menuItemDrafts, restaurantItems]);

  const hasNewMenuForm = useMemo(() => {
    return Boolean(
      menuForm.name.trim() ||
        menuForm.price ||
        menuForm.description.trim() ||
        menuForm.categoryId ||
        menuForm.image
    );
  }, [menuForm]);

  const hasPendingChanges = hasRestaurantChanges || hasMenuDraftChanges || hasNewMenuForm;

  const isGoLiveEnabled = useMemo(() => {
    if (!selectedRestaurant) return false;
    if (!restaurantEdit.published) return true;
    return hasPendingChanges;
  }, [hasPendingChanges, restaurantEdit.published, selectedRestaurant]);

  const syncGoLiveBaseline = (snapshot: RestaurantSnapshot) => {
    setGoLiveBaseline(snapshot);
  };

  useEffect(() => {
    const restaurant = restaurants.find((r) => r.id === selectedRestaurantId);
    if (!restaurant) return;

    const snapshot = snapshotFromRestaurant(restaurant);
    setGoLiveBaseline(snapshot);
    setRestaurantDirty(false);
    setRestaurantEdit({
      name: restaurant.name,
      address: restaurant.address || "",
      type: restaurant.type,
      image: restaurant.image || "",
      published: restaurant.published ?? true,
      categories: restaurant.categories.map((c) => c.id),
    });
    setSelectedRestaurantImage("");
    setRestaurantFilePreview("");
    // Only re-sync form when switching restaurants, not on router.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurantId]);

  useEffect(() => {
    const drafts = restaurantItems.reduce<
      Record<number, { name: string; price: string; description: string; categoryId: string; isVeg: boolean; image: string }>
    >((acc, item) => {
      acc[item.id] = {
        name: item.name,
        price: String(item.price),
        description: item.description || "",
        categoryId: item.categoryId ? String(item.categoryId) : "",
        isVeg: item.isVeg ?? true,
        image: item.image || "",
      };
      return acc;
    }, {});
    setMenuItemDrafts(drafts);
  }, [restaurantItems, selectedRestaurantId]);

  const uploadImage = (file: File, type = "generic") => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("file", file);

      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && isMountedRef.current) {
          const p = Math.round((e.loaded / e.total) * 100);
          setUploadProgress({ type, percent: p });
        }
      };

      xhr.onload = () => {
        if (!isMountedRef.current) return;
        setUploadProgress({ type: null, percent: 0 });
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } catch {
            reject(new Error("Invalid upload response"));
          }
        } else {
          let errMsg = "Upload failed";
          try {
            const d = JSON.parse(xhr.responseText);
            errMsg = d.error || errMsg;
          } catch {
            /* ignore */
          }
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => {
        if (!isMountedRef.current) return;
        setUploadProgress({ type: null, percent: 0 });
        reject(new Error("Network error during upload"));
      };

      xhr.send(fd);
    });
  };

  const showNotice = (type: "success" | "error", text: string) => {
    if (!isMountedRef.current) return;
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    setNotice({ type, text });
    noticeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setNotice(null);
      }
    }, 4000);
  };

  const handleRestaurantImagePick = async (file: File) => {
    if (!selectedRestaurant) return;

    const previewUrl = URL.createObjectURL(file);
    setRestaurantFilePreview(previewUrl);
    setRestaurantDirty(true);
    setBusyAction("upload-restaurant-image");

    try {
      const url = await uploadImage(file, "restaurant");

      if (!isMountedRef.current) return;

      setSelectedRestaurantImage(url);
      setRestaurantEdit((c) => ({ ...c, image: url }));
      showNotice("success", "Cover photo ready. Click Go live to publish.");
    } catch (error) {
      if (!isMountedRef.current) return;
      showNotice("error", error instanceof Error ? error.message : "Could not upload cover photo");
    } finally {
      URL.revokeObjectURL(previewUrl);
      if (isMountedRef.current) {
        setRestaurantFilePreview("");
        setBusyAction(null);
      }
    }
  };

  const handleRestaurantEditChange = (edit: typeof restaurantEdit) => {
    setRestaurantEdit(edit);
    setRestaurantDirty(true);
  };

  const handleMenuImagePick = async (file: File) => {
    setMenuFilePreview(URL.createObjectURL(file));
    setBusyAction("upload-menu-image");
    try {
      const url = await uploadImage(file, "menu");
      setMenuForm((c) => ({ ...c, image: url }));
      showNotice("success", "Menu image uploaded.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not upload image");
    } finally {
      setBusyAction(null);
    }
  };

  const createRestaurant = async () => {
    setBusyAction("create-restaurant");
    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurantDraft),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Could not create restaurant");
      }
      showNotice("success", "Restaurant created!");
      startTransition(() => {
        router.refresh();
      });
      setRestaurantDraft(emptyRestaurantDraft());
      setRestaurantFilePreview("");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not create restaurant");
    } finally {
      setBusyAction(null);
    }
  };

  const saveRestaurant = async ({ published }: { published?: boolean } = {}) => {
    if (!selectedRestaurant) return false;
    const actionKey =
      published === true
        ? "go-live-restaurant"
        : published === false
          ? "unpublish-restaurant"
          : "update-restaurant";
    setBusyAction(actionKey);
    try {
      const response = await fetch("/api/restaurants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRestaurant.id,
          name: restaurantEdit.name,
          address: restaurantEdit.address,
          type: restaurantEdit.type,
          image: selectedRestaurantImage || restaurantEdit.image || selectedRestaurant.image,
          published: published ?? restaurantEdit.published,
          categories: restaurantEdit.categories,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Could not update restaurant");
      }
      if (published !== undefined) {
        setRestaurantEdit((c) => ({ ...c, published }));
      }
      return true;
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not update restaurant");
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const saveMenuItemDraft = async (item: MenuItem, { quiet = false }: { quiet?: boolean } = {}) => {
    const draft = menuItemDrafts[item.id];
    if (!draft) return false;
    const parsedPrice = Number(draft.price);
    if (!draft.name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showNotice("error", "Name and valid price are required for all menu items.");
      return false;
    }
    if (!quiet) setBusyAction(`update-${item.id}`);
    try {
      const response = await fetch("/api/menu-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          name: draft.name.trim(),
          price: parsedPrice,
          description: draft.description,
          categoryId: draft.categoryId ? Number(draft.categoryId) : undefined,
          isVeg: draft.isVeg,
          image: draft.image || undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Could not update menu item");
      }
      return true;
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not update menu item");
      return false;
    } finally {
      if (!quiet) setBusyAction(null);
    }
  };

  const saveAllPendingMenuItems = async () => {
    const dirtyItems = restaurantItems.filter((item) => {
      const draft = menuItemDrafts[item.id];
      if (!draft) return false;
      return (
        draft.name.trim() !== item.name ||
        draft.price !== String(item.price) ||
        (draft.description || "") !== (item.description || "") ||
        (draft.categoryId || "") !== (item.categoryId ? String(item.categoryId) : "") ||
        (draft.isVeg ?? true) !== (item.isVeg ?? true) ||
        (draft.image || "") !== (item.image || "")
      );
    });

    for (const item of dirtyItems) {
      const ok = await saveMenuItemDraft(item, { quiet: true });
      if (!ok) return false;
    }
    return true;
  };

  const executeGoLive = async () => {
    if (!selectedRestaurant) return;

    if (hasNewMenuForm) {
      showNotice("error", "Finish adding the new menu item or clear the form before going live.");
      return;
    }

    if (!restaurantEdit.name.trim()) {
      showNotice("error", "Restaurant name is required.");
      return;
    }

    const wasLive = restaurantEdit.published;
    setBusyAction("go-live-restaurant");
    try {
      const menuSaved = await saveAllPendingMenuItems();
      if (!menuSaved) return;

      const response = await fetch("/api/restaurants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRestaurant.id,
          name: restaurantEdit.name,
          address: restaurantEdit.address,
          type: restaurantEdit.type,
          image: selectedRestaurantImage || restaurantEdit.image || selectedRestaurant.image,
          published: true,
          categories: restaurantEdit.categories,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Could not go live");
      }

      setRestaurantEdit((c) => ({ ...c, published: true }));
      setRestaurantDirty(false);

      const finalImage = selectedRestaurantImage || restaurantEdit.image || selectedRestaurant.image || "";
      syncGoLiveBaseline({
        name: restaurantEdit.name.trim(),
        address: restaurantEdit.address.trim(),
        type: restaurantEdit.type,
        image: finalImage,
        published: true,
        categories: [...restaurantEdit.categories].sort((a, b) => a - b),
      });

      showNotice(
        "success",
        wasLive
          ? `"${selectedRestaurant.name}" is updated and live.`
          : `"${selectedRestaurant.name}" is now live${restaurantItems.length > 0 ? ` with ${restaurantItems.length} menu item${restaurantItems.length === 1 ? "" : "s"}` : ""}!`
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not go live");
    } finally {
      setBusyAction(null);
    }
  };

  const goLive = () => {
    if (!selectedRestaurant || !isGoLiveEnabled) return;

    if (!restaurantEdit.published && restaurantItems.length === 0) {
      setConfirm({
        title: "Go live without menu items?",
        description: `"${selectedRestaurant.name}" has no menu items yet.\n\nGo live anyway? Customers will see the restaurant but won't be able to order food until you add items.`,
        confirmLabel: "Go live",
        onConfirm: async () => {
          setConfirm(null);
          await executeGoLive();
        },
      });
      return;
    }

    if (!restaurantEdit.published) {
      setConfirm({
        title: "Go live?",
        description: `Make "${selectedRestaurant.name}" visible to customers${restaurantItems.length > 0 ? ` with ${restaurantItems.length} menu item${restaurantItems.length === 1 ? "" : "s"}` : ""}?`,
        confirmLabel: "Go live",
        onConfirm: async () => {
          setConfirm(null);
          await executeGoLive();
        },
      });
      return;
    }

    void executeGoLive();
  };

  const unpublishRestaurant = () => {
    if (!selectedRestaurant) return;
    setConfirm({
      title: "Unpublish restaurant?",
      description: `Hide "${selectedRestaurant.name}" from customer search?`,
      confirmLabel: "Unpublish",
      onConfirm: async () => {
        setConfirm(null);
        const ok = await saveRestaurant({ published: false });
        if (!ok) return;
        if (currentRestaurantSnapshot) {
          syncGoLiveBaseline({ ...currentRestaurantSnapshot, published: false });
        }
        setRestaurantDirty(false);
        showNotice("success", `"${selectedRestaurant.name}" is now hidden from customers.`);
        startTransition(() => {
          router.refresh();
        });
      },
    });
  };

  const deleteRestaurant = () => {
    if (!selectedRestaurant) return;
    setConfirm({
      title: "Delete restaurant?",
      description: `Delete "${selectedRestaurant.name}"? This also removes its menu items.`,
      destructive: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirm(null);
        setBusyAction("delete-restaurant");
        try {
          const response = await fetch("/api/restaurants", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: selectedRestaurant.id }),
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Could not delete restaurant");
          }
          showNotice("success", "Restaurant deleted.");
          router.refresh();
        } catch (error) {
          showNotice("error", error instanceof Error ? error.message : "Could not delete restaurant");
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  const createMenuItem = async () => {
    if (!selectedRestaurant) return;
    const parsedPrice = Number(menuForm.price);
    if (!menuForm.name.trim()) {
      showNotice("error", "Food item name is required.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showNotice("error", "Enter a valid food price.");
      return;
    }
    if (!menuForm.categoryId) {
      showNotice("error", "Select a category for this food item.");
      return;
    }
    if (!menuForm.image) {
      showNotice("error", "Upload an image for this food item.");
      return;
    }
    setBusyAction("create-menu-item");
    try {
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          name: menuForm.name.trim(),
          price: parsedPrice,
          description: menuForm.description,
          categoryId: Number(menuForm.categoryId),
          isVeg: menuForm.isVeg,
          image: menuForm.image,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Could not create menu item");
      }
      showNotice("success", "Menu item added!");
      router.refresh();
      setMenuForm({ name: "", price: "", description: "", categoryId: "", isVeg: true, image: "" });
      setMenuFilePreview("");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not create menu item");
    } finally {
      setBusyAction(null);
    }
  };

  const updateMenuItemDraft = async (item: MenuItem) => {
    setBusyAction(`update-${item.id}`);
    try {
      const ok = await saveMenuItemDraft(item, { quiet: true });
      if (!ok) return;
      showNotice("success", "Menu item updated.");
      router.refresh();
    } finally {
      setBusyAction(null);
    }
  };

  const handleMenuItemImagePick = async (itemId: number, file: File) => {
    setBusyAction(`upload-item-${itemId}`);
    try {
      const url = await uploadImage(file, `item-${itemId}`);
      setMenuItemDrafts((c) => ({
        ...c,
        [itemId]: {
          ...(c[itemId] || { name: "", price: "", description: "", categoryId: "", isVeg: true, image: "" }),
          image: url,
        },
      }));
      showNotice("success", "Image uploaded. Click Save to apply.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Could not upload image");
    } finally {
      setBusyAction(null);
    }
  };

  const deleteMenuItem = (itemId: number) => {
    setConfirm({
      title: "Delete menu item?",
      description: "Delete this menu item? This cannot be undone.",
      destructive: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirm(null);
        setBusyAction(`delete-${itemId}`);
        try {
          const response = await fetch("/api/menu-items", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: itemId }),
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Could not delete menu item");
          }
          showNotice("success", "Menu item deleted.");
          router.refresh();
        } catch (error) {
          showNotice("error", error instanceof Error ? error.message : "Could not delete menu item");
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  const hasRestaurants = restaurants.length > 0;

  return (
    <main className="min-h-screen bg-surface-cream">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {notice && (
        <div
          className={`fixed right-5 top-20 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-lg transition-all duration-300 ${
            notice.type === "success"
              ? "border-green-200 bg-white text-green-800"
              : "border-red-200 bg-white text-red-700"
          }`}
        >
          {notice.type === "success" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <p className="text-sm font-medium">{notice.text}</p>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!hasRestaurants ? (
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-amber-400 to-orange-500" />
              <div className="p-8 sm:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200">
                  <Store className="h-7 w-7 text-white" />
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">Get started</p>
                <h2 className="mt-1.5 text-2xl font-black text-slate-900 sm:text-3xl">Create your first restaurant</h2>
                <p className="mt-2 text-slate-500">Fill in the details below to list your restaurant on Food.</p>

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

                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-700">Cuisine categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const selected = restaurantDraft.categories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? restaurantDraft.categories.filter((id) => id !== cat.id)
                                : [...restaurantDraft.categories, cat.id];
                              setRestaurantDraft((c) => ({ ...c, categories: next }));
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
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRestaurantDraft(emptyRestaurantDraft());
                        setRestaurantFilePreview("");
                      }}
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
                      {busyAction === "create-restaurant" ? "Creating…" : "Create restaurant"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <RestaurantSidebar
              restaurants={restaurants}
              selectedRestaurantId={selectedRestaurantId}
              onSelectRestaurant={setSelectedRestaurantId}
              restaurantDraft={restaurantDraft}
              onDraftChange={setRestaurantDraft}
              onCreateRestaurant={createRestaurant}
              busyAction={busyAction}
              allCategories={categories}
            />

            <div className="space-y-5">
              {selectedRestaurant ? (
                <>
                  <RestaurantHero
                    restaurant={selectedRestaurant}
                    restaurantEdit={restaurantEdit}
                    onEditChange={handleRestaurantEditChange}
                    selectedImage={selectedRestaurantImage}
                    imagePreview={restaurantFilePreview}
                    onImagePick={(f) => void handleRestaurantImagePick(f)}
                    onGoLive={() => void goLive()}
                    onUnpublish={() => void unpublishRestaurant()}
                    onDelete={deleteRestaurant}
                    menuItemCount={restaurantItems.length}
                    busyAction={busyAction}
                    uploadProgress={uploadProgress}
                    allCategories={categories}
                    isGoLiveEnabled={isGoLiveEnabled}
                    hasPendingChanges={hasPendingChanges}
                  />

                  <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-50 px-6 py-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Menu management</p>
                        <h2 className="mt-0.5 text-xl font-black text-slate-900">Menu items</h2>
                        <p className="mt-2 text-sm text-slate-500">
                          Manage food items for <span className="font-semibold">{selectedRestaurant.name}</span>.
                        </p>
                      </div>
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-sm font-bold text-orange-600">
                        {restaurantItems.length} {restaurantItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className="border-b border-orange-50 bg-[#fffdf9] px-6 py-5">
                      <p className="mb-4 text-[13px] font-bold text-slate-700">Add new item</p>
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50 sm:h-auto sm:w-36">
                          {menuFilePreview || menuForm.image ? (
                            <Image
                              src={menuFilePreview || menuForm.image}
                              alt="New item preview"
                              fill
                              className="object-cover"
                              sizes="144px"
                            />
                          ) : (
                            <div className="flex h-full min-h-32 items-center justify-center text-3xl">🍽️</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
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
                              min="0"
                              step="0.01"
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                            />
                          </div>
                          <textarea
                            value={menuForm.description}
                            onChange={(e) => setMenuForm((c) => ({ ...c, description: e.target.value }))}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <select
                              value={menuForm.categoryId}
                              onChange={(e) => setMenuForm((c) => ({ ...c, categoryId: e.target.value }))}
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                            >
                              <option value="">Category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setMenuForm((c) => ({ ...c, isVeg: !c.isVeg }))}
                              className={`flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                                menuForm.isVeg
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-red-300 bg-red-50 text-red-600"
                              }`}
                            >
                              <div className={`h-2.5 w-2.5 rounded-full ${menuForm.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                              {menuForm.isVeg ? "Veg" : "Non-veg"}
                            </button>
                            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 px-4 text-sm font-medium text-orange-600 transition hover:bg-orange-50">
                              <Upload className="h-4 w-4" />
                              {busyAction === "upload-menu-image" ? "Uploading…" : "Upload photo"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void handleMenuImagePick(f);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={createMenuItem}
                              disabled={
                                !menuForm.name.trim() || !menuForm.categoryId || !menuForm.image || busyAction !== null
                              }
                              className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Plus className="h-4 w-4" />
                              {busyAction === "create-menu-item" ? "Adding…" : "Add item"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {restaurantItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                          <UtensilsCrossed className="h-7 w-7 text-orange-300" />
                        </div>
                        <p className="mt-4 font-bold text-slate-800">No menu items yet</p>
                        <p className="mt-1 text-sm text-slate-400">Add your first item using the form above.</p>
                      </div>
                    ) : (
                      <div className="space-y-6 p-6">
                        {itemsByCategory.map(([categoryName, items]) => (
                          <div key={categoryName}>
                            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-orange-600">
                              {categoryName}
                            </h3>
                            <div className="space-y-3">
                              {items.map((item) => {
                                const draft = menuItemDrafts[item.id];
                                if (!draft) return null;
                                return (
                                  <MenuItemCard
                                    key={item.id}
                                    itemId={item.id}
                                    draft={draft}
                                    categoryName={item.categoryName}
                                    onDraftChange={(d) =>
                                      setMenuItemDrafts((c) => ({ ...c, [item.id]: d }))
                                    }
                                    onSave={() => void updateMenuItemDraft(item)}
                                    onDelete={() => void deleteMenuItem(item.id)}
                                    onImagePick={(f) => void handleMenuItemImagePick(item.id, f)}
                                    busyAction={busyAction}
                                    uploadProgress={uploadProgress}
                                    categories={categories}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
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

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
        busy={busyAction !== null}
        onConfirm={() => void confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}
