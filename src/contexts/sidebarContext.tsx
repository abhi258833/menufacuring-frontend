import { createContext, useReducer, ReactNode, useContext } from "react";
import sidebarReducer from "../reducer/sidebarReducer";

interface SidebarState {
  isSidebarOpen: boolean;
}

interface SidebarContextType extends SidebarState {
  toggleSidebar: () => void;
}

const initialState: SidebarState = {
  isSidebarOpen: false,
};

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sidebarReducer, initialState);

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  return (
    <SidebarContext.Provider value={{ ...state, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};
