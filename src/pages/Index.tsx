
import { useState, useEffect, useRef } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useBeats } from "@/hooks/useBeats";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  TrendingUp,
  Flame,
  ListMusic,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Star,
  UserCheck,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
