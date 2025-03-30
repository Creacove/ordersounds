
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Beat } from "@/types";

interface TopSellingBeatsProps {
  beats: Beat[];
}

export function TopSellingBeats({ beats }: TopSellingBeatsProps) {
  const navigate = useNavigate();

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Beats</CardTitle>
        <CardDescription>Your best performers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {beats.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven't uploaded any beats yet. Go to Upload Beat to get started.
            </p>
          ) : (
            beats.map((beat, index) => (
              <div 
                key={beat.id} 
                className="flex items-center gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                onClick={() => handleBeatClick(beat.id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                  <img
                    src={beat.cover_image_url}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{beat.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {beat.purchase_count || 0} sales
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${beat.basic_license_price_diaspora || 0}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
