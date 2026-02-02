import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReviewsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Review management</h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
          Auto-reply modes and reply styles (Professional, Warm, Apologetic,
          Luxury, Casual)
        </p>
      </div>
      <Card className="admin-card border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Google Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Connect Google Business Profile API to see incoming reviews and use
          AI auto-reply. High ROI: replying to reviews increases Google trust.
        </CardContent>
      </Card>
    </div>
  );
}
