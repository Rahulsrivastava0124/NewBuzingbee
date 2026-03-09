import { Users, Eye } from "lucide-react";
import "./SimplePage.css";

export default function Audience() {
  return (
    <div className="simple-page">
      <div className="simple-page-card">
        <div className="simple-page-icon">
          <Users size={24} />
        </div>
        <h2>Audience</h2>
        <p>
          This section is active. You can add audience analytics API here next.
        </p>
        <div className="simple-page-meta">
          <Eye size={16} />
          <span>Menu is connected and working</span>
        </div>
      </div>
    </div>
  );
}
