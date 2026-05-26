import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = "/", label = "Voltar ao menu" }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 mb-4">
        <ArrowLeft className="w-4 h-4" />
        {label}
      </Button>
    </Link>
  );
}
