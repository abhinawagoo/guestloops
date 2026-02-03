"use client";

import { useState } from "react";
import type { ServiceCategory, ServiceCategoryItem } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ServicesManager({
  categories,
  onSave,
}: {
  categories: ServiceCategory[];
  onSave: (categories: ServiceCategory[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [local, setLocal] = useState<ServiceCategory[]>(() =>
    categories.length > 0 ? categories : []
  );

  const addCategory = () => {
    const cat: ServiceCategory = {
      id: newId("svc-cat"),
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

  const updateCategory = (id: string, patch: Partial<ServiceCategory>) => {
    const next = local.map((c) => (c.id === id ? { ...c, ...patch } : c));
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
    const item: ServiceCategoryItem = {
      id: newId("svc-item"),
      name: "New service",
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

  const updateItem = (
    categoryId: string,
    itemId: string,
    patch: Partial<ServiceCategoryItem>
  ) => {
    const next = local.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
      };
    });
    setLocal(next);
    onSave(next);
    if (Object.keys(patch).length > 0) setEditingItemKey(null);
  };

  const removeItem = (categoryId: string, itemId: string) => {
    const next = local.map((c) => {
      if (c.id !== categoryId) return c;
      const items = c.items
        .filter((i) => i.id !== itemId)
        .map((i, idx) => ({ ...i, order: idx }));
      return { ...c, items };
    });
    setLocal(next);
    onSave(next);
    setEditingItemKey(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add service categories (e.g. Spa, Room Service) and items under each with image, price, and description. Enable/disable per category or item.
        </p>
        <Button variant="outline" size="sm" className="rounded-lg shrink-0" onClick={addCategory}>
          <Plus className="h-4 w-4 mr-1" /> Add category
        </Button>
      </div>
      {local.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 rounded-xl border border-dashed border-border">
          No categories yet. Click &quot;Add category&quot; (e.g. Spa, Room Service).
        </p>
      ) : (
        <ul className="space-y-2">
          {local
            .sort((a, b) => a.order - b.order)
            .map((cat) => {
              const expanded = expandedId === cat.id;
              const editingCat = editingCategoryId === cat.id;
              return (
                <li
                  key={cat.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
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
                          placeholder="e.g. Spa"
                          className="rounded-lg"
                        />
                        <Label>Description (optional)</Label>
                        <Textarea
                          value={cat.description ?? ""}
                          onChange={(e) =>
                            updateCategory(cat.id, {
                              description: e.target.value || undefined,
                            })
                          }
                          placeholder="Short description"
                          className="rounded-lg min-h-[60px]"
                        />
                        <Label>Image URL (optional)</Label>
                        <Input
                          value={cat.imageUrl ?? ""}
                          onChange={(e) =>
                            updateCategory(cat.id, { imageUrl: e.target.value || undefined })
                          }
                          placeholder="https://..."
                          className="rounded-lg"
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingCategoryId(null)}
                      >
                        Done
                      </Button>
                    </div>
                  )}
                  {expanded && (
                    <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          Items
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => addItem(cat.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add item
                        </Button>
                      </div>
                      {cat.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No items. Add services (e.g. Massage, Facial).
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
                                      onCheckedChange={(v) =>
                                        updateItem(cat.id, item.id, { enabled: v })
                                      }
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        setEditingItemKey(editingItem ? null : itemKey)
                                      }
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
                                    <p className="text-sm text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}
                                  {editingItem && (
                                    <div className="grid gap-2 pt-2 border-t border-border">
                                      <Label>Name</Label>
                                      <Input
                                        value={item.name}
                                        onChange={(e) =>
                                          updateItem(cat.id, item.id, { name: e.target.value })
                                        }
                                        placeholder="e.g. Swedish Massage"
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
                                          updateItem(cat.id, item.id, {
                                            price: e.target.value || undefined,
                                          })
                                        }
                                        placeholder="e.g. ₹1,500 or $30"
                                        className="rounded-lg"
                                      />
                                      <Label>Image URL (optional)</Label>
                                      <Input
                                        value={item.imageUrl ?? ""}
                                        onChange={(e) =>
                                          updateItem(cat.id, item.id, {
                                            imageUrl: e.target.value || undefined,
                                          })
                                        }
                                        placeholder="https://..."
                                        className="rounded-lg"
                                      />
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
