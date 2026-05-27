import { BackButton } from "@/components/back-button";
import { Card, CardContent } from "@/components/ui/card";

export default function PontosFortesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Pontos fortes e informações para briefing
        </h1>
        <p className="text-gray-500">
          Aqui você encontra todos os pontos fortes de cada empreendimento, os do's e dont's e perfil de hóspede de cada um.
        </p>
      </div>

      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">
            Página em desenvolvimento. Em breve você poderá consultar os pontos fortes dos empreendimentos aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
