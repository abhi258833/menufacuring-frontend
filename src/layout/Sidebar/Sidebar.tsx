import { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import { personsImgs } from "../../utils/images";
import {
  getNavigationLinks,
  NavigationLink,
  siteConfig,
} from "../../data/data";
import { SidebarContext } from "../../contexts/sidebarContext";
import { FaChevronDown, FaChevronRight, FaTimes } from "react-icons/fa";
import {
  FiActivity,
  FiDatabase,
  FiEdit3,
  FiFolder,
  FiFolderPlus,
  FiGrid,
  FiHome,
  FiLayers,
  FiSearch,
  FiSettings,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import "./Sidebar.css";
import { fetchCollections as fetchCommunityCollections, fetchCommunities, fetchUserGroupsList } from "../../api/accessManagement";
import { getAuthStatus } from "../../api/authApi";
import { useUserGroups } from "../../contexts/groupTypeContext";

const Sidebar: React.FC = () => {
  const [navigationLinks, setNavigationLinks] = useState<NavigationLink[]>([]);
  const [openSubMenuIdx, setOpenSubMenuIdx] = useState<number | null>(null);
  const context = useContext(SidebarContext);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  if (!context) throw new Error("Sidebar must be used within a SidebarProvider");
  const { isSidebarOpen, toggleSidebar } = context;

  const { groupCategories, isAdministrator } = useUserGroups();

  const getSidebarIcon = (title: string): IconType => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle === "home") return FiHome;
    if (normalizedTitle.includes("user")) return FiUsers;
    if (normalizedTitle.includes("group")) return FiShield;
    if (normalizedTitle.includes("search")) return FiSearch;
    if (normalizedTitle.includes("system")) return FiSettings;
    if (normalizedTitle.includes("process")) return FiActivity;
    if (normalizedTitle.includes("workflow")) return FiLayers;
    if (normalizedTitle.includes("report")) return FiGrid;
    if (normalizedTitle.includes("audit")) return FiActivity;
    if (normalizedTitle.includes("metadata")) return FiDatabase;
    if (normalizedTitle.includes("batch")) return FiFolderPlus;
    if (normalizedTitle.includes("edit")) return FiEdit3;
    if (normalizedTitle.includes("community")) return FiLayers;
    if (normalizedTitle.includes("collection")) return FiFolder;
    if (normalizedTitle.includes("item")) return FiFolderPlus;

    return FiFolder;
  };

  const renderNavIcon = (title: string) => {
    const Icon = getSidebarIcon(title);
    return <Icon />;
  };

  const isLinkActive = (link: NavigationLink) => {
    if (link.submenu?.some((subLink) => isLinkActive(subLink))) {
      return true;
    }

    const currentPath = location.pathname;
    const linkUrl = new URL(link.path, window.location.origin);
    const linkPath = linkUrl.pathname;

    if (linkPath === "/") {
      return currentPath === "/";
    }

    return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authToken = localStorage.getItem("authToken");

    if (authToken) {
      const userId = await getAuthStatus();
      if (userId) {
        const groupsData = await fetchUserGroupsList(userId);
        const groupNames = groupsData.groups.map((g: any) => g.name);

        const isAdminUser = groupNames.includes("Administrator");
        localStorage.setItem("isAdmin", JSON.stringify(isAdminUser));

        const communities = await fetchCommunities();
        const dynamicLinks: NavigationLink[] = [];

        for (const community of communities) {
          const communityCollections = await fetchCommunityCollections(community.id);

          communityCollections.forEach((collection, index) => {
            const name = collection.metadata?.["dc.title"]?.[0]?.value || "Collection";
            const basePath = `/collections/${name.toLowerCase()}`;
            const groupNameBase = name.replace(/\s+/g, "");

            const canRead =
              isAdminUser || groupNames.includes(`${groupNameBase}_Read`);
            const canUpload =
              isAdminUser || groupNames.includes(`${groupNameBase}_Upload`);
            const isCollectionAdmin =
              isAdminUser || groupNames.includes(`${groupNameBase}_Admin`);

            if (canRead || canUpload || isCollectionAdmin) {
              const submenu: NavigationLink[] = [];

              if (canRead || isCollectionAdmin || canUpload) {
                submenu.push({
                  id: ((100 + index) + 1) * 10 + 1,
                  title: "Metadata Search",
                  path: `/adminSearch?page=0&size=10&sort=score%2CDESC&scope=${collection.id}`,
                  collectionId: collection.id,
                });
              }

              if (canUpload || isCollectionAdmin) {
                submenu.push({
                  id: ((100 + index) + 1) * 10 + 3,
                  title: "Create Item",
                  path: `/collections/${collection.id}/create-item`,
                  collectionId: collection.id,
                });
              }

              dynamicLinks.push({
                id: (100 + index) + 9,
                title: name.charAt(0).toUpperCase() + name.slice(1),
                path: basePath,
                submenu,
              });
            }
          });
        }

        const baseLinks = getNavigationLinks(isAdministrator, groupCategories);

        const filteredLinks = isAdminUser
          ? baseLinks
          : baseLinks.filter(
              (link) =>
                ![
                  "User Management",
                  "Groups",
                  "Admin Search",
                  "Create Community",
                  "Create Collection",
                  "Reports",
                  "Processes",
                ].includes(link.title)
            );

        setNavigationLinks([...filteredLinks, ...dynamicLinks]);
      }
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAdmin");
    }
  };

  useEffect(() => {
    checkAuth();
  }, [isSidebarOpen]);

  useEffect(() => {
    const activeParent = navigationLinks.find((link) =>
      link.submenu?.some((subLink) => isLinkActive(subLink))
    );

    if (activeParent) {
      setOpenSubMenuIdx(activeParent.id);
    }
  }, [location.pathname, navigationLinks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        toggleSidebar();
      }
    };
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen, toggleSidebar]);

    const resolveAdminSearchPath = (path: string) => {
      if (path !== "/adminSearch") {
        return path;
      }
      return path;
    };

    const handleNavigation = (path: string) => {
     window.location.href = resolveAdminSearchPath(path);
     toggleSidebar();
  };

   const toggleSubMenu = (id: number) => {
    setOpenSubMenuIdx(openSubMenuIdx === id ? null : id);
  };

  // Organize navigation links into sections
  const menuLinks = navigationLinks.filter((link) =>
    ["Search", "Item", "Community", "Collection"].includes(link.title)
  );
  
  const generalLinks = navigationLinks.filter((link) =>
    !["Search", "Item", "Community", "Collection"].includes(link.title)
  );

  return (
    <>
      {isSidebarOpen && <div className="sidebar-backdrop" />}
      <div className={`sidebar ${isSidebarOpen ? "" : "sidebar-change"}`} ref={sidebarRef}>
        <button className="close-btn" onClick={toggleSidebar}>
          <FaTimes />
        </button>


        <div className="sidebar-header">
          <div className="brand-logo">
            <img src={personsImgs.brand_two} alt="logo" className="logo-img" />
          </div>
          <h1 className="brand-name">{siteConfig.name}</h1>
        </div>

        <nav className="navigation">
          {menuLinks.length > 0 && (
            <div className="nav-section">
              <h2 className="section-title">MENU</h2>
              <ul className="nav-list">
                {menuLinks.map((navigationLink) => (
                  <li className="nav-item" key={navigationLink.id}>
                    <a
                      href="#"
                      className={`nav-link ${isLinkActive(navigationLink) ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (navigationLink.submenu) {
                          toggleSubMenu(navigationLink.id);
                        } else {
                          handleNavigation(navigationLink.path);
                        }
                      }}
                    >
                      <span className="nav-link-icon" aria-hidden="true">
                        {renderNavIcon(navigationLink.title)}
                      </span>
                      <span className="nav-link-text">{navigationLink.title}</span>
                      {navigationLink.submenu && (
                        <span className="submenu-toggle">
                          {openSubMenuIdx === navigationLink.id ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                      )}
                    </a>

                    {navigationLink.submenu && openSubMenuIdx === navigationLink.id && (
                      <ul className="submenu">
                        {navigationLink.submenu.map((subLink) => (
                          <li key={subLink.id}>
                            <a
                              href="#"
                              className={`submenu-link ${isLinkActive(subLink) ? "active" : ""}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleNavigation(subLink.path);
                              }}
                            >
                              {subLink.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {generalLinks.length > 0 && (
            <div className="nav-section">
              <h2 className="section-title">GENERAL</h2>
              <ul className="nav-list">
                {generalLinks.map((navigationLink) => (
                  <li className="nav-item" key={navigationLink.id}>
                    <a
                      href="#"
                      className={`nav-link ${isLinkActive(navigationLink) ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (navigationLink.submenu) {
                          toggleSubMenu(navigationLink.id);
                        } else {
                          handleNavigation(navigationLink.path);
                        }
                      }}
                    >
                      <span className="nav-link-icon" aria-hidden="true">
                        {renderNavIcon(navigationLink.title)}
                      </span>
                      <span className="nav-link-text">{navigationLink.title}</span>
                      {navigationLink.submenu && (
                        <span className="submenu-toggle">
                          {openSubMenuIdx === navigationLink.id ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                      )}
                    </a>

                    {navigationLink.submenu && openSubMenuIdx === navigationLink.id && (
                      <ul className="submenu">
                        {navigationLink.submenu.map((subLink) => (
                          <li key={subLink.id}>
                            <a
                              href="#"
                              className={`submenu-link ${isLinkActive(subLink) ? "active" : ""}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleNavigation(subLink.path);
                              }}
                            >
                              {subLink.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
