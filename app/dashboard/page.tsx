import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserDashboardStats } from "@/actions/user.actions";
import { format } from "date-fns";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, DollarSign, ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await getUserDashboardStats();

  if (!result.success || !result.stats) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats } = result;

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: CalendarDays,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Completed Events",
      value: stats.completedEvents,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Total Spent",
      value: `$${stats.totalSpent.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/50 bg-card/80 backdrop-blur-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/bookings" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {stats.recentUpcoming.length === 0 ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming events.</p>
              <Button asChild className="mt-4">
                <Link href="/venues">Browse Venues</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {stats.recentUpcoming.map((booking: any) => (
              <Link key={booking._id} href={`/dashboard/bookings/${booking._id}`}>
                <Card className="border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/30 transition-all group cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Venue Image */}
                    <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                      {booking.venue?.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={booking.venue.images[0]}
                          alt={booking.venue.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {booking.venue?.name || "Venue"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(booking.eventDate), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {booking.startTime} - {booking.endTime}
                        </span>
                        {booking.venue?.city && (
                          <span className="hidden sm:flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {booking.venue.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={
                        booking.status === "confirmed"
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                          : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                      }
                    >
                      {booking.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
