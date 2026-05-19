import { type KeyboardEvent, useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { forgotPassword } from "../../api/authApi";
import "../Login/Login.css";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Password reset link sent to your email.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={false} disableGutters className="auth-page login-page forgot-password-page">
      <Box className="auth-shell">
        <Box className="auth-panel auth-form-panel">
          <Box className="login-copy">
            <Typography variant="h3" className="login-title">
              Reset Your Password
            </Typography>
            <Box className="login-subtitle-row">
              <Typography className="login-subtitle">
                Remember your password?
              </Typography>
              <Button
                variant="text"
                className="create-account-link"
                onClick={() => navigate("/login")}
              >
                Back to login
              </Button>
            </Box>
          </Box>

          <Box className="login-form-card">
            <Typography className="forgot-password-text">
              Enter your email, and we'll send you a link to reset your password.
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              variant="standard"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <Button
              fullWidth
              variant="contained"
              className="login-primary-button"
              onClick={handleSubmit}
              disabled={loading}
              endIcon={<ArrowForwardIcon />}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </Box>
        </Box>

        <Box className="auth-panel auth-visual-panel" aria-hidden="true">
          <Box className="art-grid" />
          <Box className="art-rail art-rail-left">
            <span className="art-dot art-dot-solid" />
            <span className="art-dot art-dot-soft" />
            <span className="art-dot art-dot-soft" />
            <span className="art-dot art-dot-soft" />
          </Box>
          <Box className="art-rail art-rail-center">
            <span className="art-node art-node-diamond" />
            <span className="art-node art-node-pair" />
          </Box>
          <Box className="art-rail art-rail-right">
            <span className="art-dot art-dot-solid art-dot-tall" />
            <span className="art-dot art-dot-soft" />
            <span className="art-dot art-dot-soft" />
            <span className="art-dot art-dot-soft" />
          </Box>
          <Box className="art-path art-path-left" />
          <Box className="art-path art-path-right" />
          <Box className="art-arc art-arc-main" />
          <Box className="art-arc art-arc-secondary" />
          <Box className="art-band art-band-top" />
          <Box className="art-band art-band-bottom" />
          <Box className="art-diamond art-diamond-large" />
          <Box className="art-diamond art-diamond-small" />
          <Box className="art-ring art-ring-center" />
          <Box className="art-ring art-ring-left" />
          <Box className="art-circle art-circle-center" />
          <Box className="art-circle art-circle-soft" />
        </Box>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
