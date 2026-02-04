import { notFound } from "next/navigation";
import { getVenueWithSettingsAsync } from "@/data/demo-venues";
import { MenuClient } from "@/components/menu/menu-client";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = await getVenueWithSettingsAsync(venueId);
  if (!venue) notFound();

  return <MenuClient venue={venue} />;
}
