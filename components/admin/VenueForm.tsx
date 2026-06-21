"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createVenue, updateVenue } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface VenueFormProps {
  initialData?: any;
}

export default function VenueForm({ initialData }: VenueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    city: initialData?.city || "",
    capacity: initialData?.capacity || "",
    pricePerHour: initialData?.pricePerHour || "",
    category: initialData?.category || "",
    amenities: initialData?.amenities?.join(", ") || "",
    images: initialData?.images?.join(", ") || "",
    isAvailable: initialData?.isAvailable ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.category || !formData.capacity || !formData.pricePerHour) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      pricePerHour: Number(formData.pricePerHour),
      amenities: formData.amenities.split(",").map((s: string) => s.trim()).filter(Boolean),
      images: formData.images.split(",").map((s: string) => s.trim()).filter(Boolean),
    };

    startTransition(async () => {
      let res;
      if (initialData?._id) {
        res = await updateVenue(initialData._id, payload);
      } else {
        res = await createVenue(payload);
      }

      if (res.success) {
        toast.success(initialData ? "Venue updated successfully" : "Venue created successfully");
        router.push("/admin/venues");
        router.refresh();
      } else {
        toast.error("Operation failed", { description: res.error });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Venue Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(val) => setFormData({ ...formData, category: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="party">Party</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="concert">Concert</SelectItem>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Address / Location *</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity (Guests) *</Label>
          <Input id="capacity" name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerHour">Price Per Hour ($) *</Label>
          <Input id="pricePerHour" name="pricePerHour" type="number" min="0" value={formData.pricePerHour} onChange={handleChange} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          rows={4} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amenities">Amenities (Comma-separated)</Label>
        <Input 
          id="amenities" 
          name="amenities" 
          placeholder="e.g. WiFi, Parking, AC, Catering" 
          value={formData.amenities} 
          onChange={handleChange} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">Image URLs (Comma-separated)</Label>
        <Textarea 
          id="images" 
          name="images" 
          placeholder="https://image1.com/img.jpg, https://image2.com/img.jpg" 
          value={formData.images} 
          onChange={handleChange} 
          rows={2} 
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="isAvailable" 
          checked={formData.isAvailable} 
          onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <Label htmlFor="isAvailable" className="font-normal cursor-pointer">
          Venue is active and available for bookings
        </Label>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initialData ? "Save Changes" : "Create Venue"}
        </Button>
      </div>
    </form>
  );
}
