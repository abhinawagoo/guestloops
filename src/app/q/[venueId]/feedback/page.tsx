import { notFound } from "next/navigation";
import Link from "next/link";
import { getVenueWithSettings } from "@/data/demo-venues";
import { FeedbackFlow } from "./feedback-flow";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = getVenueWithSettings(venueId);
  if (!venue) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 pt-8">
        <Link
          href={`/q/${venueId}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block w-fit"
        >
          ← Back
        </Link>
        <FeedbackFlow venue={venue} />
      </div>
    </main>
  );
}
