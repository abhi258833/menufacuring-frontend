import { useLocation } from "react-router-dom";
import "./Content.css";
import ContentTop from '../../components/ContentTop/ContentTop';
import ContentMain from '../../components/ContentMain/ContentMain';
import ContentBottom from "../../components/ContentBottom/ContentBottom";

const Content: React.FC = () => {
  const location = useLocation();
  const authRoutes = ["/login", "/signUp", "/forgotPassword"];
  const isAuthRoute =
    authRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/forgot/") ||
    location.pathname.startsWith("/register/");
  const hideHeaderFooter =
    location.pathname === "/flip-book-viewer" ||
    location.pathname === "/pdf-viewer" ||
    isAuthRoute;

  return (
    <div className={`main-content ${isAuthRoute ? "auth-layout" : ""}`}>
      <div className={`content ${isAuthRoute ? "content--auth" : ""}`}>
        {!hideHeaderFooter && <ContentTop />}
        <ContentMain />
      </div>
      {!hideHeaderFooter && <ContentBottom />}
    </div>
  );
};

export default Content;
