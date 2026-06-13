"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "wedding", label: "Wedding" },
  { value: "party", label: "Party" },
  { value: "corporate", label: "Corporate" },
  { value: "birthday", label: "Birthday" },
  { value: "concert", label: "Concert" },
];

const CAPACITY_RANGES = [
  { value: "all", label: "Any Capacity" },
  { value: "small", label: "Under 50 guests" },
  { value: "medium", label: "50 – 100 guests" },
  { value: "large", label: "100 – 200 guests" },
  { value: "xlarge", label: "200+ guests" },
];

const PRICE_MIN = 0;
const PRICE_MAX = 5000;

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state synced to URL search params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [capacity, setCapacity] = useState(searchParams.get("capacity") || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice")) || PRICE_MIN,
    Number(searchParams.get("maxPrice")) || PRICE_MAX,
  ]);

  const [showFilters, setShowFilters] = useState(false);

  // Count active filters
  const activeFilterCount = [
    category !== "all",
    capacity !== "all",
    priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX,
  ].filter(Boolean).length;

  // Push filters to URL search params
  const updateSearchParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (
          !value ||
          value === "all" ||
          (key === "minPrice" && value === String(PRICE_MIN)) ||
          (key === "maxPrice" && value === String(PRICE_MAX))
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchParams({ search });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleCategoryChange(value: string) {
    setCategory(value);
    updateSearchParams({ category: value });
  }

  function handleCapacityChange(value: string) {
    setCapacity(value);
    updateSearchParams({ capacity: value });
  }

  function handlePriceChange(value: number[]) {
    setPriceRange([value[0], value[1]]);
  }

  function handlePriceCommit(value: number[]) {
    updateSearchParams({
      minPrice: String(value[0]),
      maxPrice: String(value[1]),
    });
  }

  function clearAllFilters() {
    setSearch("");
    setCategory("all");
    setCapacity("all");
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  return (
    <div className="space-y-4">
      {/* Top Row: Search + Filter Toggle */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="venue-search"
            placeholder="Search venues by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10 bg-background/50 border-border/50 focus:bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 gap-2 flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Expanded Filter Panel */}
      <div
        className={`grid gap-4 overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Category
                </label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger
                    id="venue-category"
                    className="h-10 bg-background/50 border-border/50"
                  >
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Capacity
                </label>
                <Select value={capacity} onValueChange={handleCapacityChange}>
                  <SelectTrigger
                    id="venue-capacity"
                    className="h-10 bg-background/50 border-border/50"
                  >
                    <SelectValue placeholder="Any Capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPACITY_RANGES.map((cap) => (
                      <SelectItem key={cap.value} value={cap.value}>
                        {cap.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Price Range
                  </label>
                  <span className="text-sm font-medium text-primary">
                    ${priceRange[0].toLocaleString()} – $
                    {priceRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="venue-price-range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={50}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  onValueCommit={handlePriceCommit}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${PRICE_MIN}</span>
                  <span>${PRICE_MAX.toLocaleString()}+</span>
                </div>
              </div>
            </div>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end border-t border-border/50 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex justify-center">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
