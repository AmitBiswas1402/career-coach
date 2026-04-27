"use server";

import { cookies } from "next/headers";

interface CartItem {
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
}

interface Cart {
  restaurantId: number | null;
  items: CartItem[];
}

const CART_COOKIE_NAME = "food_delivery_cart";

export async function getCart(): Promise<Cart> {
  try {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_COOKIE_NAME);

    if (cartCookie?.value) {
      return JSON.parse(cartCookie.value);
    }

    return { restaurantId: null, items: [] };
  } catch (error) {
    console.error("Error reading cart:", error);
    return { restaurantId: null, items: [] };
  }
}

export async function addToCart(
  restaurantId: number,
  menuItemId: number,
  itemName: string,
  itemPrice: number,
  quantity: number = 1
): Promise<Cart> {
  try {
    const cookieStore = await cookies();
    let cart = await getCart();

    // If adding to different restaurant, clear cart
    if (cart.restaurantId !== null && cart.restaurantId !== restaurantId) {
      cart = { restaurantId, items: [] };
    }

    cart.restaurantId = restaurantId;

    // Find existing item
    const existingItem = cart.items.find((item) => item.menuItemId === menuItemId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        menuItemId,
        quantity,
        name: itemName,
        price: itemPrice,
      });
    }

    // Set cookie
    cookieStore.set(CART_COOKIE_NAME, JSON.stringify(cart), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return cart;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

export async function removeFromCart(menuItemId: number): Promise<Cart> {
  try {
    const cookieStore = await cookies();
    const cart = await getCart();

    cart.items = cart.items.filter((item) => item.menuItemId !== menuItemId);

    if (cart.items.length === 0) {
      cart.restaurantId = null;
    }

    cookieStore.set(CART_COOKIE_NAME, JSON.stringify(cart), {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return cart;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

export async function updateCartItemQuantity(
  menuItemId: number,
  quantity: number
): Promise<Cart> {
  try {
    const cookieStore = await cookies();
    const cart = await getCart();

    const item = cart.items.find((item) => item.menuItemId === menuItemId);

    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter((item) => item.menuItemId !== menuItemId);
        if (cart.items.length === 0) {
          cart.restaurantId = null;
        }
      } else {
        item.quantity = quantity;
      }
    }

    cookieStore.set(CART_COOKIE_NAME, JSON.stringify(cart), {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return cart;
  } catch (error) {
    console.error("Error updating cart:", error);
    throw error;
  }
}
