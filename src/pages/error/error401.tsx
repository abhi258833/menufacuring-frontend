import React from 'react';
import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";
import "./ErrorPages.css";

const Error401 = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth={false} disableGutters className="auth-page login-page">
      <Box className="auth-shell">
        <Box className="auth-panel auth-form-panel">
          <Box className="login-copy">
            <Typography variant="h1" className="error-code" style={{ color: '#d97706' }}>
              401
            </Typography>
            <Typography variant="h3" className="login-title">
              Unauthorized Access
            </Typography>
            <Typography className="login-subtitle">
              You must log in to access this page.
            </Typography>
          </Box>

          <Box className="error-details-container">
            <Box className="error-btn-group">
              <Button
                variant="contained"
                className="error-primary-btn"
                style={{ background: '#d97706' }}
                onClick={() => navigate('/login')}
              >
                🔑 Log In
              </Button>
              
              <Button
                variant="outlined"
                className="error-secondary-btn"
                onClick={() => navigate('/')}
              >
                🏠 Go to Home
              </Button>
            </Box>
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

export default Error401;
