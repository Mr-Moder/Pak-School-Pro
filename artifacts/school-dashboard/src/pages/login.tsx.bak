import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap, ShieldAlert, Lock } from "lucide-react";
import { getPassword, recordFailedAttempt, resetLoginAttempts, getLockoutUntil, getLoginAttempts } from "@/lib/storage";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("school_auth") === "true") {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  useEffect(() => {
    const checkLockout = () => {
      const until = getLockoutUntil();
      if (until > Date.now()) {
        setLockedOut(true);
        setLockoutRemaining(Math.ceil((until - Date.now()) / 60000));
      } else {
        setLockedOut(false);
        setLockoutRemaining(0);
      }
      setAttempts(getLoginAttempts());
    };
    checkLockout();
    const interval = setInterval(checkLockout, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const until = getLockoutUntil();
    if (until > Date.now()) {
      setLockedOut(true);
      setLockoutRemaining(Math.ceil((until - Date.now()) / 60000));
      return;
    }

    if (username === "admin" && password === getPassword()) {
      resetLoginAttempts();
      localStorage.setItem("school_auth", "true");
      setLocation("/dashboard");
    } else {
      recordFailedAttempt();
      const newAttempts = getLoginAttempts();
      const newUntil = getLockoutUntil();
      setAttempts(newAttempts);
      if (newUntil > Date.now()) {
        setLockedOut(true);
        setLockoutRemaining(15);
        setError("");
      } else {
        const remaining = 5 - newAttempts;
        setError(
          remaining > 0
            ? `Incorrect username or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`
            : "Incorrect username or password."
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-3xl">Oxford Science</CardTitle>
          <CardDescription>Administration Dashboard — Authorized Access Only</CardDescription>
        </CardHeader>
        <CardContent>
          {lockedOut ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-destructive/10 rounded-full p-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-destructive">Account Temporarily Locked</p>
                <p className="text-sm text-muted-foreground">
                  Too many failed attempts. Please wait approximately{" "}
                  <span className="font-medium text-foreground">{lockoutRemaining} minute{lockoutRemaining !== 1 ? "s" : ""}</span>{" "}
                  before trying again.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  data-testid="input-password"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                  <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" data-testid="button-sign-in">
                Sign In
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Account locks for 15 minutes after 5 failed attempts
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
