import { Settings, Shield } from "lucide-react";
import "./SimplePage.css";

export default function SettingsPage() {
  return (
    <div className="simple-page">
      <div className="simple-page-card">
        <div className="simple-page-icon">
          <Settings size={24} />
        </div>
        <h2>Settings</h2>
        <p>This section is active. You can add profile/settings forms here.</p>
        <div className="simple-page-meta">
          <Shield size={16} />
          <span>Protected admin route</span>
        </div>
      </div>
    </div>
  );
}
