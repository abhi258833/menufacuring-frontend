import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
} from "@mui/material";
import { removeUser, userList } from "../../api/usermanagement";
import { EPerson } from "../../api/usermanagement";
import AddUser from "./addUser/addUser";
import EditUser from "./editUser/editUser";
import "./userManagement.css";
import { iconsImgs } from "../../utils/images";
import AccessManagement from "./accessManagement/accessManagement";
import { showToast } from "../../contexts/ToastProvider";
import SearchBar from "../../components/SearchBar/SearchBar";

const UserManagement = () => {
  const [users, setUsers] = useState<EPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editUserModalOpen, setEditUserModalOpen] = useState<boolean>(false);
  const [accessModalOpen, setAccessModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<EPerson | null>(null);
  const [page, setPage] = useState<number>(1);
  const [size] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchUsers = async (page: number, size: number, query: string) => {
    setLoading(true);
    try {
      const data = await userList(page - 1, size, query);
      setUsers(data.epersons);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, size, searchQuery);
  }, [page, size]);

  const handleDeleteClick = (user: EPerson) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (userId: string) => {
    setSelectedUserId(userId);
    setEditUserModalOpen(true);
  };

  const handleAcessClick = (userId: string) => {
    setSelectedUserId(userId);
    setAccessModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      const success = await removeUser(selectedUser.id);
      if (success) {
        await fetchUsers(page, size, searchQuery);
      }
      setDeleteModalOpen(false);
    }
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  return (
    <Container className="top_padding">
      <Grid container justifyContent="space-between" alignItems="center" className="header_epeople">
        <Typography variant="h4" sx={{ mb: 1 }}>
          User Administration
        </Typography>
        <Button variant="contained" color="success" onClick={() => setAddUserModalOpen(true)}>
          + Add User
        </Button>
      </Grid>


      <Grid container alignItems="center" className="search-container">
        <Grid item xs={12}>
          <SearchBar
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            onSubmit={(query) => {
              const q = query ?? searchQuery;
              setSearchQuery(q);
              setPage(1);
              fetchUsers(1, size, q);
            }}
            placeholder="Search people..."
            variant="page"
            fullWidth
            showCloseButton
            onClear={() => {
              setSearchQuery("");
              setPage(1);
              fetchUsers(1, size, "");
            }}
          />
        </Grid>
      </Grid>


      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto", my: 3 }} />
      ) : (
        <>
          <TableContainer
  component={Paper}
  sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}
>
  <Table>
    <TableHead>
      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
        <TableCell><b>First Name</b></TableCell>
        <TableCell><b>Last Name</b></TableCell>
        <TableCell><b>Email</b></TableCell>
        <TableCell><b>Actions</b></TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {users.map((user) => (
        <TableRow
          key={user.id}
          sx={{
            "&:hover": { backgroundColor: "#f0f0f0" }, 
            cursor: "pointer", 
          }}
        >
          <TableCell>
            {user.metadata?.["eperson.firstname"]?.[0]?.value || "N/A"}
          </TableCell>
          <TableCell>
            {user.metadata?.["eperson.lastname"]?.[0]?.value || "N/A"}
          </TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell className="table_btn_div">
            <IconButton className="btn_table" color="primary" onClick={() => handleEditClick(user.id)} title="Edit">
              <img className="table_icon" src={iconsImgs.edit} alt="Edit" />
            </IconButton>
            <IconButton className="btn_table_dlt" color="error" onClick={() => handleDeleteClick(user)} title="Delete">
              <img className="table_icon" src={iconsImgs.remove} alt="Remove" />
            </IconButton>
            <IconButton className="btn_table" color="secondary" onClick={() => handleAcessClick(user.id)} title="Give Access">
              <img className="table_icon" src={iconsImgs.access} alt="Access" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChangePage}
            sx={{ display: "flex", justifyContent: "center", mt: 2, mb:3 }}
          />
        </>
      )}

      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {" "}
            <strong>{selectedUser?.metadata?.["eperson.firstname"]?.[0]?.value || "User"}</strong> {" "}
            (<em>{selectedUser?.email}</em>)?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <AddUser
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        fetchUsers={() => fetchUsers(page, size, searchQuery)} />
      <EditUser
        open={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        userId={selectedUserId || ""}
        fetchUsers={() => fetchUsers(page, size, searchQuery)}
      />
      <AccessManagement
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        userId={selectedUserId || ""}
      />

    </Container>
  );
};

export default UserManagement;