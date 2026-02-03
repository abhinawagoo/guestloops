import { notFound } from "next/navigation";
import { getVenueWithSettings } from "@/data/demo-venues";
import { MenuClient } from "@/components/menu/menu-client";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = getVenueWithSettings(venueId);
  if (!venue) notFound();

  return <MenuClient venue={venue} />;
}
