
import { Button } from "@/components/ui/button";

interface NotFoundProps {
  title?: string;
  description?: string;
}

export function NotFound({ 
  title = "User Not Found", 
  description = "The user you're looking for doesn't exist or has been removed."
}: NotFoundProps) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button asChild className="bg-purple-600 hover:bg-purple-700">
        <a href="/">Back to Home</a>
      </Button>
    </div>
  );
}
