import { useState, useEffect, type KeyboardEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchUserByEmail, resetPassword } from "../../api/forgotPassword";
import { login } from "../../api/authApi";
import Loader from "../loader/loader";
import "../Login/Login.css";
import "./forgot.css";

const Forgot: React.FC = () => {
  const { token } = useParams();
  const [email, setEmail] = useState("");
  const [epersonId, setEpersonId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isFormValid = password.length >= 8 && password === confirmPassword;

  useEffect(() => {
    const loadUserData = async () => {
      if (!token) {
        setError("Invalid or missing token.");
        setLoading(false);
        return;
      }
      try {
        const { email, epersonId } = await fetchUserByEmail(token);
        setEmail(email);
        setEpersonId(epersonId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [token]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && isFormValid) {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      if (!epersonId) {
        throw new Error("User ID not found. Unable to reset password.");
      }
      await resetPassword(epersonId, password, token!);
      toast.success("Password reset successfully!");
       await login(email, password);
       window.location.href = "/"; 
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(errorMessage);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  if (loading) return <Loader />;

  return (
    <Container maxWidth={false} disableGutters className="auth-page login-page forgot-page">
      <Box className="auth-shell">
        <Box className="auth-panel auth-form-panel">
          <Box className="login-copy">
            <Typography variant="h3" className="login-title">
              Reset Password
            </Typography>
            <Box className="login-subtitle-row">
              <Typography className="login-subtitle">
                Step 3 of account setup
              </Typography>
            </Box>
          </Box>

          <Box className="login-form-card">
            {error && <Typography className="auth-error">{error}</Typography>}

            <TextField
              fullWidth
              label="Email Address"
              variant="standard"
              value={email}
              disabled
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <TextField
              fullWidth
              label="Password"
              variant="standard"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyDown}
              error={!!passwordError}
              helperText={passwordError}
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <TextField
              fullWidth
              label="Confirm Password"
              variant="standard"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onKeyDown={handleKeyDown}
              error={password !== confirmPassword}
              helperText={password !== confirmPassword ? "Passwords do not match." : ""}
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <Button
              fullWidth
              variant="contained"
              className="login-primary-button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              endIcon={<ArrowForwardIcon />}
            >
              Reset Password
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

export default Forgot;
