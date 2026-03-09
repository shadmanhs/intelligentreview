import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import ConnectGitHub from "./pages/ConnectGitHub";
import Dashboard from "./pages/Dashboard";
import ReviewPage from "./pages/ReviewPage";
import SettingsPage from "./pages/SettingsPage";
import PricingPage from "./pages/PricingPage";
import InsightsPage from "./pages/InsightsPage";
import SecurityPage from "./pages/SecurityPage";
import RulesPage from "./pages/RulesPage";
import TeamPage from "./pages/TeamPage";
import TeamInsightsPage from "./pages/TeamInsightsPage";
import LearningInsightsPage from "./pages/LearningInsightsPage";
import RolesPage from "./pages/RolesPage";
import SelfHostedPage from "./pages/SelfHostedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <OrganizationProvider>
          <PermissionsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route
                  path="/connect-github"
                  element={<ProtectedRoute><ConnectGitHub /></ProtectedRoute>}
                />
                <Route
                  path="/app"
                  element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                />
                <Route
                  path="/app/review/:owner/:repo/:number"
                  element={<ProtectedRoute><ReviewPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/insights"
                  element={<ProtectedRoute><InsightsPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/rules"
                  element={<ProtectedRoute><RulesPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/team"
                  element={<ProtectedRoute><TeamPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/team/insights"
                  element={<ProtectedRoute><TeamInsightsPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/learning"
                  element={<ProtectedRoute><LearningInsightsPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/roles"
                  element={<ProtectedRoute><RolesPage /></ProtectedRoute>}
                />
                <Route
                  path="/app/self-hosted"
                  element={<ProtectedRoute><SelfHostedPage /></ProtectedRoute>}
                />
                <Route
                  path="/settings"
                  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </PermissionsProvider>
        </OrganizationProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
