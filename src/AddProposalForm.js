import React from "react";
import { Button, TextField } from "@mui/material";

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
            <Button variant="contained" component="label">
                Upload File
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
                sx={{ mt: 2 }}
            >
                Submit Proposal
            </Button>
        </div>
    );
}

export default AddProposalForm;
