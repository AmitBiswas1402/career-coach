export type CartLineItem = {
  price: number;
  quantity: number;
};

export const DELIVERY_FEE_PAISE = 4000;

export function calculateOrderTotalsPaise({ items }: { items: CartLineItem[] }) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0
  );
  const deliveryFee = DELIVERY_FEE_PAISE;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + deliveryFee + taxes;

  return { subtotal, deliveryFee, taxes, total };
}

export function formatPaiseAsRupees(paise: number) {
  return paise / 100;
}
