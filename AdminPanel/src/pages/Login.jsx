import { useEffect, useState } from "react";
import { useFeedback } from "../components/Feedback";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { adminAPI, authHelper, PORTAL, PORTAL_LABELS } from "../services/api";
import BrandMark from "../components/Brand";

// Set by the dashboard when an account was signed out for using the wrong portal
const readPortalNotice = () => {
  try {
    const notice = JSON.parse(sessionStorage.getItem("portalNotice") || "null");
    sessionStorage.removeItem("portalNotice");
    return notice;
  } catch {
    return null;
  }
};

// There are no passwords: every sign-in is a one-time code, sent either to the
// WhatsApp number or to the email address saved on the account
const CHANNELS = {
  whatsapp: {
    tab: "WhatsApp",
    send: (id) => adminAPI.sendLoginOtp(id),
    verify: (id, code) => adminAPI.verifyLoginOtp(id, code),
    field: {
      label: "Mobile number",
      placeholder: "98765 43210",
      autoComplete: "tel",
      inputMode: "tel",
      type: "tel",
      adornment: "+91",
    },
    change: "Change number",
    sent: "Code sent to your WhatsApp.",
  },
  email: {
    tab: "Email",
    send: (id) => adminAPI.sendEmailLoginOtp(id),
    verify: (id, code) => adminAPI.verifyEmailLoginOtp(id, code),
    field: {
      label: "Email address",
      placeholder: "you@buzingbee.com",
      autoComplete: "email",
      inputMode: "email",
      type: "email",
    },
    change: "Change email",
    sent: "Code sent to your email.",
  },
};

const EMPTY_STEP = { id: "", code: "", codeSent: false, info: "", error: "", resendIn: 0 };

export default function Login() {
  const navigate = useNavigate();
  const { notify } = useFeedback();

  // Deferred (and cancelled on cleanup) so it fires exactly once, after the
  // toast container is ready, even when React runs effects twice in dev
  useEffect(() => {
    if (!sessionStorage.getItem("sessionExpired")) return undefined;
    const t = setTimeout(() => {
      sessionStorage.removeItem("sessionExpired");
      notify("Your session expired. Please sign in again.", "warning");
    }, 0);
    return () => clearTimeout(t);
  }, [notify]);

  const [portalNotice] = useState(readPortalNotice);
  const [channel, setChannel] = useState("whatsapp");
  // Each tab keeps its own progress, so switching tabs never loses what was typed
  // or a code that was already sent
  const [steps, setSteps] = useState({ whatsapp: { ...EMPTY_STEP }, email: { ...EMPTY_STEP } });
  const [loading, setLoading] = useState(false);

  const ch = CHANNELS[channel];
  const { id, code, codeSent, info, error, resendIn } = steps[channel];
  const update = (key, patch) => setSteps((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // One tick drives the resend countdown of both tabs
  const counting = steps.whatsapp.resendIn > 0 || steps.email.resendIn > 0;
  useEffect(() => {
    if (!counting) return undefined;
    const t = setInterval(() => {
      setSteps((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(prev)) {
          if (prev[key].resendIn > 0) next[key] = { ...prev[key], resendIn: prev[key].resendIn - 1 };
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [counting]);

  const switchChannel = (_e, next) => {
    if (next && next !== channel) setChannel(next);
  };

  // A different number/email has its own cooldown on the server, so the timer restarts
  const changeId = () => update(channel, { codeSent: false, code: "", info: "", error: "", resendIn: 0 });

  const handleSend = async (e) => {
    e?.preventDefault();
    if (resendIn > 0) return;
    const key = channel;
    update(key, { error: "" });
    setLoading(true);
    try {
      const response = await ch.send(id.trim());
      update(key, {
        codeSent: true,
        code: "",
        info: response.message || ch.sent,
        resendIn: response.resendAfterSeconds || 60,
      });
    } catch (err) {
      // A code went out moments ago: go to the code step and count down instead
      if (err.status === 429 && err.data?.retryAfter) {
        update(key, { codeSent: true, info: ch.sent, error: "", resendIn: err.data.retryAfter });
      } else {
        update(key, { error: err.message || "Could not send the code." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const key = channel;
    update(key, { error: "" });
    setLoading(true);
    try {
      const response = await ch.verify(id.trim(), code);
      if (response.token) {
        authHelper.saveToken(response.token, response.expiresAt);
        notify(`Welcome back${response.data?.username ? `, ${response.data.username}` : ""}!`, "success");
        navigate("/dashboard");
      }
    } catch (err) {
      update(key, { error: err.message || "Could not verify the code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background:
          "radial-gradient(circle at 20% 10%, rgba(245,166,35,0.22), transparent 45%), radial-gradient(circle at 85% 90%, rgba(255,140,0,0.14), transparent 40%)",
        bgcolor: "background.default",
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 460,
          minHeight: { sm: 560 },
          p: { xs: 4, sm: 6 },
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Stack spacing={1.5} sx={{ alignItems: "center", mb: 4, textAlign: "center" }}>
          <BrandMark size={68} />
          {PORTAL && (
            <Chip color="primary" label={`${PORTAL_LABELS[PORTAL]} sign in`} sx={{ fontWeight: 600 }} />
          )}
          <Typography color="text.secondary">
            Welcome back to your creative workspace
          </Typography>
        </Stack>

        {portalNotice && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            This account is a {PORTAL_LABELS[portalNotice.role] || portalNotice.role} account and signs in at{" "}
            <Link href={`${window.location.protocol}//${portalNotice.host}/login`} sx={{ fontWeight: 600 }}>
              {portalNotice.host}
            </Link>
            .
          </Alert>
        )}

        <ToggleButtonGroup
          value={channel}
          exclusive
          size="small"
          onChange={switchChannel}
          disabled={loading}
          aria-label="Where to send your sign-in code"
          sx={{ mb: 3, width: "100%", flexWrap: "nowrap" }}
        >
          {Object.entries(CHANNELS).map(([key, c]) => (
            <ToggleButton key={key} value={key} sx={{ flex: 1 }}>
              {c.tab}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box component="form" onSubmit={codeSent ? handleVerify : handleSend}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {codeSent && info && !error && <Alert severity="info">{info}</Alert>}

            <TextField
              key={channel}
              size="medium"
              label={ch.field.label}
              type={ch.field.type}
              value={id}
              onChange={(e) => update(channel, { id: e.target.value })}
              placeholder={ch.field.placeholder}
              required
              autoFocus
              autoComplete={ch.field.autoComplete}
              inputMode={ch.field.inputMode}
              disabled={loading || codeSent}
              slotProps={
                ch.field.adornment
                  ? { input: { startAdornment: <InputAdornment position="start">{ch.field.adornment}</InputAdornment> } }
                  : undefined
              }
            />

            {codeSent && (
              <TextField
                size="medium"
                label="6-digit code"
                value={code}
                onChange={(e) => update(channel, { code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={loading}
              />
            )}

            {codeSent && (
              <Stack direction="row" sx={{ justifyContent: "space-between", mt: -1 }}>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  sx={{ fontSize: 14, fontWeight: 600 }}
                  onClick={changeId}
                >
                  {ch.change}
                </Link>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    ...(resendIn > 0 && { color: "text.disabled", cursor: "default", textDecoration: "none" }),
                  }}
                  disabled={resendIn > 0 || loading}
                  onClick={handleSend}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </Link>
              </Stack>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ minHeight: 52, fontSize: 16 }}
              disabled={loading || (codeSent && code.length !== 6)}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? "Please wait..." : codeSent ? "Verify & Sign In" : "Send Code"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
