import React, { useEffect, useState } from "react";
import { Modal, Paper, Typography, TextField, IconButton, Box, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Loader from "../loader/loader";
import { changePassword } from "../../api/forgotPassword";
import { showToast } from "../../contexts/ToastProvider";
import { useNavigate } from "react-router-dom";

interface EditUserProps {
    open: boolean;
    onClose: () => void;
    userId: string;
}

const ChangePassword: React.FC<EditUserProps> = ({ open, onClose,userId }) => {
    const [userData, setUserData] = useState({ password: "", newPassword: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const Navigate = useNavigate()


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
         try{
            setLoading(true);
            setUpdating(true);
           const response = await changePassword(userId,userData.password,userData.newPassword)
           if(response?.status === 200){
            showToast('Your changes to the password were saved.',"success")
           }
           Navigate(`/userProfile/${userId}`)
         }catch(error){
            showToast('Given information is wrong,try Again','error')
         }finally{
            setLoading(false);
            setUpdating(false);
         }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Paper className="modal-paper">
                <div className="modal-header-container">
                    <Typography className="modal-header">Change Password</Typography>
                    <IconButton onClick={onClose} className="close-icon">
                        <CloseIcon />
                    </IconButton>
                </div>
                <Box component="form" className="modal-form">
                    {loading ? (
                        <Loader />
                    ) : (
                        <>
                            <TextField
                                label="Current Password"
                                name="password"
                                value={userData.password}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                className="custom-textfield"
                            />
                            <TextField
                                label="New Password"
                                name="newPassword"
                                value={userData.newPassword}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                className="custom-textfield"
                            />
                            <TextField
                                label="Confirm New Password"
                                name="confirmPassword"
                                value={userData.confirmPassword}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                className="custom-textfield"
                            />
                        </>
                    )}
                    <Box className="modal-footer">
                        <button type="button" className="add-user-btn" onClick={handleUpdate} disabled={updating || loading}>
                            <span className="btn-text">{updating ? "Updating..." : "Update"}</span>
                            <span className="btn-icon">→</span>
                        </button>
                    </Box>
                </Box>
            </Paper>
        </Modal>
    );
};

export default ChangePassword;
