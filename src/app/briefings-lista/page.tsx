import { BackButton } from "@/components/back-button";
import { Card, CardContent } from "@/components/ui/card";

export default function BriefingsListaPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Briefings
        </h1>
        <p className="text-gray-500">
          Aqui você encontra a lista de briefings de mídia paga ou orgânicos de Marketplace, baseados nos Pontos Fortes de cada um.
        </p>
      </div>

      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">
            Página em desenvolvimento. Em breve você poderá consultar os briefs de campanha aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
