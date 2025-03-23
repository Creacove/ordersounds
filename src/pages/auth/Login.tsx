
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  // Helper hint for demo purposes
  const loginHint = () => {
    setEmail("user@example.com");
    setPassword("password");
  };

  const loginAsProducer = () => {
    setEmail("producer@example.com");
    setPassword("password");
  };

  return (
    <MainLayout hideSidebar>
      <div className="container relative h-[calc(100vh-4rem)] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-zinc-900/70" />
            <img
              src="https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop"
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
                "Discover, create, and sell beats that define the sound of tomorrow. Join the community of talented producers and passionate artists."
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email to sign in to your account
              </p>
            </div>
            <div className="grid gap-6">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none">
                      Email
                    </label>
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoCapitalize="none"
                      autoComplete="password"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Demo Accounts
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loginHint} className="w-full">
                  Buyer Demo
                </Button>
                <Button variant="outline" onClick={loginAsProducer} className="w-full">
                  Producer Demo
                </Button>
              </div>
            </div>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
