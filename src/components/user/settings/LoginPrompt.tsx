
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function LoginPrompt() {
  const navigate = useNavigate();
  
  return (
    <div className="container py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Please Login to Access Settings</h1>
        <Button onClick={() => navigate('/login')}>Login</Button>
      </div>
    </div>
  );
}
