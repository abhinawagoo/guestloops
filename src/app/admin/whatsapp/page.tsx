import { WhatsAppPanel } from "./whatsapp-panel";

export const dynamic = "force-dynamic";

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-muted-foreground mt-1">
          Create message templates, send to guests, and manage your WhatsApp Business connection.
        </p>
      </div>
      <WhatsAppPanel />
    </div>
  );
}
