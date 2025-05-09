
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const PremiumSection = () => {
  const { user } = useAuth();
  
  if (user) {
    return (
      <section className="w-full bg-gradient-to-r from-purple-500/10 via-purple-600/10 to-purple-500/10 rounded-xl p-8 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-amber-500" />
            Premium Music Library
          </h2>
          <p className="text-muted-foreground">
            Browse our exclusive collection of high-quality beats from top producers.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link to="/trending">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                Browse Trending
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-gradient-to-r from-purple-500/10 via-purple-600/10 to-purple-500/10 rounded-xl p-8 text-center">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-amber-500" />
          Unlock Premium Music
        </h2>
        <p className="text-muted-foreground">
          Join today to access exclusive beats, save favorites, and connect with top producers.
        </p>
        <div className="pt-4">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
