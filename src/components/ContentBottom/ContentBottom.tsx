import React from "react";
import { Container, Grid, IconButton } from "@mui/material";
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6"; // Using FaXTwitter for X logo
import "./ContentBottom.css";

const footerData = {
  socialMedia: [
    { id: 1, title: "Facebook", icon: <FaFacebookF />, link: "https://www.facebook.com/Optimark/" },
    { id: 2, title: "X", icon: <FaXTwitter />, link: "https://x.com/Optimark" },
    { id: 3, title: "Instagram", icon: <FaInstagram />, link: "https://www.instagram.com/Optimark/?hl=en" },
    { id: 4, title: "YouTube", icon: <FaYoutube />, link: "https://www.youtube.com/user/OptimarkTheMedicity" },
  ],
};

const ContentBottom: React.FC = () => {
  return (
    <footer className="custom-footer">
      <Container maxWidth="lg">
        <Grid
          container
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          wrap="nowrap"
          className="footer-grid"
        >
          <Grid item xs="auto">
            <p tabIndex={0} style={{ margin: 0, whiteSpace: "nowrap" }}>
              © Copyright 2025{" "}
              <a
                href="https://techbets.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: "bold", color: "#2563eb", textDecoration: "none" }}
              >
                techbetsinfotech
              </a>{" "}
              All Rights Reserved.
            </p>
          </Grid>
          <Grid item xs>
            <Grid container spacing={1} justifyContent="flex-end" wrap="nowrap" className="social-icons">
              {footerData.socialMedia.map((social) => (
                <Grid item key={social.id}>
                  <IconButton
                    href={social.link}
                    target="_blank"
                    style={{
                      color: "#fff",
                      backgroundColor: "#333",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      overflow: "hidden",
                      padding: 0,
                      transition: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {social.icon}
                  </IconButton>

                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </footer>
  );
};

export default ContentBottom;
