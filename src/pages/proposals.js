import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { Link } from "react-router-dom";

import Voting from "../Voting.json";
import {
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Card,
    CardContent,
    CardMedia,
    Button,
    TextField,
    Grid,
    Box,
    Modal
} from "@mui/material";
import {
    Dashboard,
    HowToVote,
    AddBox,
    AccountCircle,
    ExitToApp
} from "@mui/icons-material";
import AddProposalForm from "./AddProposalForm";

const votingAddress = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
const ownerAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

function Proposals() {
    const [proposals, setProposals] = useState([]);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [newProposalName, setNewProposalName] = useState("");
    const [fileUrl, setFileUrl] = useState(null);
    const [votedIndices, setVotedIndices] = useState([]);
    const [showAddProposalModal, setShowAddProposalModal] = useState(false);

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    async function checkIfWalletIsConnected() {
        const {ethereum} = window;
        if (!ethereum) {
            alert("Make sure you have MetaMask!");
            return;
        } else {
            console.log("We have the ethereum object", ethereum);
        }

        const accounts = await ethereum.request({method: "eth_accounts"});
        if (accounts.length !== 0) {
            const account = accounts[0];
            console.log("Found an authorized account:", account);
            setCurrentAccount(account);
            await loadProposals();
        } else {
            console.log("No authorized account found");
        }
    }

    async function connectWallet() {
        try {
            const {ethereum} = window;
            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }
            const accounts = await ethereum.request({method: "eth_requestAccounts"});
            console.log("Connected", accounts[0]);
            setCurrentAccount(accounts[0]);
            await loadProposals();
        } catch (error) {
            console.log(error);
        }
    }

    async function loadProposals() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(votingAddress, Voting.abi, provider);
        try {
            const [names, images, voteCounts] = await contract.getProposals();
            const proposals = names.map((name, index) => ({
                name,
                image: images[index],
                voteCount: voteCounts[index].toNumber(),
            }));
            setProposals(proposals);
        } catch (error) {
            console.error("Error loading proposals:", error);
        }
    }

    async function submitProposal() {
        if (!newProposalName || !fileUrl) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(votingAddress, Voting.abi, signer);

            const transaction = await contract.addProposal(newProposalName, fileUrl);
            await transaction.wait();

            setNewProposalName("");
            setFileUrl(null);
            await loadProposals();
        } catch (error) {
            console.log(error);
        }
    }
    async function vote(proposalIndex) {
        if (!currentAccount) return;
        try {
            console.log("Proposal index:", proposalIndex);

            if (votedIndices.includes(proposalIndex)) {
                alert("Vous avez déjà voté pour cette proposition.");
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(votingAddress, Voting.abi, provider);

            const signer = provider.getSigner();
            const contractWithSigner = contract.connect(signer);

            const transaction = await contractWithSigner.vote(proposalIndex);
            await transaction.wait();
            setVotedIndices([...votedIndices, proposalIndex]);
            await loadProposals();
        } catch (error) {
            alert("Une erreur s'est produite lors de votre vote.");
            console.log(error);
        }
    }

    async function uploadFile(event) {
        const file = event.target.files[0];
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                data,
                {
                    maxContentLength: 'Infinity',
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                        'pinata_api_key': '6e88614b72e7c201f03a',
                        'pinata_secret_api_key': 'e2992be3dfd54850b3dc4a342ef0350be21a46f874528343d07bca462b8119d7'
                    }
                }
            );

            const fileHash = res.data.IpfsHash;
            const url = `https://gateway.pinata.cloud/ipfs/${fileHash}`;
            setFileUrl(url);
        } catch (error) {
            console.log('Error uploading file:', error);
        }
    }

    const handleOpenAddProposalModal = () => {
        setShowAddProposalModal(true);
    };

    const handleCloseAddProposalModal = () => {
        setShowAddProposalModal(false);
    };
    return (
        <Box sx={{display: 'flex'}}>
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        Voting App
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: 240,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {width: 240, boxSizing: 'border-box'},
                }}
            >
                <Toolbar/>
                <List>
                    <ListItem button key="Dashboard" component={Link} to="/dashboard">
                        <ListItemIcon><Dashboard/></ListItemIcon>
                        <ListItemText primary="Dashboard"/>
                    </ListItem>

                    <ListItem button key="Proposals">
                        <ListItemIcon><HowToVote/></ListItemIcon>
                        <ListItemText primary="Proposals"/>
                    </ListItem>

                    {currentAccount && currentAccount.toLowerCase() === ownerAddress.toLowerCase() && (
                        <ListItem button key="Submit" onClick={handleOpenAddProposalModal}>
                            <ListItemIcon><AddBox/></ListItemIcon>
                            <ListItemText primary="Submit"/>
                        </ListItem>
                    )}


                    <ListItem button key="Sign Out">
                        <ListItemIcon><ExitToApp/></ListItemIcon>
                        <ListItemText primary="Sign Out"/>
                    </ListItem>
                </List>
            </Drawer>
            <Box
                component="main"
                sx={{flexGrow: 1, bgcolor: 'background.default', p: 3}}
            >
                <Toolbar/>
                <Grid container spacing={3}>
                    {currentAccount ? (
                        <>
                            {proposals.map((proposal, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card>
                                        {proposal.image && (
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={proposal.image}
                                                alt={proposal.name}
                                            />
                                        )}
                                        <CardContent>
                                            <Typography gutterBottom variant="h5" component="div">
                                                {proposal.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Vote Count: {proposal.voteCount}
                                            </Typography>
                                            {!votedIndices.includes(index) && (
                                                <Button variant="contained" onClick={() => vote(index)}>Vote</Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </>
                    ) : (
                        <Button variant="contained" onClick={connectWallet}>
                            Connect Wallet
                        </Button>
                    )}
                </Grid>
                <Modal
                    open={showAddProposalModal}
                    onClose={handleCloseAddProposalModal}
                    aria-labelledby="add-proposal-modal-title"
                    aria-describedby="add-proposal-modal-description"
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            border: '2px solid #000',
                            boxShadow: 24,
                            p: 4,
                        }}
                    >
                        <Typography id="add-proposal-modal-title" variant="h6" component="h2">
                            Submit a New Proposal
                        </Typography>
                        <AddProposalForm
                            newProposalName={newProposalName}
                            setNewProposalName={setNewProposalName}
                            fileUrl={fileUrl}
                            setFileUrl={setFileUrl}
                            submitProposal={submitProposal}
                            uploadFile={uploadFile}
                        />
                    </Box>
                </Modal>
            </Box>
        </Box>
    );

}
export default Proposals;


