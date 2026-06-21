import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VenueForm from "@/components/admin/VenueForm";

export default function AddVenuePage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/venues">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Add New Venue</h1>
          <p className="text-slate-500 text-sm mt-1">Create a new venue listing for the platform.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <VenueForm />
        </CardContent>
      </Card>
    </div>
  );
}
