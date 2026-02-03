"use client";

import { useState } from "react";
import type { MenuCategory, MenuCategoryItem, MenuItemSize } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MenuManager({
  categories,
  onSave,
}: {
  categories: MenuCategory[];
  onSave: (categories: MenuCategory[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [local, setLocal] = useState<MenuCategory[]>(() =>
    categories.length > 0 ? categories : []
  );

  const addCategory = () => {
    const cat: MenuCategory = {
      id: newId("cat"),
      name: "New category",
      enabled: true,
      order: local.length,
      items: [],
    };
    const next = [...local, cat].sort((a, b) => a.order - b.order);
    setLocal(next);
    onSave(next);
    setExpandedId(cat.id);
    setEditingCategoryId(cat.id);
  };

  const updateCategory = (id: string, patch: Partial<MenuCategory>) => {
    const next = local.map((c) =>
      c.id === id ? { ...c, ...patch } : c
    );
    setLocal(next);
    onSave(next);
    if (Object.keys(patch).length > 0) setEditingCategoryId(null);
  };

  const removeCategory = (id: string) => {
    const next = local.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i }));
    setLocal(next);
    onSave(next);
    setExpandedId((x) => (x === id ? null : x));
    setEditingCategoryId((x) => (x === id ? null : x));
  };

  const addItem = (categoryId: string) => {
    const cat = local.find((c) => c.id === categoryId);
    if (!cat) return;
    const item: MenuCategoryItem = {
      id: newId("item"),
      name: "New item",
      enabled: true,
      order: cat.items.length,
    };
    const next = local.map((c) =>
      c.id === categoryId
        ? { ...c, items: [...c.items, item].sort((a, b) => a.order - b.order) }
        : c
    );
    setLocal(next);
    onSave(next);
    setEditingItemKey(`${categoryId}-${item.id}`);
  };

  const updateItem = (categoryId: string, itemId: string, patch: Partial<MenuCategoryItem>) => {
    const next = local.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        items: c.items.map((i) =>
          i.id === itemId ? { ...i, ...patch } : i
        ),
      };
    });
    setLocal(next);
    onSave(next);
    if (Object.keys(patch).length > 0) setEditingItemKey(null);
  };

  const removeItem = (categoryId: string, itemId: string) => {
    const next = local.map((c) => {
      if (c.id !== categoryId) return c;
      const items = c.items.filter((i) => i.id !== itemId).map((i, idx) => ({ ...i, order: idx }));
      return { ...c, items };
    });
    setLocal(next);
    onSave(next);
    setEditingItemKey(null);
  };

  const addSize = (categoryId: string, itemId: string) => {
    const cat = local.find((c) => c.id === categoryId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;
    const sizes = item.sizes ?? [];
    const newSize: MenuItemSize = {
      id: newId("size"),
      name: "e.g. Large",
      order: sizes.length,
    };
    updateItem(categoryId, itemId, { sizes: [...sizes, newSize] });
  };

  const updateSize = (
    categoryId: string,
    itemId: string,
    sizeId: string,
    patch: Partial<MenuItemSize>
  ) => {
    const cat = local.find((c) => c.id === categoryId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;
    const sizes = (item.sizes ?? []).map((s) =>
      s.id === sizeId ? { ...s, ...patch } : s
    );
    updateItem(categoryId, itemId, { sizes });
  };

  const removeSize = (categoryId: string, itemId: string, sizeId: string) => {
    const cat = local.find((c) => c.id === categoryId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;
    const sizes = (item.sizes ?? []).filter((s) => s.id !== sizeId).map((s, i) => ({ ...s, order: i }));
    updateItem(categoryId, itemId, { sizes });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add categories (e.g. Dessert) and items under each (e.g. Baklava, Ice cream, Gulab jamun). Add image URL, price, description; enable/disable per category or item.
        </p>
        <Button variant="outline" size="sm" className="rounded-lg shrink-0" onClick={addCategory}>
          <Plus className="h-4 w-4 mr-1" /> Add category
        </Button>
      </div>
      {local.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 rounded-xl border border-dashed border-border">
          No categories yet. Click &quot;Add category&quot; to create one (e.g. Dessert, Mains).
        </p>
      ) : (
        <ul className="space-y-2">
          {local
            .sort((a, b) => a.order - b.order)
            .map((cat) => {
              const expanded = expandedId === cat.id;
              const editingCat = editingCategoryId === cat.id;
              return (
                <li key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/40 transition-colors",
                      !cat.enabled && "opacity-60"
                    )}
                    onClick={() => setExpandedId(expanded ? null : cat.id)}
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {cat.imageUrl && (
                      <img
                        src={cat.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <span className="font-medium flex-1">{cat.name}</span>
                    <Switch
                      checked={cat.enabled}
                      onCheckedChange={(v) => updateCategory(cat.id, { enabled: v })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryId(editingCat ? null : cat.id);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Remove this category and all its items?"))
                          removeCategory(cat.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {editingCat && (
                    <div className="px-3 pb-3 pt-0 border-t border-border space-y-3">
                      <div className="grid gap-2 pt-3">
                        <Label>Name</Label>
                        <Input
                          value={cat.name}
                          onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                          placeholder="e.g. Dessert"
                          className="rounded-lg"
                        />
                        <Label>Description (optional)</Label>
                        <Textarea
                          value={cat.description ?? ""}
                          onChange={(e) => updateCategory(cat.id, { description: e.target.value || undefined })}
                          placeholder="Short description"
                          className="rounded-lg min-h-[60px]"
                        />
                        <Label>Image URL (optional)</Label>
                        <Input
                          value={cat.imageUrl ?? ""}
                          onChange={(e) => updateCategory(cat.id, { imageUrl: e.target.value || undefined })}
                          placeholder="https://..."
                          className="rounded-lg"
                        />
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setEditingCategoryId(null)}>
                        Done
                      </Button>
                    </div>
                  )}
                  {expanded && (
                    <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Items</span>
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => addItem(cat.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Add item
                        </Button>
                      </div>
                      {cat.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No items. Add sub-items (e.g. Baklava, Ice cream).
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {cat.items
                            .sort((a, b) => a.order - b.order)
                            .map((item) => {
                              const itemKey = `${cat.id}-${item.id}`;
                              const editingItem = editingItemKey === itemKey;
                              return (
                                <li
                                  key={item.id}
                                  className={cn(
                                    "rounded-lg border border-border bg-background p-3 space-y-2",
                                    !item.enabled && "opacity-60"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {item.imageUrl && (
                                      <img
                                        src={item.imageUrl}
                                        alt=""
                                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium">{item.name}</span>
                                      {item.price != null && (
                                        <span className="text-muted-foreground text-sm ml-2">
                                          {item.price}
                                        </span>
                                      )}
                                    </div>
                                    <Switch
                                      checked={item.enabled}
                                      onCheckedChange={(v: boolean) => updateItem(cat.id, item.id, { enabled: v })}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingItemKey(editingItem ? null : itemKey)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => {
                                        if (confirm("Remove this item?"))
                                          removeItem(cat.id, item.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {item.description && !editingItem && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}
                                  {editingItem && (
                                    <div className="grid gap-2 pt-2 border-t border-border">
                                      <Label>Name</Label>
                                      <Input
                                        value={item.name}
                                        onChange={(e) => updateItem(cat.id, item.id, { name: e.target.value })}
                                        placeholder="e.g. Baklava"
                                        className="rounded-lg"
                                      />
                                      <Label>Description (optional)</Label>
                                      <Textarea
                                        value={item.description ?? ""}
                                        onChange={(e) =>
                                          updateItem(cat.id, item.id, {
                                            description: e.target.value || undefined,
                                          })
                                        }
                                        placeholder="Short description"
                                        className="rounded-lg min-h-[60px]"
                                      />
                                      <Label>Price (optional)</Label>
                                      <Input
                                        value={item.price ?? ""}
                                        onChange={(e) =>
                                          updateItem(cat.id, item.id, { price: e.target.value || undefined })
                                        }
                                        placeholder="e.g. ₹120 or $5"
                                        className="rounded-lg"
                                      />
                                      <Label>Image URL (optional)</Label>
                                      <Input
                                        value={item.imageUrl ?? ""}
                                        onChange={(e) =>
                                          updateItem(cat.id, item.id, { imageUrl: e.target.value || undefined })
                                        }
                                        placeholder="https://..."
                                        className="rounded-lg"
                                      />
                                      <div className="flex items-center justify-between">
                                        <Label>Sizes (optional, e.g. Half / Full)</Label>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => addSize(cat.id, item.id)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add size
                                        </Button>
                                      </div>
                                      {(item.sizes ?? []).length > 0 && (
                                        <ul className="space-y-1">
                                          {(item.sizes ?? []).map((sz) => (
                                            <li
                                              key={sz.id}
                                              className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1"
                                            >
                                              <Input
                                                value={sz.name}
                                                onChange={(e) =>
                                                  updateSize(cat.id, item.id, sz.id, { name: e.target.value })
                                                }
                                                placeholder="Size name"
                                                className="h-8 rounded text-sm flex-1"
                                              />
                                              <Input
                                                value={sz.price ?? ""}
                                                onChange={(e) =>
                                                  updateSize(cat.id, item.id, sz.id, {
                                                    price: e.target.value || undefined,
                                                  })
                                                }
                                                placeholder="Price"
                                                className="h-8 w-20 rounded text-sm"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                                onClick={() => removeSize(cat.id, item.id, sz.id)}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setEditingItemKey(null)}
                                      >
                                        Done
                                      </Button>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
