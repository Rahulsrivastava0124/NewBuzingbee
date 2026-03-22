import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Save,
  UserCircle2,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { adminAPI } from "../services/api";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminAPI.getProfile();
        const admin = response?.admin || null;

        setProfile(admin);
        setForm({
          username: admin?.username || "",
          email: admin?.email || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setProfileSuccess("");
    setProfileError("");
  };

  const handlePasswordInputChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setPasswordSuccess("");
    setPasswordError("");
  };

  const togglePasswordVisibility = (key) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setForm({
      username: profile?.username || "",
      email: profile?.email || "",
    });
    setProfileError("");
    setProfileSuccess("");
  };

  const handlePasswordReset = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
    };

    if (!payload.username || !payload.email) {
      setProfileError("Username and email are required.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await adminAPI.updateProfile(payload);
      const updatedAdmin = response?.admin || null;
      setProfile((prev) => ({ ...prev, ...updatedAdmin }));
      setForm({
        username: updatedAdmin?.username || payload.username,
        email: updatedAdmin?.email || payload.email,
      });
      setProfileSuccess(response?.message || "Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const payload = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    };

    if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (payload.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (payload.newPassword !== payload.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await adminAPI.updateProfile(payload);
      setPasswordSuccess(response?.message || "Password updated successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-card">
          <p className="settings-muted">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-icon">
          <Settings size={24} />
        </div>
        <h2>Settings</h2>
        <p>View and update your admin profile details.</p>

        <div className="settings-meta">
          <Shield size={16} />
          <span>Protected admin route</span>
        </div>

        <div className="settings-profile-head">
          <div className="settings-avatar">
            <UserCircle2 size={24} />
          </div>
          <div>
            <h3>Profile</h3>
            <p>ID: {profile?._id || profile?.id || "—"}</p>
          </div>
        </div>

        {error && <div className="settings-alert error">{error}</div>}

        <div className="settings-section">
          <form className="settings-form" onSubmit={handleProfileSubmit}>
            {profileError && <div className="settings-alert error">{profileError}</div>}
            {profileSuccess && (
              <div className="settings-alert success">{profileSuccess}</div>
            )}

            <div className="settings-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(event) =>
                  handleInputChange("username", event.target.value)
                }
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => handleInputChange("email", event.target.value)}
                placeholder="Enter email"
                autoComplete="email"
              />
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-btn ghost"
                onClick={handleReset}
                disabled={profileSaving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="settings-btn primary"
                disabled={profileSaving}
              >
                <Save size={16} />
                <span>{profileSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="settings-divider" />

        <div className="settings-profile-head">
          <div className="settings-avatar">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h3>Change Password</h3>
            <p>Keep your account secure by updating password regularly.</p>
          </div>
        </div>

        <div className="settings-section">
          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            {passwordError && <div className="settings-alert error">{passwordError}</div>}
            {passwordSuccess && (
              <div className="settings-alert success">{passwordSuccess}</div>
            )}

            <div className="settings-field">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="settings-password-wrap">
                <input
                  id="currentPassword"
                  type={showPassword.currentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    handlePasswordInputChange("currentPassword", event.target.value)
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="settings-password-toggle"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  aria-label={
                    showPassword.currentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  disabled={passwordSaving}
                >
                  {showPassword.currentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="newPassword">New Password</label>
              <div className="settings-password-wrap">
                <input
                  id="newPassword"
                  type={showPassword.newPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    handlePasswordInputChange("newPassword", event.target.value)
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="settings-password-toggle"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  aria-label={
                    showPassword.newPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                  disabled={passwordSaving}
                >
                  {showPassword.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="settings-password-wrap">
                <input
                  id="confirmPassword"
                  type={showPassword.confirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    handlePasswordInputChange("confirmPassword", event.target.value)
                  }
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="settings-password-toggle"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  aria-label={
                    showPassword.confirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  disabled={passwordSaving}
                >
                  {showPassword.confirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-btn ghost"
                onClick={handlePasswordReset}
                disabled={passwordSaving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="settings-btn primary"
                disabled={passwordSaving}
              >
                <Save size={16} />
                <span>{passwordSaving ? "Saving..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
