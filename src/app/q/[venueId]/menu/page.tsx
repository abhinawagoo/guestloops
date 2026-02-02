import { notFound } from "next/navigation";
import Link from "next/link";
import { getVenueWithSettings } from "@/data/demo-venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = getVenueWithSettings(venueId);
  if (!venue) notFound();

  const items = venue.settings.menuItems
    .slice()
    .sort((a, b) => a.order - b.order);
  const rewardCta = venue.settings.uiText.rewardCta ?? venue.rewardCta;

  return (
    <main className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-md mx-auto">
        <Link
          href={`/q/${venueId}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mb-6">Our Menu</h1>
        {items.length === 0 ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Starters</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                [Menu items — customize in Admin → Settings]
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mains</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                [Mains — customize in Admin → Settings]
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  {item.category && (
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  )}
                </CardHeader>
                {(item.description || item.price) && (
                  <CardContent className="text-sm text-muted-foreground">
                    {item.description}
                    {item.price && <span className="block mt-1">{item.price}</span>}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
        <div className="mt-8">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/q/${venueId}/feedback`}>
              {rewardCta ?? "Give feedback & win a reward 🎁"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
