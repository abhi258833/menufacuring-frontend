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
import { useAuth } from "../../contexts/AuthContext";
import { siteConfig } from "../../data/data";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  };

  const handlePrimaryAction = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter your id and password to sign in.");
      return;
    }

    await handleLogin();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handlePrimaryAction();
    }
  };

  return (
    <Container maxWidth={false} disableGutters className="auth-page login-page">
      <Box className="auth-shell">
        <Box className="auth-panel auth-form-panel">
          <Box className="login-copy">
            <Typography variant="h3" className="login-title">
              Log in to {siteConfig.name}
            </Typography>
            <Box className="login-subtitle-row">
              <Typography className="login-subtitle">
                Don&apos;t have an account?
              </Typography>
              <Button
                variant="text"
                className="create-account-link"
                onClick={() => navigate("/signUp")}
              >
                Create an {siteConfig.name} account
              </Button>
            </Box>
          </Box>

          <Box className="login-form-card">
            {error && <Typography className="auth-error">{error}</Typography>}

            <TextField
              fullWidth
              label="UserId"
              variant="standard"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <TextField
              fullWidth
              label="Password"
              variant="standard"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <Button
              fullWidth
              variant="contained"
              className="login-primary-button"
              onClick={handlePrimaryAction}
              endIcon={<ArrowForwardIcon />}
            >
              Sign in
            </Button>

            <Button
              variant="text"
              className="forgot-link"
              onClick={() => navigate("/forgotPassword")}
            >
              Forgot password?
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

export default Login;
