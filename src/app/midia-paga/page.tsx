import { BackButton } from "@/components/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function MidiaPagaPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Análise de Mídia Paga
        </h1>
        <p className="text-gray-500">
          Análise e acompanhamento de campanhas de mídia paga
        </p>
      </div>

      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            Página em desenvolvimento. Em breve você poderá acompanhar suas campanhas de mídia paga aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}