
import { useEffect, useState } from "react";
import { Button, Container } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./Home.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Carousel from "../../components/Carousel/Carousel";
import { useNavigate } from "react-router-dom";
import { fetchUserGroupsList } from "../../api/accessManagement";
import { getAuthStatus } from "../../api/authApi";

const Home = () => {
  const navigate = useNavigate();

  const [accessibleCollectionIds, setAccessibleCollectionIds] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);
  const [showMoreCards, setShowMoreCards] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const authToken = localStorage.getItem("authToken");
      setIsLoggedIn(!!authToken);
      if (!authToken) {
        setAccessibleCollectionIds([]);
        setLoading(false);
        return;
      }
      try {
        const userId = await getAuthStatus();
        if (!userId) {
          setAccessibleCollectionIds([]);
          setLoading(false);
          return;
        }
        const groupsData = await fetchUserGroupsList(userId);
        const groupNames = groupsData.groups.map((g: any) => g.name);
        const isAdminUser = groupNames.includes("Administrator");
        // Map of department card collection IDs
        const deptCards = [
          { collectionId: "fa328d39-82ed-4025-b6a9-fa810094e909", name: "Admin" },
          { collectionId: "c9fe3c71-4c08-48ff-8cb3-f863e3801560", name: "HR" },
          { collectionId: "3d696cb9-ec7c-4c8d-8dc3-7342a9157dad", name: "LEGAL" },
          { collectionId: "c582b680-485e-41ba-a331-a7caf27d2f47", name: "Purchase" },
        ];
        const accessibleIds = deptCards.filter(card => {
          const groupNameBase = card.name.replace(/\s+/g, "");
          return (
            isAdminUser ||
            groupNames.includes(`${groupNameBase}_Read`) ||
            groupNames.includes(`${groupNameBase}_Upload`) ||
            groupNames.includes(`${groupNameBase}_Admin`)
          );
        }).map(card => card.collectionId);
        setAccessibleCollectionIds(accessibleIds);
      } catch (e) {
        setAccessibleCollectionIds([]);
      }
      setLoading(false);
    };
    checkAccess();
  }, []);

  const handleCardClick = (collectionId: string, collectionName: string) => {
    if (isLoggedIn) {
      navigate(
        `/adminSearch?page=0&size=10&sort=score%2CDESC&scope=${collectionId}&collectionName=${encodeURIComponent(collectionName)}`
      );
    } else {
      navigate("/login");
    }
  };


  // Department cards data
  const departmentCards = [
    {
      title: "Admin",
      description:
        "Digitize and streamline administrative workflows such as policy management, internal communications, and facility documentation. Ensure centralized access, version control, and secure record storage for smoother operations.",
      collectionId: "fa328d39-82ed-4025-b6a9-fa810094e909",
      class: "card_a",
    },
    {
      title: "HR",
      description:
        "Automate employee record management, attendance logs, training certificates, and performance documents. Enhance data security, streamline onboarding, and ensure compliance with labor regulations through digital HR documentation.",
      collectionId: "c9fe3c71-4c08-48ff-8cb3-f863e3801560",
      class: "card_b",
    },
    {
      title: "LEGAL",
      description:
        "Securely manage contracts, compliance reports, vendor agreements, and audit documentation. Simplify legal workflows with version tracking, digital signatures, and searchable archives for faster retrieval and risk mitigation.",
      collectionId: "3d696cb9-ec7c-4c8d-8dc3-7342a9157dad",
      class: "card_c",
    },
    {
      title: "Purchase",
      description:
        "Digitally organize purchase orders, vendor quotations, invoices, and supply chain documents. Improve procurement efficiency, approval cycles, and vendor collaboration with automated document tracking and centralized data access.",
      collectionId: "c582b680-485e-41ba-a331-a7caf27d2f47",
      class: "card_d",
    },
  ];

  // Filter cards based on access
  const visibleCards = isLoggedIn
    ? departmentCards.filter(card => accessibleCollectionIds.includes(card.collectionId))
    : departmentCards;
  const cardsToShow = showMoreCards ? visibleCards : visibleCards.slice(0, 3);
  const hasMoreCards = visibleCards.length > 3;

  return (
    <Container maxWidth="lg" className="home-container">
      <section className="home-hero" aria-label="Featured updates">
        <div className="home-hero-media" aria-hidden="true">
          <Carousel height="100%" />
        </div>

        <div className="home-hero-copy">
          <span className="home-eyebrow home-eyebrow-accent">Digital manufacturing workspace</span>
          <h1>Find updates, collections, and department spaces in one place.</h1>
          <p>
            The top banner now uses the image slider as its background, while the department area
            remains a separate destination below.
          </p>
        </div>
      </section>

      <section className="home-panel home-department-panel" aria-label="Departments">
        <div className="section-heading">
          <div>
            <span className="section-kicker section-kicker-access">Access</span>
            <h2>Departments</h2>
          </div>
          <p>Browse the available department collections with clearer spacing and stronger cards.</p>
        </div>

        <div className="department-cards-container">
          {loading ? (
            <div className="home-state-message">Loading...</div>
          ) : cardsToShow.length === 0 && isLoggedIn ? (
            <div className="home-state-message">No accessible departments.</div>
          ) : (
            cardsToShow.map((dept, index) => (
              <div className="department-card-wrapper" key={index}>
                <div
                  className={`card ${dept.class} ${!isLoggedIn ? "disabled-card" : ""}`}
                  onClick={() => handleCardClick(dept.collectionId, dept.title)}
                  style={{ cursor: isLoggedIn ? "pointer" : "not-allowed" }}
                >
                  <div className="card-content">
                    <div className="card-title">{dept.title}</div>
                    <div className="card-description">{dept.description}</div>
                    <div className="card-date">28/2/2024</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMoreCards && (
          <div className="home-more-actions">
            <Button
              type="button"
              className="home-more-button"
              variant="contained"
              disableElevation
              endIcon={
                <ExpandMoreIcon
                  className={`home-more-icon ${showMoreCards ? "home-more-icon-expanded" : ""}`}
                />
              }
              onClick={() => setShowMoreCards((current) => !current)}
            >
              {showMoreCards ? "Show Less" : "More"}
            </Button>
          </div>
        )}
      </section>
    </Container>
  );
};

export default Home;
