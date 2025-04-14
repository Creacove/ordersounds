
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface ProducerSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ProducerSearch({ searchQuery, setSearchQuery }: ProducerSearchProps) {
  return (
    <div className="relative mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          placeholder="Search producers by name or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 py-2 bg-secondary text-foreground border-border focus:ring-2 focus:ring-ring w-full rounded-md"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
