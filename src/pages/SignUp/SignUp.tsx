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
import { register } from "../../api/authApi";
import { siteConfig } from "../../data/data";
import "../Login/Login.css";
import "./SignUp.css";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = event.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void handleSignUp();
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await register(email);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch {
      setError("Registration failed. Please refresh the page and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={false} disableGutters className="auth-page login-page">
      <Box className="auth-shell">
        <Box className="auth-panel auth-form-panel">
          <Box className="login-copy">
            <Typography variant="h3" className="login-title">
              Create an account for {siteConfig.name}
            </Typography>
            <Box className="login-subtitle-row">
              <Typography className="login-subtitle">
                Already have an account?
              </Typography>
              <Button
                variant="text"
                className="create-account-link"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
            </Box>
          </Box>

          <Box className="login-form-card">
            {error && <Typography className="auth-error">{error}</Typography>}

            <TextField
              fullWidth
              label="Email Address"
              variant="standard"
              value={email}
              onChange={handleEmailChange}
              onKeyDown={handleKeyDown}
              error={email.length > 0 && !isValidEmail}
              helperText={email.length > 0 && !isValidEmail ? "Enter a valid email address" : ""}
              InputLabelProps={{ shrink: true }}
              className="login-input"
            />

            <Button
              fullWidth
              variant="contained"
              className="login-primary-button"
              onClick={handleSignUp}
              disabled={!isValidEmail || loading}
              endIcon={<ArrowForwardIcon />}
            >
              Create account
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

export default SignUp;
