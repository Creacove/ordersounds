
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function LibraryIndex() {
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = "My Library | Creacove";
  }, []);
  
  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // By default, show the playlists page
  return <Navigate to="/playlists" replace />;
}
