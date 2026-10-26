import { MapaSpotsClient } from "@/components/mapa-spots-client";

// Os números chegam ao vivo pela /api/mapa-spots, chamada de dentro do mapa.
export const dynamic = "force-dynamic";

export default function MapaSpotsPage() {
  return <MapaSpotsClient />;
}
