import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Venue from "@/models/Venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VenueForm from "@/components/admin/VenueForm";
import { auth } from "@/lib/auth";
import User from "@/models/User";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  await dbConnect();
  const user = await User.findById(session.user.id);
  return user?.role === "admin";
}

export default async function EditVenuePage({ params }: { params: { id: string } }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return <div className="p-8 text-red-500">Unauthorized</div>;

  await dbConnect();
  const venue = await Venue.findById(params.id).lean();

  if (!venue) {
    notFound();
  }

  const serializedVenue = JSON.parse(JSON.stringify(venue));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/venues">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Edit Venue</h1>
          <p className="text-slate-500 text-sm mt-1">Update details for {serializedVenue.name}.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <VenueForm initialData={serializedVenue} />
        </CardContent>
      </Card>
    </div>
  );
}
