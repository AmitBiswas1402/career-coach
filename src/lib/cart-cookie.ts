import { cookies } from "next/headers";

export const CART_COOKIE_NAME = "food_delivery_cart";

export type CartItem = {
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
};

export type Cart = {
  restaurantId: number | null;
  items: CartItem[];
};

export async function readCartFromCookie(): Promise<Cart> {
  try {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_COOKIE_NAME);

    if (cartCookie?.value) {
      return JSON.parse(cartCookie.value) as Cart;
    }

    return { restaurantId: null, items: [] };
  } catch (error) {
    console.error("Error reading cart cookie:", error);
    return { restaurantId: null, items: [] };
  }
}

export async function clearCartCookie() {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, JSON.stringify({ restaurantId: null, items: [] }), {
    maxAge: 0,
    path: "/",
  });
}
