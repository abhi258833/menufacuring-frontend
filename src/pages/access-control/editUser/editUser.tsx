import React, { useEffect, useState } from "react";
import { Modal, Paper, Typography, TextField, IconButton, Box, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getUserById, updateUser } from "../../../api/usermanagement";
import "../addUser/addUser.css";
import Loader from "../../loader/loader";

interface EditUserProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    fetchUsers: () => void;
}

const EditUser: React.FC<EditUserProps> = ({ open, onClose, userId, fetchUsers }) => {
    const [userData, setUserData] = useState({ firstName: "", lastName: "", email: "" });
    const [originalData, setOriginalData] = useState({ firstName: "", lastName: "", email: "" });
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserData(userId);
        }
    }, [userId]);

    const fetchUserData = async (id: string) => {
        setLoading(true);
        try {
            const authToken = localStorage.getItem("authToken") || "";
            const user = await getUserById(id, authToken);
            const userDetails = {
                firstName: user.metadata?.["eperson.firstname"]?.[0]?.value || "",
                lastName: user.metadata?.["eperson.lastname"]?.[0]?.value || "",
                email: user.email || "",
            };
            setUserData(userDetails);
            setOriginalData(userDetails);
        } catch (error) {
            // console.error("Failed to fetch user details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        const updatedFields: any = {};

        if (userData.firstName !== originalData.firstName) {
            updatedFields.firstName = userData.firstName;
        }
        if (userData.lastName !== originalData.lastName) {
            updatedFields.lastName = userData.lastName;
        }
        if (userData.email !== originalData.email) {
            updatedFields.email = userData.email;
        }

        if (Object.keys(updatedFields).length === 0) {
            return;
        }

        setUpdating(true);
        try {
            await updateUser(userId, updatedFields);
            fetchUsers();
            onClose();
        } catch (error) {
            console.error("Failed to update user:", error);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Paper className="modal-paper">
                <div className="modal-header-container">
                    <Typography className="modal-header">Edit User</Typography>
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
                                label="First Name"
                                name="firstName"
                                value={userData.firstName}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                className="custom-textfield"
                            />
                            <TextField
                                label="Last Name"
                                name="lastName"
                                value={userData.lastName}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                className="custom-textfield"
                            />
                            <TextField
                                label="Email"
                                name="email"
                                value={userData.email}
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

export default EditUser;
