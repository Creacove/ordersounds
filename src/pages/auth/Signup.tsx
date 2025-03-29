
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { toast } from "sonner";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"buyer" | "producer">("buyer");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { signup, isLoading } = useAuth();

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await signup(email, password, name, role);
      } catch (error: any) {
        toast.error(error.message || "Failed to sign up");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <MainLayout hideSidebar>
      <div className="container relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900">
            <img
              src="https://images.unsplash.com/photo-1548515836-69f8c58cbce7?q=80&w=2940&auto=format&fit=crop"
              alt="Authentication"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-[2px]" />
          </div>
          <div className="relative z-20 mt-auto">
            <div className="mb-4">
              <div className="w-12 h-1 bg-primary mb-3 rounded-full"></div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">OrderSounds</h2>
              <p className="text-white/70">Your ultimate sound experience</p>
            </div>
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Join our creative community and explore a world of professional audio that will bring your projects to life. Elevate your craft with premium sound quality."
              </p>
              <footer className="text-sm text-white/70">Head of Design</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8 flex items-center justify-center w-full min-h-[calc(100vh-4rem)]">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1548515836-69f8c58cbce7?q=80&w=2940&auto=format&fit=crop"
              alt="Background"
              className="object-cover w-full h-full opacity-20 lg:hidden"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl lg:hidden" />
          </div>
          <Card className="mx-auto flex w-full flex-col justify-center sm:w-[350px] bg-background/95 backdrop-blur-sm border border-border/20 shadow-xl animate-fade-in relative z-10 my-8">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-center">Create an account</CardTitle>
              <CardDescription className="text-center">
                Sign up to access premium sound content
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        type="text"
                        className="pl-10"
                        autoCapitalize="none"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        className="pl-10"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        disabled={isLoading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>I am a:</Label>
                    <RadioGroup 
                      value={role} 
                      onValueChange={(value) => setRole(value as "buyer" | "producer")}
                      className="grid grid-cols-2 gap-4 pt-2"
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="buyer" id="buyer" />
                        <Label htmlFor="buyer" className="cursor-pointer">Buyer</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="producer" id="producer" />
                        <Label htmlFor="producer" className="cursor-pointer">Producer</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="mt-2 w-full transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </div>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              
              <GoogleAuthButton mode="signup" />
            </CardContent>
            <div className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
