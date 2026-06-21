"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, MapPin, Loader2, Search } from "lucide-react";
import { getAllVenuesAdmin, deleteVenue } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVenues = async () => {
    setLoading(true);
    const res = await getAllVenuesAdmin();
    if (res.success) {
      setVenues(res.venues);
      setFilteredVenues(res.venues);
    } else {
      toast.error("Failed to load venues");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredVenues(venues);
    } else {
      const q = search.toLowerCase();
      setFilteredVenues(venues.filter(v => 
        v.name.toLowerCase().includes(q) || 
        v.city.toLowerCase().includes(q)
      ));
    }
  }, [search, venues]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await deleteVenue(id);
    if (res.success) {
      toast.success("Venue deleted successfully");
      fetchVenues();
    } else {
      toast.error("Failed to delete venue", { description: res.error });
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Venues</h1>
          <p className="text-slate-500 mt-1">Manage platform venues.</p>
        </div>
        <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/admin/venues/new">
            <Plus className="h-4 w-4" /> Add New Venue
          </Link>
        </Button>
      </div>

      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 w-full max-w-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search venues..." 
          className="border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead>Venue Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price/Hr</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : filteredVenues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  No venues found.
                </TableCell>
              </TableRow>
            ) : (
              filteredVenues.map((venue) => (
                <TableRow key={venue._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        {venue.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={venue.images[0]} alt={venue.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{venue.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {venue.city}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {venue.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${venue.pricePerHour}
                  </TableCell>
                  <TableCell>
                    {venue.isAvailable ? (
                      <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Link href={`/admin/venues/${venue._id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" disabled={deletingId === venue._id}>
                            {deletingId === venue._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Venue?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{venue.name}</strong>? This action cannot be undone. 
                              Note: This may cause errors if there are active bookings attached to this venue.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(venue._id)} className="bg-red-600 hover:bg-red-700 text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
