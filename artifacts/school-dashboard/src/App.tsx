import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { initializeStorage } from "@/lib/storage";

import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import StudentForm from "@/pages/student-form";
import Teachers from "@/pages/teachers";
import TeacherForm from "@/pages/teacher-form";
import Attendance from "@/pages/attendance";
import Academics from "@/pages/academics";
import Exams from "@/pages/exams";
import Progress from "@/pages/progress";
import Fees from "@/pages/fees";
import Settings from "@/pages/settings";
import Announcements from "@/pages/announcements";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (localStorage.getItem("school_auth") !== "true") {
      setLocation("/login");
    }
  }, [location, setLocation]);

  if (localStorage.getItem("school_auth") !== "true") return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function RedirectToDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(localStorage.getItem("school_auth") === "true" ? "/dashboard" : "/login");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/students"><ProtectedRoute component={Students} /></Route>
      <Route path="/students/add"><ProtectedRoute component={StudentForm} /></Route>
      <Route path="/students/:id"><ProtectedRoute component={StudentForm} /></Route>
      <Route path="/teachers"><ProtectedRoute component={Teachers} /></Route>
      <Route path="/teachers/add"><ProtectedRoute component={TeacherForm} /></Route>
      <Route path="/teachers/:id"><ProtectedRoute component={TeacherForm} /></Route>
      <Route path="/attendance"><ProtectedRoute component={Attendance} /></Route>
      <Route path="/academics"><ProtectedRoute component={Academics} /></Route>
      <Route path="/exams"><ProtectedRoute component={Exams} /></Route>
      <Route path="/progress"><ProtectedRoute component={Progress} /></Route>
      <Route path="/fees"><ProtectedRoute component={Fees} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route path="/announcements"><ProtectedRoute component={Announcements} /></Route>
      <Route path="/"><RedirectToDashboard /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
