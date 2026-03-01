"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  consent_status: string;
  consent_source: string | null;
  created_at: string;
  last_interaction: string | null;
};

export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [consentFilter, setConsentFilter] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (consentFilter) params.set("consent_status", consentFilter);
    params.set("limit", "50");
    try {
      const res = await fetch(`/api/admin/contacts?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setContacts(data.contacts ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError((e as Error).message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search, consentFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = async () => {
    const phone = newPhone.replace(/\D/g, "").slice(-15);
    if (phone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim() || undefined,
          phone: newPhone,
          consent_status: "pending",
          consent_source: "manual",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setNewName("");
      setNewPhone("");
      setAdding(false);
      fetchContacts();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleOptOut = async (contact: Contact) => {
    try {
      const res = await fetch("/api/admin/contacts/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: contact.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      fetchContacts();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchContacts();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/contacts/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      fetchContacts();
      alert(`Imported ${data.imported ?? 0} contacts`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.length >= 10) return `+${d.slice(-13)}`;
    return p;
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Add & import</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add contacts manually or import from CSV (name, phone)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!adding ? (
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={() => setAdding(true)}>
                + Add contact
              </Button>
              <Label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50">
                  {importing ? "Importing…" : "Import CSV"}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleImport}
                  disabled={importing}
                />
              </Label>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="space-y-1">
                <Label className="text-xs">Name (optional)</Label>
                <Input
                  placeholder="Guest name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="max-w-[180px] rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone *</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="max-w-[180px] rounded-lg"
                />
              </div>
              <Button size="sm" className="rounded-lg" onClick={handleAdd}>
                Save
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => { setAdding(false); setNewName(""); setNewPhone(""); setError(null); }}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Contacts ({total})</CardTitle>
          <CardDescription className="text-muted-foreground">
            Contacts with consent tracking. Only opted-in contacts can receive WhatsApp messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-[240px] rounded-xl"
            />
            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              className="rounded-xl border border-input bg-background px-4 py-2 text-sm"
            >
              <option value="">All consent</option>
              <option value="opted_in">Opted in</option>
              <option value="pending">Pending</option>
              <option value="opted_out">Opted out</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8">Loading…</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">
              No contacts yet. Add manually, import CSV, or capture from feedback forms.
            </p>
          ) : (
            <ul className="space-y-2">
              {contacts.map((c) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{c.name || "—"}</p>
                    <p className="text-sm text-muted-foreground font-mono">{formatPhone(c.phone)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        variant={c.consent_status === "opted_in" ? "default" : c.consent_status === "opted_out" ? "destructive" : "secondary"}
                        className="rounded-md text-xs"
                      >
                        {c.consent_status}
                      </Badge>
                      {c.consent_source && (
                        <Badge variant="outline" className="rounded-md text-xs">
                          {c.consent_source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    Last: {formatDate(c.last_interaction ?? c.created_at)}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.consent_status !== "opted_out" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => handleOptOut(c)}
                      >
                        Opt out
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
