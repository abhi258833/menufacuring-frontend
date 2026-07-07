import { Outlet } from "react-router-dom";
import "./ProtectedLayout.css";

const ProtectedLayout = () => {
  return (
    <div className="main-content-holder">
      <Outlet />
    </div>
  );
};

export default ProtectedLayout;