import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Estimates from './pages/Estimates';
import EstimateDetail from './pages/EstimateDetail';
import AIEstimator from './pages/AIEstimator';
import EstimateAcceptance from './pages/EstimateAcceptance';
import Projects from './pages/Projects';
import Checklists from './pages/Checklists';
import Guardian from './pages/Guardian';
import GuardianDetail from './pages/GuardianDetail';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Team from './pages/Team';
import AI from './pages/AI';
import Calendar from './pages/Calendar';
import Report from './pages/Report';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import ProjectDetail from './pages/ProjectDetail';
import ClientPortal from './pages/ClientPortal';
import PortalLayout from './components/PortalLayout';
import SOPTemplates from './pages/SOPTemplates';
import SOPTemplateDetail from './pages/SOPTemplateDetail';
import ChecklistDetail from './pages/ChecklistDetail';
import GenerateSampleData from './pages/GenerateSampleData';
import FinancialControl from './pages/FinancialControl';
import ProjectFinancialDetail from './pages/ProjectFinancialDetail';
import CEODashboard from './pages/CEODashboard';
import Suppliers from './pages/Suppliers';
import Timesheets from './pages/Timesheets';
import PurchaseOrders from './pages/PurchaseOrders';
import CashFlow from './pages/CashFlow';
import CodexIntelligence from './pages/CodexIntelligence';
import KnowledgeBase from './pages/KnowledgeBase';
import AIAdvisor from './pages/AIAdvisor';
import ExecutiveInsights from './pages/ExecutiveInsights';
import ArchitectureReview from './pages/ArchitectureReview';
import CompanySettings from './pages/CompanySettings';
import SubscriptionPlans from './pages/SubscriptionPlans';
import PermissionsTest from './pages/PermissionsTest';
import DataIntegrity from './pages/DataIntegrity';
import GoLiveChecklist from './pages/GoLiveChecklist';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantOnboarding from './pages/TenantOnboarding';
import ApiKeys from './pages/ApiKeys';
import Tasks from './pages/Tasks';
import TechnicianView from './pages/TechnicianView';
import ActivityFeed from './pages/ActivityFeed';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/estimates/:id" element={<EstimateDetail />} />
        <Route path="/ai-estimator" element={<AIEstimator />} />
        <Route path="/estimate-acceptance/:id" element={<EstimateAcceptance />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/checklists" element={<Checklists />} />
        <Route path="/checklists/:id" element={<ChecklistDetail />} />
        <Route path="/guardian" element={<Guardian />} />
        <Route path="/guardian/:id" element={<GuardianDetail />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/team" element={<Team />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/report" element={<Report />} />
        <Route path="/sop" element={<SOPTemplates />} />
        <Route path="/sop/:id" element={<SOPTemplateDetail />} />
        <Route path="/generate-data" element={<GenerateSampleData />} />
        <Route path="/financial-control" element={<FinancialControl />} />
        <Route path="/projects/:id/financial" element={<ProjectFinancialDetail />} />
        <Route path="/ceo-dashboard" element={<CEODashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/cash-flow" element={<CashFlow />} />
        <Route path="/intelligence" element={<CodexIntelligence />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/ai-advisor" element={<AIAdvisor />} />
        <Route path="/executive-insights" element={<ExecutiveInsights />} />
        <Route path="/architecture-review" element={<ArchitectureReview />} />
        <Route path="/company-settings" element={<CompanySettings />} />
        <Route path="/subscription-plans" element={<SubscriptionPlans />} />
        <Route path="/permissions-test" element={<PermissionsTest />} />
        <Route path="/data-integrity" element={<DataIntegrity />} />
        <Route path="/go-live-checklist" element={<GoLiveChecklist />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/tenant-onboarding" element={<TenantOnboarding />} />
        <Route path="/api-keys" element={<ApiKeys />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/technician" element={<TechnicianView />} />
        <Route path="/activity" element={<ActivityFeed />} />
      </Route>
      <Route element={<PortalLayout />}>
        <Route path="/portal" element={<ClientPortal />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App