import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";

// Storefront pages are rendered per request (SSR) from the API, so the image can be built without
// a running backend and the admin's changes show up without a rebuild. Fetches are never cached (lib/api.ts).
export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
