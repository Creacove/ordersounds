
import { Badge } from "@/components/ui/badge";
import { Beat } from "@/types";

interface BeatTagsSectionProps {
  beat: Beat;
}

export const BeatTagsSection = ({ beat }: BeatTagsSectionProps) => {
  // Combine genre, track_type, and tags
  const allTags = [
    ...(beat.tags || []),
    `${beat.genre} type beat`,
    `${beat.producer_name.split(' ')[0]} type beat`,
    `Bnxn type beat`
  ].slice(0, 3); // Limit to 3 tags like in the image

  return (
    <div>
      <h3 className="text-white font-medium mb-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag, index) => (
          <Badge 
            key={index}
            variant="secondary" 
            className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};
