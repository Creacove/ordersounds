
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music } from "lucide-react";

export const GenreQuickLinks = () => {
  const genres = [
    { name: "Afrobeat", path: "/genre/afrobeat" },
    { name: "Hip Hop", path: "/genre/hip-hop" },
    { name: "R&B", path: "/genre/r-and-b" },
    { name: "Amapiano", path: "/genre/amapiano" }
  ];

  return (
    <section className="flex items-center gap-4 mb-12 overflow-x-auto pb-2">
      {genres.map((genre) => (
        <Link key={genre.name} to={genre.path}>
          <Button variant="outline" className="rounded-full" size="sm">
            <Music className="w-4 h-4 mr-2" />
            {genre.name}
          </Button>
        </Link>
      ))}
      <Link to="/genres">
        <Button variant="outline" className="rounded-full text-purple-500 border-purple-500 hover:bg-purple-50" size="sm">
          All genres
        </Button>
      </Link>
    </section>
  );
};
