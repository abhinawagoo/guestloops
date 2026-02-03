"use client";

import { useState } from "react";
import Link from "next/link";
import type { VenueWithSettings } from "@/data/demo-venues";
import type { MenuCategory, MenuCategoryItem } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

type CartLine = {
  itemId: string;
  categoryId: string;
  name: string;
  description?: string;
  priceDisplay: string;
  sizeId?: string;
  sizeName?: string;
  sizePrice?: string;
  quantity: number;
};

function getCategoriesAndItems(venue: VenueWithSettings): { category: MenuCategory; item: MenuCategoryItem }[] {
  const categories = venue.settings.menuCategories ?? [];
  const out: { category: MenuCategory; item: MenuCategoryItem }[] = [];
  for (const cat of categories.filter((c) => c.enabled).sort((a, b) => a.order - b.order)) {
    for (const item of (cat.items ?? []).filter((i) => i.enabled).sort((a, b) => a.order - b.order)) {
      out.push({ category: cat, item });
    }
  }
  return out;
}

function flattenMenu(venue: VenueWithSettings): { category: MenuCategory; item: MenuCategoryItem }[] {
  const fromCategories = getCategoriesAndItems(venue);
  if (fromCategories.length > 0) return fromCategories;
  const legacy = venue.settings.menuItems ?? [];
  return legacy
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      category: { id: "legacy", name: m.category, enabled: true, order: 0, items: [] },
      item: {
        id: m.id,
        name: m.name,
        description: m.description,
        price: m.price,
        imageUrl: m.imageUrl,
        enabled: true,
        order: m.order,
      },
    })) as { category: MenuCategory; item: MenuCategoryItem }[];
}

export function MenuClient({ venue }: { venue: VenueWithSettings }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showBill, setShowBill] = useState(false);

  const rows = flattenMenu(venue);
  const rewardCta = venue.settings.uiText.rewardCta ?? venue.rewardCta;

  const addToCart = (
    categoryId: string,
    item: MenuCategoryItem,
    size?: { id: string; name: string; price?: string }
  ) => {
    const priceDisplay = size?.price ?? item.price ?? "—";
    const key = size ? `${item.id}-${size.id}` : item.id;
    const existing = cart.find(
      (l) => l.itemId === item.id && l.sizeId === size?.id
    );
    if (existing) {
      setCart(
        cart.map((l) =>
          l.itemId === item.id && l.sizeId === size?.id
            ? { ...l, quantity: l.quantity + 1 }
            : l
        )
      );
    } else {
      setCart([
        ...cart,
        {
          itemId: item.id,
          categoryId,
          name: item.name,
          description: item.description,
          priceDisplay,
          sizeId: size?.id,
          sizeName: size?.name,
          sizePrice: size?.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const line = cart[index];
    const next = line.quantity + delta;
    if (next <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      setCart(
        cart.map((l, i) => (i === index ? { ...l, quantity: next } : l))
      );
    }
  };

  const removeLine = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const categories =
    venue.settings.menuCategories?.filter((c) => c.enabled).sort((a, b) => a.order - b.order) ?? [];
  const hasCategories = categories.length > 0;
  const totalItems = cart.reduce((s, l) => s + l.quantity, 0);

  if (showBill && cart.length > 0) {
    return (
      <main className="min-h-screen bg-background p-6 pb-28">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setShowBill(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to menu
            </button>
          </div>
          <h1 className="text-2xl font-bold mb-2">Your order</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Review and edit. Total: {totalItems} item{totalItems !== 1 ? "s" : ""}.
          </p>
          <Card className="rounded-2xl border border-border overflow-hidden">
            <CardContent className="p-0 divide-y divide-border">
              {cart.map((line, index) => (
                <div
                  key={`${line.itemId}-${line.sizeId ?? ""}-${index}`}
                  className="p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {line.name}
                      {line.sizeName ? ` (${line.sizeName})` : ""}
                    </p>
                    {line.priceDisplay && (
                      <p className="text-sm text-muted-foreground">{line.priceDisplay}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => updateQuantity(index, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => updateQuantity(index, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive shrink-0"
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Summary</p>
            <p className="font-semibold mt-1">
              {totalItems} item{totalItems !== 1 ? "s" : ""} selected
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Prices shown per item. Pay at counter or use the option below.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full rounded-xl"
              onClick={() => {
                alert("Payment integration can be added here (e.g. Stripe, Razorpay). For now, show this order at the counter.");
              }}
            >
              Pay or order at counter
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
              onClick={() => setShowBill(false)}
            >
              Back to menu
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 pb-28">
      <div className="max-w-md mx-auto">
        <Link
          href={`/q/${venue.id}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Back
        </Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Our Menu</h1>
          {cart.length > 0 && (
            <Button
              variant="default"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => setShowBill(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              Order ({totalItems})
            </Button>
          )}
        </div>

        {!hasCategories && rows.length === 0 ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border border-border">
              <CardHeader>
                <CardTitle className="text-base">Starters</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                [Menu items — customize in Admin → Settings → Menu]
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border">
              <CardHeader>
                <CardTitle className="text-base">Mains</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                [Mains — customize in Admin → Settings]
              </CardContent>
            </Card>
          </div>
        ) : hasCategories ? (
          <div className="space-y-8">
            {categories.map((cat) => (
              <section key={cat.id}>
                <div className="flex items-center gap-3 mb-4">
                  {cat.imageUrl && (
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>
                <ul className="space-y-3">
                  {cat.items
                    .filter((i) => i.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <li key={item.id}>
                        <Card className="rounded-2xl border border-border overflow-hidden">
                          <div className="flex gap-4 p-4">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="h-24 w-24 rounded-xl object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {item.price != null && item.price !== "" && (
                                <p className="text-sm font-medium mt-2">{item.price}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {(item.sizes ?? []).length > 0 ? (
                                  (item.sizes ?? []).map((sz) => (
                                    <Button
                                      key={sz.id}
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg text-xs"
                                      onClick={() =>
                                        addToCart(cat.id, item, {
                                          id: sz.id,
                                          name: sz.name,
                                          price: sz.price,
                                        })
                                      }
                                    >
                                      {sz.name}
                                      {sz.price ? ` · ${sz.price}` : ""}
                                    </Button>
                                  ))
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() => addToCart(cat.id, item)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map(({ category, item }) => (
              <Card key={item.id} className="rounded-2xl border border-border">
                <div className="flex gap-4 p-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-24 w-24 rounded-xl object-cover shrink-0"
                    />
                  )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  {category.name && (
                    <p className="text-xs text-muted-foreground">{category.name}</p>
                  )}
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  {item.price != null && (
                    <p className="text-sm font-medium mt-2">{item.price}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg mt-2"
                    onClick={() => addToCart(category.id, item)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button asChild variant="outline" className="w-full rounded-xl" size="lg">
            <Link href={`/q/${venue.id}/feedback`}>
              {rewardCta ?? "Give feedback & win a reward 🎁"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
