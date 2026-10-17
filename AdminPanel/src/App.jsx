import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { authHelper } from "./services/api";
import { LoadingState } from "./components/common";

const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogForm = lazy(() => import("./pages/BlogForm"));
const BlogDetails = lazy(() => import("./pages/BlogDetails"));
const CaseStudyList = lazy(() => import("./pages/CaseStudyList"));
const CaseStudyForm = lazy(() => import("./pages/CaseStudyForm"));
const TrafficPage = lazy(() => import("./pages/TrafficPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Enquiries = lazy(() => import("./pages/Enquiries"));
const Clients = lazy(() => import("./pages/finance/Clients"));
const ClientLedger = lazy(() => import("./pages/finance/ClientLedger"));
const Invoices = lazy(() => import("./pages/finance/Invoices"));
const InvoiceForm = lazy(() => import("./pages/finance/InvoiceForm"));
const InvoiceDetails = lazy(() => import("./pages/finance/InvoiceDetails"));
const WalletLedger = lazy(() => import("./pages/finance/WalletLedger"));
const Expenses = lazy(() => import("./pages/finance/Expenses"));
const Loans = lazy(() => import("./pages/finance/Loans"));
const Users = lazy(() => import("./pages/Users"));

function PrivateRoute({ children }) {
  return authHelper.isAuthenticated() ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

// Checked on every render, not once at startup: after a sign-out the login page
// must not bounce back to the dashboard (that caused an endless redirect loop)
function PublicOnlyRoute({ children }) {
  return authHelper.isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function RootRedirect() {
  return <Navigate to={authHelper.isAuthenticated() ? "/dashboard" : "/login"} replace />;
}

function App() {

  return (
    <Router>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="blogs" element={<BlogList />} />
            <Route path="blog/:id" element={<BlogDetails />} />
            <Route path="create-blog" element={<BlogForm />} />
            <Route
              path="add-blog"
              element={<Navigate to="/dashboard/create-blog" replace />}
            />
            <Route path="edit-blog/:id" element={<BlogForm />} />
            <Route path="case-studies" element={<CaseStudyList />} />
            <Route path="create-case-study" element={<CaseStudyForm />} />
            <Route path="edit-case-study/:id" element={<CaseStudyForm />} />
            <Route path="traffic" element={<TrafficPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="enquiries" element={<Enquiries />} />
            {/* Finance overview now lives on the main dashboard */}
            <Route path="finance" element={<Navigate to="/dashboard" replace />} />
            <Route path="finance/clients" element={<Clients />} />
          <Route path="finance/clients/:id" element={<ClientLedger />} />
            <Route path="finance/invoices" element={<Invoices />} />
            <Route path="finance/invoices/new" element={<InvoiceForm />} />
            <Route path="finance/invoices/:id" element={<InvoiceDetails />} />
            <Route path="finance/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="finance/wallet" element={<WalletLedger />} />
            <Route path="finance/expenses" element={<Expenses />} />
            <Route path="finance/loans" element={<Loans />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
