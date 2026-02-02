import { notFound } from "next/navigation";
import Link from "next/link";
import { getVenueWithSettings } from "@/data/demo-venues";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = getVenueWithSettings(venueId);
  if (!venue) notFound();

  const items = venue.settings.serviceItems
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <main className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-md mx-auto">
        <Link
          href={`/q/${venueId}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mb-6">Services</h1>
        {items.length === 0 ? (
          <div className="space-y-4">
            {["Spa", "Room Service", "Breakfast", "Laundry", "Concierge"].map((s) => (
              <Card key={s}>
                <CardHeader>
                  <CardTitle className="text-base">{s}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  [Service details — customize in Settings]
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </CardHeader>
                {item.description && (
                  <CardContent className="text-sm text-muted-foreground">
                    {item.description}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
        <div className="mt-8">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/q/${venueId}/feedback`}>
              {venue.settings.uiText.rewardCta ?? "Give feedback & win a reward 🎁"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
