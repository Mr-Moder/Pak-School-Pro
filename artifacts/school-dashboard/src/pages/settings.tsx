import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getPassword, savePassword, getUsername, saveUsername } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, KeyRound, CheckCircle2, UserCog, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const usernameSchema = z.object({
  currentPassword: z.string().min(1, "Password is required to confirm"),
  newUsername: z.string().min(3, "Username must be at least 3 characters").max(20, "Username too long").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UsernameFormValues = z.infer<typeof usernameSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Settings() {
  const [pwSuccess, setPwSuccess] = useState(false);
  const [unSuccess, setUnSuccess] = useState(false);
  const [pendingUsername, setPendingUsername] = useState<UsernameFormValues | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(getUsername());

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { currentPassword: "", newUsername: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onUsernameSubmit = (values: UsernameFormValues) => {
    if (values.currentPassword !== getPassword()) {
      usernameForm.setError("currentPassword", { message: "Password is incorrect" });
      return;
    }
    setPendingUsername(values);
    setShowConfirm(true);
  };

  const confirmUsernameChange = () => {
    if (!pendingUsername) return;
    saveUsername(pendingUsername.newUsername);
    setCurrentUsername(pendingUsername.newUsername);
    setShowConfirm(false);
    setPendingUsername(null);
    setUnSuccess(true);
    usernameForm.reset();
    setTimeout(() => setUnSuccess(false), 4000);
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    if (values.currentPassword !== getPassword()) {
      passwordForm.setError("currentPassword", { message: "Current password is incorrect" });
      return;
    }
    savePassword(values.newPassword);
    setPwSuccess(true);
    passwordForm.reset();
    setTimeout(() => setPwSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin credentials and account security.</p>
      </div>

      {/* Security Info */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader className="flex flex-row items-start gap-4 pb-3">
          <div className="bg-primary/10 rounded-lg p-2 mt-1">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Access Control</CardTitle>
            <CardDescription className="mt-1">
              Only the admin with correct credentials can access this dashboard. Current username: <strong>{currentUsername}</strong>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-background/60 border px-4 py-3 text-sm space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              All data is stored only on this device
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Account locks for 15 minutes after 5 failed attempts
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              No one can access without your username and password
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Username */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="bg-primary/10 rounded-lg p-2 mt-1">
            <UserCog className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Change Username</CardTitle>
            <CardDescription className="mt-1">
              Current username: <strong>{currentUsername}</strong>. You must enter your password to confirm.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {unSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Username changed successfully to <strong>{currentUsername}</strong>.
            </div>
          )}
          <Form {...usernameForm}>
            <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-4">
              <FormField
                control={usernameForm.control}
                name="newUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Username</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. oxford_admin" data-testid="input-new-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={usernameForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm with Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your current password" data-testid="input-confirm-password-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" data-testid="button-change-username">
                Change Username
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="bg-primary/10 rounded-lg p-2 mt-1">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription className="mt-1">
              Use a strong private password with letters, numbers, and symbols.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {pwSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Password changed successfully.
            </div>
          )}
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter current password" data-testid="input-current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 6 characters" data-testid="input-new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat new password" data-testid="input-confirm-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" data-testid="button-change-password">
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Username Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change your username from <strong>{currentUsername}</strong> to{" "}
              <strong>{pendingUsername?.newUsername}</strong>.<br /><br />
              You will need to use the new username next time you log in. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUsernameChange}>Yes, Change Username</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
