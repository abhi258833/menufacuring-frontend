import { useLocation } from "react-router-dom";
import "./ContentMain.css";
import AppRoutes from "../../routing/AppRoutes";

const ContentMain: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signUp" || location.pathname.startsWith("/register/") || location.pathname.startsWith("/reset-password/") || location.pathname.startsWith("/forgot/")  || location.pathname.startsWith("/forgotPassword") || location.pathname.startsWith("/confirm-email/") || location.pathname.startsWith("/confirm-email-change/");

  return (
    <div
      className={`main-content-holder ${isAuthPage ? "main-content-holder--login" : ""}`}
    >
      <AppRoutes />
    </div>
  );
};

export default ContentMain;
