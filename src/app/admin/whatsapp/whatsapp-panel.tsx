"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppSettings } from "@/components/admin/whatsapp-settings";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED" | "IN_APPEAL" | "PENDING_DELETION";
type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

type TemplateComponent =
  | { type: "HEADER"; format: "TEXT"; text: string }
  | { type: "BODY"; text: string }
  | { type: "FOOTER"; text: string }
  | { type: "BUTTONS"; buttons: TemplateButton[] };

type TemplateButton = {
  type: "URL" | "QUICK_REPLY" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone_number?: string;
};

type WaTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  components: TemplateComponent[];
  rejection_reason?: string | null;
  created_at: string;
};

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  consent_status: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVars(text: string): number[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  const indices = new Set(matches.map((m) => parseInt(m.replace(/\{\{|\}\}/g, ""))));
  return Array.from(indices).sort((a, b) => a - b);
}

function statusColor(s: TemplateStatus) {
  switch (s) {
    case "APPROVED": return "bg-green-500/15 text-green-700 border-green-500/30";
    case "REJECTED": return "bg-red-500/15 text-red-700 border-red-500/30";
    case "PENDING": return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
    case "PAUSED": return "bg-orange-500/15 text-orange-700 border-orange-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}

function getBodyText(components: TemplateComponent[]): string {
  const body = components.find((c) => c.type === "BODY") as { type: "BODY"; text: string } | undefined;
  return body?.text ?? "";
}

// ─── Template Builder ─────────────────────────────────────────────────────────

type BuilderState = {
  name: string;
  category: TemplateCategory;
  language: string;
  headerEnabled: boolean;
  headerText: string;
  bodyText: string;
  footerEnabled: boolean;
  footerText: string;
  buttonEnabled: boolean;
  buttonType: "URL" | "QUICK_REPLY" | "PHONE_NUMBER";
  buttonText: string;
  buttonUrl: string;
  buttonPhone: string;
};

const defaultBuilder: BuilderState = {
  name: "",
  category: "MARKETING",
  language: "en_US",
  headerEnabled: false,
  headerText: "",
  bodyText: "",
  footerEnabled: false,
  footerText: "",
  buttonEnabled: false,
  buttonType: "URL",
  buttonText: "",
  buttonUrl: "",
  buttonPhone: "",
};

function TemplateBuilder({
  onCreated,
  onCancel,
}: {
  onCreated: (t: WaTemplate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BuilderState>(defaultBuilder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof BuilderState, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleNameInput = (v: string) =>
    set("name", v.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/__+/g, "_"));

  function buildComponents(): TemplateComponent[] {
    const comps: TemplateComponent[] = [];
    if (form.headerEnabled && form.headerText.trim()) {
      comps.push({ type: "HEADER", format: "TEXT", text: form.headerText.trim() });
    }
    if (form.bodyText.trim()) {
      comps.push({ type: "BODY", text: form.bodyText.trim() });
    }
    if (form.footerEnabled && form.footerText.trim()) {
      comps.push({ type: "FOOTER", text: form.footerText.trim() });
    }
    if (form.buttonEnabled && form.buttonText.trim()) {
      const btn: TemplateButton =
        form.buttonType === "URL"
          ? { type: "URL", text: form.buttonText.trim(), url: form.buttonUrl.trim() }
          : form.buttonType === "PHONE_NUMBER"
          ? { type: "PHONE_NUMBER", text: form.buttonText.trim(), phone_number: form.buttonPhone.trim() }
          : { type: "QUICK_REPLY", text: form.buttonText.trim() };
      comps.push({ type: "BUTTONS", buttons: [btn] });
    }
    return comps;
  }

  const handleSubmit = async () => {
    if (!form.name) return setError("Template name is required");
    if (!form.bodyText.trim()) return setError("Body text is required");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          language: form.language,
          components: buildComponents(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create template");
      onCreated(data.template);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const bodyVars = extractVars(form.bodyText);
  const headerVars = form.headerEnabled ? extractVars(form.headerText) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 rounded-2xl border border-border bg-muted/20 p-5"
    >
      <h3 className="font-semibold text-base">New Template</h3>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Template name *</Label>
          <Input
            placeholder="review_request"
            value={form.name}
            onChange={(e) => handleNameInput(e.target.value)}
            className="rounded-lg font-mono text-sm"
          />
          <p className="text-[11px] text-muted-foreground">lowercase, underscores only</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category *</Label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as TemplateCategory)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utility</option>
            <option value="AUTHENTICATION">Authentication</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Language *</Label>
          <select
            value={form.language}
            onChange={(e) => set("language", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="en_US">English (US)</option>
            <option value="en_GB">English (UK)</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="gu">Gujarati</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="bn">Bengali</option>
            <option value="pa">Punjabi</option>
          </select>
        </div>
      </div>

      {/* Header (optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="header-toggle"
            checked={form.headerEnabled}
            onChange={(e) => set("headerEnabled", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="header-toggle" className="text-xs cursor-pointer">
            Header (optional)
          </Label>
        </div>
        {form.headerEnabled && (
          <div className="space-y-1">
            <Input
              placeholder="Welcome to {{1}}!"
              value={form.headerText}
              onChange={(e) => set("headerText", e.target.value)}
              className="rounded-lg text-sm"
            />
            {headerVars.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {headerVars.length} variable{headerVars.length > 1 ? "s" : ""}: {headerVars.map((v) => `{{${v}}}`).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Body (required) */}
      <div className="space-y-1.5">
        <Label className="text-xs">Body *</Label>
        <Textarea
          placeholder="Hi {{1}}, thank you for staying at {{2}}! We'd love to hear your feedback. It only takes 30 seconds."
          value={form.bodyText}
          onChange={(e) => set("bodyText", e.target.value)}
          rows={4}
          className="rounded-lg text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Use {"{{"} 1 {"}}"}, {"{{"} 2 {"}}"} etc. for personalised variables (name, venue, etc.)
          {bodyVars.length > 0 && ` — ${bodyVars.length} variable${bodyVars.length > 1 ? "s" : ""} detected`}
        </p>
      </div>

      {/* Footer (optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="footer-toggle"
            checked={form.footerEnabled}
            onChange={(e) => set("footerEnabled", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="footer-toggle" className="text-xs cursor-pointer">
            Footer (optional)
          </Label>
        </div>
        {form.footerEnabled && (
          <Input
            placeholder="Powered by GuestLoops"
            value={form.footerText}
            onChange={(e) => set("footerText", e.target.value)}
            className="rounded-lg text-sm"
          />
        )}
      </div>

      {/* Button (optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="btn-toggle"
            checked={form.buttonEnabled}
            onChange={(e) => set("buttonEnabled", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="btn-toggle" className="text-xs cursor-pointer">
            Button (optional)
          </Label>
        </div>
        {form.buttonEnabled && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Button type</Label>
              <select
                value={form.buttonType}
                onChange={(e) => set("buttonType", e.target.value as "URL" | "QUICK_REPLY" | "PHONE_NUMBER")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="URL">URL (link)</option>
                <option value="QUICK_REPLY">Quick Reply</option>
                <option value="PHONE_NUMBER">Phone Number</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Button label *</Label>
              <Input
                placeholder="Leave a Review"
                value={form.buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                className="rounded-lg text-sm"
              />
            </div>
            {form.buttonType === "URL" && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input
                  placeholder="https://g.page/r/your-place/review"
                  value={form.buttonUrl}
                  onChange={(e) => set("buttonUrl", e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
            )}
            {form.buttonType === "PHONE_NUMBER" && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Phone number (E.164)</Label>
                <Input
                  placeholder="+919876543210"
                  value={form.buttonPhone}
                  onChange={(e) => set("buttonPhone", e.target.value)}
                  className="rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Preview */}
      {form.bodyText.trim() && (
        <div className="rounded-xl border border-border bg-[#ece5dd] p-3 dark:bg-[#1a2229]">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Preview</p>
          <div className="rounded-xl bg-white dark:bg-[#202c33] px-3 py-2.5 shadow-sm max-w-xs space-y-1">
            {form.headerEnabled && form.headerText && (
              <p className="text-sm font-semibold text-foreground">{form.headerText}</p>
            )}
            <p className="text-sm text-foreground whitespace-pre-wrap">{form.bodyText}</p>
            {form.footerEnabled && form.footerText && (
              <p className="text-xs text-muted-foreground">{form.footerText}</p>
            )}
            {form.buttonEnabled && form.buttonText && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-blue-500 font-medium text-center py-1">{form.buttonText}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button className="rounded-xl" onClick={handleSubmit} disabled={saving}>
          {saving ? "Submitting to Meta…" : "Submit Template"}
        </Button>
        <Button variant="ghost" className="rounded-xl" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (sync = false) => {
    sync ? setSyncing(true) : setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/templates${sync ? "?sync=1" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load templates");
      setTemplates(data.templates ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = async (t: WaTemplate) => {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/admin/whatsapp/templates/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Delete failed");
      }
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!creating && (
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" onClick={() => setCreating(true)}>
            + New Template
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => fetchTemplates(true)}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "Sync from Meta"}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <TemplateBuilder
            onCreated={(t) => {
              setTemplates((prev) => [t, ...prev]);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No templates yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first template to start sending messages to guests.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => {
            const body = getBodyText(t.components);
            const buttons = (t.components.find((c) => c.type === "BUTTONS") as { type: "BUTTONS"; buttons: TemplateButton[] } | undefined)?.buttons ?? [];
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-sm">{t.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusColor(t.status)}`}>
                        {t.status}
                      </span>
                      <Badge variant="outline" className="rounded-md text-[11px]">{t.category}</Badge>
                      <Badge variant="outline" className="rounded-md text-[11px]">{t.language}</Badge>
                    </div>
                    {t.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">Rejected: {t.rejection_reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(t)}
                    disabled={deletingId === t.id}
                  >
                    {deletingId === t.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
                {body && (
                  <p className="text-sm text-muted-foreground line-clamp-2 border-t border-border pt-2">
                    {body}
                  </p>
                )}
                {buttons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {buttons.map((b, i) => (
                      <span key={i} className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600">
                        {b.type === "URL" ? "🔗" : b.type === "QUICK_REPLY" ? "↩" : "📞"} {b.text}
                      </span>
                    ))}
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Send Tab ─────────────────────────────────────────────────────────────────

function SendTab() {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState<WaTemplate | null>(null);
  const [recipientMode, setRecipientMode] = useState<"contact" | "manual">("contact");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; failCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/whatsapp/templates")
      .then((r) => r.json())
      .then((d) => setTemplates((d.templates ?? []).filter((t: WaTemplate) => t.status === "APPROVED")))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));

    fetch("/api/admin/contacts?consent_status=opted_in&limit=200")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []))
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, []);

  const handleTemplateChange = (id: string) => {
    const t = templates.find((x) => x.id === id) ?? null;
    setSelectedTemplate(t);
    setVarValues({});
    setResult(null);
    setError(null);
  };

  function buildComponents() {
    if (!selectedTemplate) return [];
    const comps: { type: "header" | "body"; parameters: { type: "text"; text: string }[] }[] = [];
    const headerComp = selectedTemplate.components.find((c) => c.type === "HEADER") as { type: "HEADER"; format: string; text?: string } | undefined;
    const bodyComp = selectedTemplate.components.find((c) => c.type === "BODY") as { type: "BODY"; text: string } | undefined;

    if (headerComp?.text) {
      const vars = extractVars(headerComp.text);
      if (vars.length > 0) {
        comps.push({
          type: "header",
          parameters: vars.map((v) => ({ type: "text", text: varValues[`header_${v}`] ?? "" })),
        });
      }
    }
    if (bodyComp?.text) {
      const vars = extractVars(bodyComp.text);
      if (vars.length > 0) {
        comps.push({
          type: "body",
          parameters: vars.map((v) => ({ type: "text", text: varValues[`body_${v}`] ?? "" })),
        });
      }
    }
    return comps;
  }

  const handleSend = async () => {
    if (!selectedTemplate) return setError("Select a template");
    const phone =
      recipientMode === "manual"
        ? manualPhone
        : contacts.find((c) => c.id === selectedContactId)?.phone ?? "";
    if (!phone) return setError("Select a recipient or enter a phone number");

    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: selectedTemplate.name,
          languageCode: selectedTemplate.language,
          to: phone,
          components: buildComponents(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setResult({ sentCount: data.sentCount, failCount: data.failCount });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const approvedTemplates = templates;
  const headerComp = selectedTemplate?.components.find((c) => c.type === "HEADER") as { type: "HEADER"; format: string; text?: string } | undefined;
  const bodyComp = selectedTemplate?.components.find((c) => c.type === "BODY") as { type: "BODY"; text: string } | undefined;
  const headerVars = headerComp?.text ? extractVars(headerComp.text) : [];
  const bodyVars = bodyComp?.text ? extractVars(bodyComp.text) : [];
  const hasVars = headerVars.length > 0 || bodyVars.length > 0;

  return (
    <div className="space-y-5 max-w-xl">
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          {result.sentCount > 0 ? `Sent successfully to ${result.sentCount} recipient${result.sentCount > 1 ? "s" : ""}.` : ""}
          {result.failCount > 0 ? ` ${result.failCount} failed.` : ""}
        </div>
      )}

      {/* Template select */}
      <div className="space-y-1.5">
        <Label className="text-xs">Template *</Label>
        {loadingTemplates ? (
          <p className="text-sm text-muted-foreground">Loading templates…</p>
        ) : approvedTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved templates yet. Create a template and wait for Meta approval.
          </p>
        ) : (
          <select
            value={selectedTemplate?.id ?? ""}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select template…</option>
            {approvedTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.language})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Template preview */}
      {selectedTemplate && (
        <div className="rounded-xl border border-border bg-[#ece5dd] p-3 dark:bg-[#1a2229]">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Template preview</p>
          <div className="rounded-xl bg-white dark:bg-[#202c33] px-3 py-2.5 shadow-sm max-w-xs space-y-1">
            {headerComp?.text && <p className="text-sm font-semibold">{headerComp.text}</p>}
            {bodyComp?.text && <p className="text-sm whitespace-pre-wrap">{bodyComp.text}</p>}
          </div>
        </div>
      )}

      {/* Variable values */}
      {selectedTemplate && hasVars && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fill in variables</p>
          {headerVars.map((v) => (
            <div key={`header_${v}`} className="space-y-1.5">
              <Label className="text-xs">Header variable {"{{"}{v}{"}}"}</Label>
              <Input
                placeholder={`Value for header {{${v}}}`}
                value={varValues[`header_${v}`] ?? ""}
                onChange={(e) => setVarValues((prev) => ({ ...prev, [`header_${v}`]: e.target.value }))}
                className="rounded-lg text-sm"
              />
            </div>
          ))}
          {bodyVars.map((v) => (
            <div key={`body_${v}`} className="space-y-1.5">
              <Label className="text-xs">Body variable {"{{"}{v}{"}}"}</Label>
              <Input
                placeholder={`Value for body {{${v}}}`}
                value={varValues[`body_${v}`] ?? ""}
                onChange={(e) => setVarValues((prev) => ({ ...prev, [`body_${v}`]: e.target.value }))}
                className="rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Recipient */}
      {selectedTemplate && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setRecipientMode("contact")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                recipientMode === "contact"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              From contacts
            </button>
            <button
              onClick={() => setRecipientMode("manual")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                recipientMode === "manual"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Enter number
            </button>
          </div>

          {recipientMode === "contact" ? (
            loadingContacts ? (
              <p className="text-sm text-muted-foreground">Loading contacts…</p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No opted-in contacts. Add contacts and get their consent first.</p>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Contact (opted-in only)</Label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select contact…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ? `${c.name} — ` : ""}{c.phone}
                    </option>
                  ))}
                </select>
              </div>
            )
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Phone number (with country code)</Label>
              <Input
                placeholder="+919876543210"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>
          )}
        </div>
      )}

      {selectedTemplate && (
        <Button
          className="rounded-xl w-full sm:w-auto"
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? "Sending…" : "Send Message"}
        </Button>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function WhatsAppPanel() {
  return (
    <Tabs defaultValue="templates">
      <TabsList className="mb-2">
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="send">Send</TabsTrigger>
        <TabsTrigger value="connection">Connection</TabsTrigger>
      </TabsList>

      <TabsContent value="templates">
        <Card className="admin-card border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Message Templates</CardTitle>
            <CardDescription className="text-muted-foreground">
              Templates must be approved by Meta before use. PENDING templates typically take a few minutes to hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplatesTab />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="send">
        <Card className="admin-card border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Send Message</CardTitle>
            <CardDescription className="text-muted-foreground">
              Send an approved template to a guest. Only opted-in contacts can receive messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendTab />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="connection">
        <WhatsAppSettings />
      </TabsContent>
    </Tabs>
  );
}
