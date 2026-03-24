import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import BlogList from "./pages/BlogList";
import BlogForm from "./pages/BlogForm";
import BlogDetails from "./pages/BlogDetails";
import CaseStudyList from "./pages/CaseStudyList";
import CaseStudyForm from "./pages/CaseStudyForm";
import TrafficPage from "./pages/TrafficPage";
import Audience from "./pages/Audience";
import SettingsPage from "./pages/SettingsPage";
import Enquiries from "./pages/Enquiries";
import { authHelper } from "./services/api";
import "./App.css";

function PrivateRoute({ children }) {
  return authHelper.isAuthenticated() ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  const isAuthenticated = authHelper.isAuthenticated();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
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
          <Route path="audience" element={<Audience />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="enquiries" element={<Enquiries />} />
        </Route>
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
