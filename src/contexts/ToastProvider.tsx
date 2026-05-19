import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const showToast = (message: string, type: "success" | "error" | "info" | "warning") => {
  toast(message, {
    type,
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

const ToastProvider: React.FC = () => {
  return <ToastContainer />;
};

export { ToastProvider, showToast };
