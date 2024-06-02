import React from "react";
import { Button, TextField } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
function AddProposalForm({ newProposalName, setNewProposalName, fileUrl, setFileUrl, submitProposal, uploadFile }) {
    return (
        <div>
            <TextField
                label="Proposal Name"
                variant="outlined"
                fullWidth
                value={newProposalName}
                onChange={(e) => setNewProposalName(e.target.value)}
                sx={{ mb: 2 }}
            />
            <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                sx={{ width: "100%" }}
                startIcon={<CloudUploadIcon />}
            >
                Upload file

                <input type="file" hidden onChange={uploadFile} />
            </Button>
            {fileUrl && (
                <img
                    src={fileUrl}
                    alt="File"
                    width="100px"
                    style={{ display: "block", marginTop: "10px" }}
                />
            )}
            <Button
                variant="contained"
                color="primary"
                onClick={submitProposal}
                sx={{ mt: 2 , marginLeft: 28 }}
            >
                Submit Proposal
            </Button>
        </div>
    );
}

export default AddProposalForm;
