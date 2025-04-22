
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Pause, Filter, ArrowRight, Sparkles, Flame, Clock, ChevronRight, Headphones, Star, Award, UserCheck, Music, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCard } from "@/components/ui/BeatCard";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";
import { useProducers } from "@/hooks/useProducers";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getUserPlaylists } from "@/lib/playlistService";
import { PlaylistCard } from "@/components/library/PlaylistCard";
import { toast } from "sonner";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { fetchTrendingBeats, fetchRandomBeats, fetchNewBeats } from "@/services/beats";
import { TrendingBeats } from "@/components/marketplace/TrendingBeats";
import { WeeklyPicks } from "@/components/marketplace/WeeklyPicks";

const Home = () => {
  return (
    <MainLayoutWithPlayer activeTab="home">
      <div className="container py-6 space-y-10">
        <TrendingBeats />
        <WeeklyPicks />
        <ProducerOfWeek />
        <RecommendedBeats />
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Home;
