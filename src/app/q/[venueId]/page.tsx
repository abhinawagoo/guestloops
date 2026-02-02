import { notFound } from "next/navigation";
import { getVenueWithSettings } from "@/data/demo-venues";
import { QRLanding } from "./qr-landing";

export default async function QRPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = getVenueWithSettings(venueId);
  if (!venue) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <QRLanding venue={venue} />
    </main>
  );
}
