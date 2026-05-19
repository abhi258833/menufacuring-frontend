import React, { useState } from "react";
import { TextField, Button, Box, Typography, Modal, Paper, IconButton } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./addUser.css";
import CloseIcon from "@mui/icons-material/Close";
import { addUser } from "../../../api/usermanagement";
import Loader from "../../loader/loader";
import AccessManagement from "../accessManagement/accessManagement";
import { addMemberToGroup } from "../../../api/group";
import { showToast } from "../../../contexts/ToastProvider";

interface AddUserProps {
    open: boolean;
    onClose: () => void;
    fetchUsers: () => void;
}

const AddUser: React.FC<AddUserProps> = ({ open, onClose, fetchUsers }) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false)
    const [accessModalOpen, setAccessModalOpen] = useState<boolean>(false);
    const [selectedGroups, setSelectedGroups] = useState<{ uuid: string; groupName: string }[]>([]);
    const [errors, setErrors] = useState({
        firstname: false,
        lastname: false,
        email: false,
        emailFormat: false,
        password: false,
        confirmPassword: false,
        passwordMismatch: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate field
        if (name === "email") {
            setErrors(prev => ({
                ...prev,
                email: value.trim() === "",
                emailFormat: !emailRegex.test(value) && value.trim() !== ""
            }));
        } else if (name === "password") {
            setErrors(prev => ({
                ...prev,
                password: value.trim() === "",
                passwordMismatch: formData.confirmPassword !== "" && value !== formData.confirmPassword
            }));
        } else if (name === "confirmPassword") {
            setErrors(prev => ({
                ...prev,
                confirmPassword: value.trim() === "",
                passwordMismatch: formData.password !== "" && value !== formData.password
            }));
        } else {
            setErrors(prev => ({
                ...prev,
                [name]: value.trim() === ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            firstname: formData.firstname.trim() === "",
            lastname: formData.lastname.trim() === "",
            email: formData.email.trim() === "",
            emailFormat: !emailRegex.test(formData.email) && formData.email.trim() !== "",
            password: formData.password.trim() === "",
            confirmPassword: formData.confirmPassword.trim() === "",
            passwordMismatch: formData.password !== formData.confirmPassword
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const isValid = validateForm();
        if (!isValid) {
            let errorMessage = "Please fill all required fields before submitting.";
            if (errors.emailFormat) {
                errorMessage = "Please enter a valid email address";
            } else if (errors.passwordMismatch) {
                errorMessage = "Passwords do not match";
            }
            showToast(errorMessage, 'error');
            return;
        }

        const userData = {
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            firstname: formData.firstname,
            lastname: formData.lastname,
            metadata: {
                "eperson.firstname": [
                    { value: formData.firstname }
                ],
                "eperson.lastname": [
                    { value: formData.lastname }
                ]
            },
            canLogIn: true,
            requireCertificate: false,
            selfRegistered: true,
            type: "eperson"
        };

        try {
            setLoading(true);
            const createdUser = await addUser(userData) as { id: string };

            if (selectedGroups.length > 0) {
                await Promise.all(
                    selectedGroups.map(group =>
                        addMemberToGroup(group.uuid, createdUser.id)
                    )
                );
            }
            fetchUsers();
            onClose();
            setFormData({
                firstname: "",
                lastname: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
            setSelectedGroups([]);
        } catch (error) {
            toast.error("Failed to add user. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAccess = () => {
        setAccessModalOpen(true);
    }

    const handleAccessSubmit = (groups?: { uuid: string; groupName: string }[]) => {
        if (groups) {
            setSelectedGroups(groups);
        }
        setAccessModalOpen(false);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Paper className="modal-paper">
                <div className="modal-header-container">
                    <Typography className="modal-header">Add New User</Typography>
                    <IconButton onClick={onClose} className="close-icon">
                        <CloseIcon />
                    </IconButton>
                </div>
                {loading && <Loader />}
                <Box component="form" className="modal-form">
                    <TextField
                        label="First Name"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        fullWidth
                        required
                        className="custom-textfield"
                        error={errors.firstname}
                        helperText={errors.firstname ? "First name is required" : ""}
                    />

                    <TextField
                        label="Last Name"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        fullWidth
                        required
                        className="custom-textfield"
                        error={errors.lastname}
                        helperText={errors.lastname ? "Last name is required" : ""}
                    />

                    <TextField
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        fullWidth
                        required
                        className="custom-textfield"
                        error={errors.email || errors.emailFormat}
                        helperText={
                            errors.email ? "Email is required" : ''
                        }
                    />

                    <TextField
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        fullWidth
                        required
                        className="custom-textfield"
                        error={errors.password || errors.passwordMismatch}
                        helperText={errors.password ? "Password is required" : errors.passwordMismatch ? "Passwords do not match" : ""}
                    />

                    <TextField
                        label="Confirm Password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        type="password"
                        fullWidth
                        required
                        className="custom-textfield"
                        error={errors.confirmPassword || errors.passwordMismatch}
                        helperText={errors.confirmPassword ? "Confirm password is required" : errors.passwordMismatch ? "Passwords do not match" : ""}
                    />
                    <Box sx={{ display: 'flex' }}>
                        <button
                            type="button"
                            onClick={handleAccess}
                            className="add-user-btn"
                            style={{ position: 'relative', right: '12px', marginTop: '30px' }}
                        >
                            <span className="btn-text">Collection Wise Permission</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="add-user-btn"
                            style={{ position: 'relative', left: '12px', marginTop: '30px' }}>
                            <span className="btn-text">Add User</span>
                            <span className="btn-icon">→</span>
                        </button>
                    </Box>
                </Box>
                <AccessManagement
                    open={accessModalOpen}
                    onClose={handleAccessSubmit}
                    userId={null}
                />
            </Paper>
        </Modal>
    );
};

export default AddUser;