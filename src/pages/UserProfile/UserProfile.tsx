import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Person, Email } from '@mui/icons-material';
import { getUserById, updateUser } from '../../api/usermanagement';
import ChangePassword from './changePassword';
import { showToast } from '../../contexts/ToastProvider';

type UserProfileProps = {
  userId: string;
};

type UserDetails = {
  firstName: string;
  lastName: string;
  email: string;
};

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {

  const [userData, setUserData] = useState<UserDetails>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [originalData, setOriginalData] = useState<UserDetails>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  const fetchUserData = async (id: string) => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || '';
      const user = await getUserById(id, authToken);
      const userDetails: UserDetails = {
        firstName: user.metadata?.['eperson.firstname']?.[0]?.value || '',
        lastName: user.metadata?.['eperson.lastname']?.[0]?.value || '',
        email: user.email || '',
      };
      setUserData(userDetails);
      setOriginalData(userDetails);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserDetails, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const changes: Partial<UserDetails> = {};

    if (userData.firstName !== originalData.firstName) {
      changes.firstName = userData.firstName;
    }
    if (userData.lastName !== originalData.lastName) {
      changes.lastName = userData.lastName;
    }
    if (userData.email !== originalData.email) {
      changes.email = userData.email;
    }

    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      return;
    }

    setUpdating(true);
    try {
      await updateUser(userId, changes);
      showToast("User updated successfully!", "success");
      window.location.reload(); // 🔄 reload after success
    } catch (error) {
      console.error('Failed to update user:', error);
      showToast("Failed to update user", "error");
    } finally {
      setUpdating(false);
    }
  };


  const handleResetPassword = () => {
    setEditUserModalOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        width: '100%',
        maxWidth: '500px',
        minHeight: 430,
        mx: 'auto',
        mt: 6,
        mb: 6,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Gradient Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6e00ff, #b72eff)',
          textAlign: 'center',
          p: 3,
          position: 'relative',
        }}
      >
        {/* Edit Button at Top Right */}
        {!isEditing && (
          <Button
            variant="contained"
            onClick={() => setIsEditing(true)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              borderRadius: 3,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6e00ff, #b72eff)',
              boxShadow: 'none',
            }}
          >
            Edit Profile
          </Button>
        )}

        <Avatar
          sx={{
            mx: 'auto',
            mt: 2,
            width: 72,
            height: 72,
            bgcolor: 'white',
            color: '#6e00ff',
          }}
        >
          <Person />
        </Avatar>
        <Typography className="profile_header" variant="h5" color="white">
          {userData.firstName} {userData.lastName}
        </Typography>
      </Box>

      {/* Profile Info */}
      <Box p={4}>
        {[
          {
            icon: <Person color="primary" />,
            label: 'First Name',
            value: userData.firstName,
            key: 'firstName',
          },
          {
            icon: <Person color="primary" />,
            label: 'Last Name',
            value: userData.lastName,
            key: 'lastName',
          },
          {
            icon: <Email color="primary" />,
            label: 'Email',
            value: userData.email,
            key: 'email',
          },
        ].map(({ icon, label, value, key }) => (
          <Box key={key} display="flex" alignItems="center" mb={3}>
            <Box mr={2}>{icon}</Box>
            {isEditing ? (
              <TextField
                label={label}
                value={userData[key as keyof UserDetails]}
                onChange={(e) => handleChange(key as keyof UserDetails, e.target.value)}
                variant="standard"
                fullWidth
              />
            ) : (
              <Typography>{value}</Typography>
            )}
          </Box>
        ))}

        {/* Buttons */}
        <Box mt={5} textAlign="center">
          <Button
            onClick={handleResetPassword}
            variant="outlined"
            color="error"
            sx={{ textTransform: 'none', borderRadius: 3, mb: 2 }}
          >
            Change Password
          </Button>
          <br />
          {isEditing && (
            <>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  mr: 2,
                  borderRadius: 3,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6e00ff, #b72eff)',
                }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{ borderRadius: 3, textTransform: 'none' }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>
      <ChangePassword
        open={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        userId={userId || ""}
      />
    </Paper>
  );
};

export default UserProfile;