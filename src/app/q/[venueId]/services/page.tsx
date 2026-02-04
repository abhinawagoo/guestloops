import { notFound } from "next/navigation";
import Link from "next/link";
import { getVenueWithSettingsAsync } from "@/data/demo-venues";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = await getVenueWithSettingsAsync(venueId);
  if (!venue) notFound();

  const categories =
    venue.settings.serviceCategories
      ?.filter((c) => c.enabled)
      .sort((a, b) => a.order - b.order) ?? [];
  const legacyItems = (venue.settings.serviceItems ?? []).slice().sort((a, b) => a.order - b.order);
  const hasCategories = categories.length > 0;
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
        <h1 className="text-2xl font-bold mb-6">Services</h1>

        {hasCategories ? (
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
                      <Card key={item.id} className="rounded-2xl border border-border overflow-hidden">
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
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            {item.price != null && item.price !== "" && (
                              <p className="text-sm font-medium mt-2">{item.price}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        ) : legacyItems.length > 0 ? (
          <div className="space-y-4">
            {legacyItems.map((item) => (
              <Card key={item.id} className="rounded-2xl border border-border">
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
        ) : (
          <div className="space-y-4">
            {["Spa", "Room Service", "Breakfast", "Laundry", "Concierge"].map((s) => (
              <Card key={s} className="rounded-2xl border border-border">
                <CardHeader>
                  <CardTitle className="text-base">{s}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  [Service details — customize in Admin → Settings → Services]
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button asChild variant="outline" className="w-full rounded-xl" size="lg">
            <Link href={`/q/${venueId}/feedback`}>
              {rewardCta ?? "Give feedback & win a reward 🎁"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
