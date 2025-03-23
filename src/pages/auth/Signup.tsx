
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "producer">("buyer");
  const { signup, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(email, password, name, role);
  };

  return (
    <MainLayout hideSidebar>
      <div className="container relative h-[calc(100vh-4rem)] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-zinc-900/70" />
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
              alt="Authentication"
              className="object-cover w-full h-full opacity-30 mix-blend-overlay"
            />
          </div>
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 mr-2"
            >
              <path d="M12 3c-1.83 0-3.5.62-4.83 1.65L12 9.48l4.83-4.83C15.5 3.62 13.83 3 12 3zm0 18c1.83 0 3.5-.62 4.83-1.65L12 14.52l-4.83 4.83C8.5 20.38 10.17 21 12 21z" />
              <path opacity="0.7" d="M3 12c0 1.83.62 3.5 1.65 4.83L9.48 12l-4.83-4.83C3.62 8.5 3 10.17 3 12zm18 0c0-1.83-.62-3.5-1.65-4.83L14.52 12l4.83 4.83C20.38 15.5 21 13.83 21 12z" />
            </svg>
            Creacove
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "The perfect platform to find beats that inspire your creativity or share your productions with the world."
              </p>
              <footer className="text-sm">Tyler Wright</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">
                Sign up to access the beat marketplace
              </p>
            </div>
            <div className="grid gap-6">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      disabled={isLoading}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoCapitalize="none"
                      autoComplete="password"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>I am a:</Label>
                    <RadioGroup 
                      defaultValue={role} 
                      onValueChange={(value) => setRole(value as "buyer" | "producer")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="buyer" id="buyer" />
                        <Label htmlFor="buyer" className="cursor-pointer">Buyer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="producer" id="producer" />
                        <Label htmlFor="producer" className="cursor-pointer">Producer</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </div>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
