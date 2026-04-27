import Link from "next/link";
import {
  addMenuItemAction,
  createRestaurantAction,
  deleteMenuItemAction,
  getOwnerDashboardData,
  updateMenuItemAction,
} from "@/actions/owner.action";

export default async function OwnerDashboardPage() {
  const { owner, restaurants, menuItemsByRestaurant } = await getOwnerDashboardData();

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">Owner Dashboard</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Welcome, {owner.name || "Owner"}
          </h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            You can add, update, and delete menu items here.
          </p>
        </div>

        {restaurants.length === 0 ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Create your first restaurant</h2>
            <p className="mt-2 text-sm text-gray-600">Add a restaurant profile before managing food items.</p>

            <form action={createRestaurantAction} className="mt-6 grid gap-4 sm:grid-cols-3">
              <input
                name="name"
                placeholder="Restaurant name"
                required
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-orange-300 focus:ring"
              />
              <select
                name="type"
                defaultValue="both"
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-orange-300 focus:ring"
              >
                <option value="veg">Veg</option>
                <option value="non-veg">Non-veg</option>
                <option value="both">Both</option>
              </select>
              <button className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700">
                Create restaurant
              </button>
            </form>
          </section>
        ) : (
          restaurants.map((restaurant) => (
            <section key={restaurant.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
                  <p className="text-sm capitalize text-gray-500">Type: {restaurant.type}</p>
                </div>
                <Link
                  href={`/search/${encodeURIComponent(restaurant.name.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                >
                  View customer page
                </Link>
              </div>

              <div className="mt-7 rounded-2xl border border-gray-200 p-4 sm:p-5">
                <h3 className="text-lg font-bold text-gray-900">Add new food item</h3>

                <form action={addMenuItemAction} className="mt-4 grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="restaurantId" value={restaurant.id} />
                  <input
                    name="name"
                    placeholder="Item name"
                    required
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-orange-300 focus:ring sm:col-span-2"
                  />
                  <input
                    name="price"
                    type="number"
                    min={1}
                    placeholder="Price"
                    required
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-orange-300 focus:ring"
                  />
                  <button className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700">
                    Add item
                  </button>
                </form>
              </div>

              <div className="mt-6 space-y-4">
                {(menuItemsByRestaurant[restaurant.id] ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <form action={updateMenuItemAction} className="grid gap-3 sm:grid-cols-5">
                      <input type="hidden" name="itemId" value={item.id} />
                      <input
                        name="name"
                        defaultValue={item.name}
                        required
                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-orange-300 focus:ring sm:col-span-2"
                      />
                      <input
                        name="price"
                        type="number"
                        min={1}
                        defaultValue={item.price}
                        required
                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-orange-300 focus:ring"
                      />
                      <button className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black">
                        Update
                      </button>
                      <button
                        formAction={deleteMenuItemAction}
                        className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ))}

                {(menuItemsByRestaurant[restaurant.id] ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                    No menu items yet. Add your first food item above.
                  </p>
                ) : null}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
