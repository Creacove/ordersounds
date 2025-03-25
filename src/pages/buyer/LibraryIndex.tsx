
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function LibraryIndex() {
  const { user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    document.title = "My Library | OrderSOUNDS";
  }, []);
  
  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // By default, show the library with purchased beats
  return <Navigate to="/purchased" replace />;
}
