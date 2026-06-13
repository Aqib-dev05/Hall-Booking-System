"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button 
      variant="outline" 
      size="lg" 
      className="gap-2 print:hidden" 
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </Button>
  );
}
