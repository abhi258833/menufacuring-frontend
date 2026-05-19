import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { addGroup, GroupPayload } from "../../api/group";
import Loader from "../loader/loader";

interface AddGroupProps {
  open: boolean;
  onClose: () => void;
  onGroupAdded: () => void;
}

const AddGroup = ({ open, onClose, onGroupAdded }: AddGroupProps) => {
  const [groupName, setGroupName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading,setLoading] = useState(false)

  const handleSave = async () => {
    const payload: GroupPayload = {
      name: groupName,
      metadata: {
        "dc.description": [{ value: description }],
      },
    };
    setLoading(true)
    const success = await addGroup(payload);
    if (success) {
      onGroupAdded();
      onClose();
    }
    setLoading(false)
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ className: "modal-paper" }} 
    >
      <div className="modal-header-container">
        <DialogTitle className="modal-header">Create Group</DialogTitle>
        <IconButton onClick={onClose} className="close-icon">
          <CloseIcon />
        </IconButton>
      </div>
      {loading && <Loader />}
      <DialogContent className="modal-form group_form">
        <TextField
          className="custom-textfield"
          fullWidth
          label="Group name *"
          variant="outlined"
          margin="dense"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <TextField
          className="custom-textfield"
          fullWidth
          label="Description"
          variant="outlined"
          margin="dense"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <Box className="modal-footer">
        <button type="button" className="add-user-btn" onClick={handleSave}>
          <span className="btn-text">Save</span>
          <span className="btn-icon">→</span>
        </button>
      </Box>

    </Dialog>
  );
};

export default AddGroup;
