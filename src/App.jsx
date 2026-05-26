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