import { iconsImgs } from "../../utils/images";
import { useNavigate } from "react-router-dom";
import { personsImgs } from "../../utils/images";
import "./ContentTop.css";
import { useContext, useState, useEffect } from "react";
import { SidebarContext } from "../../contexts/sidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import { Box, IconButton, InputAdornment, Menu, MenuItem, TextField, Drawer } from "@mui/material";
import { getAuthStatus } from "../../api/authApi";
import { showToast } from "../../contexts/ToastProvider";
import { getUserById } from "../../api/usermanagement";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import SearchBar from "../SearchBar/SearchBar";

const ContentTop: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const context = useContext(SidebarContext);
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!context) {
    throw new Error("ContentTop must be used within a SidebarProvider");
  }

  const { toggleSidebar } = context;

  useEffect(() => {
    const fetchUUID = async () => {
      try {
        const uuid = await getAuthStatus();
        if (uuid) {
          setUserId(uuid);
        }
      } catch (error) {
        console.error("Error fetching UUID:", error);
      }
    };

    fetchUUID();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  const toCamelCase = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fetchUserData = async (id: string) => {
    try {
      const authToken = localStorage.getItem("authToken") || "";
      const user = await getUserById(id, authToken);
      const rawFirstName = user.metadata?.["eperson.firstname"]?.[0]?.value || "";
      const fName = toCamelCase(rawFirstName);
      setFirstName(fName);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const submitSearch = (query?: string) => {
    const trimmedQuery = (query ?? searchQuery).trim();

    if (trimmedQuery) {
      const encodedQuery = encodeURIComponent(trimmedQuery);
      navigate(`/adminSearch?page=0&size=10&query=${encodedQuery}&sort=score%2CDESC`);
      setSearchQuery("");
      setIsSearchOpen(false);
      setIsDrawerOpen(false);
    }
  };

  const handleSearchClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    } else {
      if (searchQuery.trim()) {
        submitSearch();
      } else {
        setIsSearchOpen(false);
      }
    }
  };

  const handleCloseClick = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      showToast("Logout failed. Please try again.", "error");
    }
    handleClose();
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <div className="main-content-top">
      <div className="content-top-left">
        {isAuthenticated && (
          <button
            type="button"
            className="sidebar-toggler"
            onClick={toggleSidebar}
          >
            <img src={iconsImgs.menu} alt="Menu" className="w-6 h-6" />
          </button>
        )}
        <div className="brand-lockup" onClick={() => navigate("/")}>
          <img
            className="brand-logo"
            src={personsImgs.brand_one}
            alt="profile"
          />
        </div>
      </div>
      <Box className="content-top-actions" display="flex" alignItems="center" gap={2}>
        {/* Desktop Navigation and Search (Visible >= 768px) */}
        <Box className="desktop-actions" display={{ xs: "none", md: "flex" }} alignItems="center" gap={2}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={submitSearch}
            placeholder="What are you looking for?"
            variant="header"
            enableVoiceSearch
          />
          <button
            className="nav-link-btn top-nav-btn"
            onClick={() => navigate("/about")}
          >
            <span>About</span>
          </button>
          <button
            className="nav-link-btn top-nav-btn"
            onClick={() => navigate("/contact")}
          >
            <span>Contact</span>
          </button>
          {isAuthenticated ? (
            <>
              <button
                className="profile-btn welcome-btn"
                onClick={handleClick}
                aria-label="Open profile menu"
              >
                <ManageAccountsRoundedIcon fontSize="small" />
                <KeyboardArrowDownRoundedIcon fontSize="small" />
              </button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                disableScrollLock
                PaperProps={{
                  sx: {
                    bgcolor: '#FFFFFF',
                    color: '#1F2937',
                    minWidth: 220,
                    border: '1px solid #eef2f5',
                    borderTop: '5px solid #8b5cf6',
                    borderRadius: 0,
                    mt: 1,
                    boxShadow: '0 18px 32px rgba(15, 23, 42, 0.10)',
                  },
                }}
              >
                <MenuItem
                  sx={{
                    cursor: 'default',
                    pointerEvents: 'none',
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    py: 1.5,
                    px: 2,
                    borderBottom: '1px solid #eef2f5',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'transparent !important',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Welcome,</span>
                  <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 600 }}>
                    {firstName || "User"}
                  </span>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (userId) {
                      navigate(`/userProfile/${userId}`);
                      handleClose();
                    } else {
                      showToast("User ID not available", "error");
                    }
                  }}
                  sx={{
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    color: '#1F2937',
                    py: 1.2,
                    px: 2,
                    fontSize: 14,
                    '&:hover': {
                      bgcolor: '#f5f0ff',
                      color: '#8b5cf6',
                    },
                  }}
                >
                  View Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (userId) {
                      navigate(`/userCart/${userId}`);
                      handleClose();
                    } else {
                      showToast("User ID not available", "error");
                    }
                  }}
                  sx={{
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    color: '#1F2937',
                    py: 1.2,
                    px: 2,
                    fontSize: 14,
                    '&:hover': {
                      bgcolor: '#f5f0ff',
                      color: '#8b5cf6',
                    },
                  }}
                >
                  My List
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    color: '#1F2937',
                    py: 1.2,
                    px: 2,
                    fontSize: 14,
                    '&:hover': {
                      bgcolor: '#f5f0ff',
                      color: '#8b5cf6',
                    },
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <button
              className="login-btn content-top-btn"
              onClick={() => navigate("/login")}
            >
              <span>Login</span>
              <KeyboardArrowDownRoundedIcon fontSize="small" />
            </button>
          )}
        </Box>
        {/* Hamburger Menu for Mobile (< 768px) */}
        <Box display={{ xs: "flex", md: "none" }} alignItems="center">
          <IconButton
            className="mobile-menu-trigger"
            onClick={toggleDrawer}
            sx={{
              color: '#48697D',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D8E2E8',
              '&:hover': {
                backgroundColor: '#EDF4F7',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Drawer for Mobile Menu */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F7FAFC 100%)',
            color: '#1F2937',
            width: '75%',
            maxWidth: '300px',
            padding: 2,
            fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
          },
        }}
      >
        <Box className="mobile-drawer-content" display="flex" flexDirection="column" gap={2} p={2}>
          <IconButton
            onClick={toggleDrawer}
            sx={{
              alignSelf: 'flex-end',
              color: '#48697D',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D8E2E8',
            }}
          >
            <CloseIcon />
          </IconButton>
          {isSearchOpen ? (
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitSearch();
                }
              }}
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                '& .MuiInputBase-input': {
                  fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                },
                '& .MuiInputBase-root': {
                  fontSize: 14,
                  paddingY: 0,
                  borderRadius: '14px',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#D8E2E8',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#96C2DB',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      onClick={handleSearchClick}
                      sx={{ p: 0.5, color: '#5F7483' }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleCloseClick}
                      sx={{ p: 0.5, color: '#5F7483' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ) : (
            <IconButton
              className="top-icon-btn"
              onClick={handleSearchClick}
              sx={{
                color: '#5F7483',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D8E2E8',
                '&:hover': {
                  backgroundColor: '#EDF4F7',
                },
              }}
            >
              <SearchIcon />
            </IconButton>
          )}
          <button
            className="nav-link-btn mobile-nav-btn"
            onClick={() => {
              navigate("/about");
              toggleDrawer();
            }}
          >
            About Us
          </button>
          <button
            className="nav-link-btn mobile-nav-btn"
            onClick={() => {
              navigate("/contact");
              toggleDrawer();
            }}
          >
            Contact Us
          </button>
          {isAuthenticated ? (
            <>
              <button
                className="nav-link-btn mobile-nav-btn mobile-user-label"
              >
                Welcome, {firstName || "User"}
              </button>
              <button
                className="nav-link-btn mobile-nav-btn"
                onClick={() => {
                  if (userId) {
                    navigate(`/userProfile/${userId}`);
                    toggleDrawer();
                  } else {
                    showToast("User ID not available", "error");
                  }
                }}
              >
                View Profile
              </button>a
              <button
                className="nav-link-btn mobile-nav-btn"
                onClick={() => {
                  if (userId) {
                    navigate(`/userCart/${userId}`);
                    toggleDrawer();
                  } else {
                    showToast("User ID not available", "error");
                  }
                }}
              >
                My List
              </button>
              <button
                className="nav-link-btn mobile-nav-btn"
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    showToast("Logout failed. Please try again.", "error");
                  }
                  toggleDrawer();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="mobile-login-btn"
              onClick={() => {
                navigate("/login");
                toggleDrawer();
              }}
            >
              Login
            </button>
          )}
        </Box>
      </Drawer>
    </div>
  );
};

export default ContentTop;
