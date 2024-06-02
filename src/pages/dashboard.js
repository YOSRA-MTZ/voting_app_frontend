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
    Grid,
    Box,
    Modal
} from "@mui/material";
import {
    Dashboard,
    HowToVote,
    AddBox,
    ExitToApp
} from "@mui/icons-material";
import AddProposalForm from "./AddProposalForm";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Menu from "@mui/icons-material/Menu";
import {styled, useTheme} from "@mui/material/styles";

const votingAddress = "0x09635F643e140090A9A8Dcd712eD6285858ceBef";
const ownerAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB', '#FFCE56'];

function DashboardPage() {
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
        const { ethereum } = window;
        if (!ethereum) {
            alert("Make sure you have MetaMask!");
            return;
        } else {
            console.log("We have the ethereum object", ethereum);
        }

        const accounts = await ethereum.request({ method: "eth_accounts" });
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
            const { ethereum } = window;
            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
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

    const [isOpen, setIsOpen] = useState(false);

    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    };
    const theme = useTheme();
    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    }));
    const mostVotedProposal = proposals.reduce((prev, current) => {
        return (prev.voteCount > current.voteCount) ? prev : current;
    }, {});

    const totalVotes = proposals.reduce((sum, proposal) => sum + proposal.voteCount, 0);

    const handleOpenAddProposalModal = () => {
        setShowAddProposalModal(true);
    };

    const handleCloseAddProposalModal = () => {
        setShowAddProposalModal(false);
    };

    const pieData = proposals.map((proposal, index) => ({
        name: proposal.name,
        value: proposal.voteCount,
        color: COLORS[index % COLORS.length]
    }));

    return (
        <Box sx={{ display: 'flex' }}>
            {!currentAccount ? (
                <>
                    <AppBar position="fixed">
                        <Toolbar>
                            <Typography variant="h6" noWrap>
                                Voting App
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', p: 25, justifyContent: 'center', marginTop: '20vh', marginLeft: 60 }}>
                        <Button variant="contained" onClick={connectWallet}>
                            Connect Wallet
                        </Button>
                    </Box>
                </>
            ) : (
                <>
                    <AppBar position="fixed">
                        <Toolbar>
                            <IconButton onClick={toggleDrawer} sx={{ mr: 2 ,color: '#fff' }}>
                                {isOpen ? <ChevronLeftIcon /> : <Menu />}
                            </IconButton>
                            <Typography variant="h6" noWrap>
                                Voting App
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    <Drawer
                        variant="temporary"
                        anchor="left"
                        open={isOpen}
                        onClose={toggleDrawer}
                        sx={{
                            width: 240,
                            flexShrink: 0,
                            '& .MuiDrawer-paper': { width: 240 },
                        }}
                    >
                        <DrawerHeader>
                            <IconButton onClick={toggleDrawer}>
                                <ChevronLeftIcon />
                            </IconButton>
                        </DrawerHeader>
                        <Toolbar />

                        <List sx={{ marginTop: -8 }}>

                            <ListItem button key="Dashboard" component={Link} to="/dashboard">
                                <ListItemIcon><Dashboard /></ListItemIcon>
                                <ListItemText primary="Dashboard" />
                            </ListItem>
                            <ListItem button key="Proposals" component={Link} to="/">
                                <ListItemIcon><HowToVote /></ListItemIcon>
                                <ListItemText primary="Proposals" />
                            </ListItem>
                            {currentAccount && currentAccount.toLowerCase() === ownerAddress.toLowerCase() && (
                                <ListItem button key="Submit" onClick={handleOpenAddProposalModal}>
                                    <ListItemIcon><AddBox /></ListItemIcon>
                                    <ListItemText primary="Submit" />
                                </ListItem>
                            )}
                            <ListItem button key="Sign Out">
                                <ListItemIcon><ExitToApp /></ListItemIcon>
                                <ListItemText primary="Sign Out" />
                            </ListItem>
                        </List>
                    </Drawer>
                    <Box
                        component="main"
                        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
                    >
                        <Toolbar />
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="div">
                                            Nombre de Candidats
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {proposals.length}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="div">
                                            Candidat le plus voté
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {mostVotedProposal && mostVotedProposal.name
                                                ? `${mostVotedProposal.name} (${mostVotedProposal.voteCount} votes)`
                                                : "Aucun vote pour le moment"}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="div">
                                            Nombre total de votes
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {totalVotes}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Card  >
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="div">
                                            Votes par Candidats
                                        </Typography>
                                        <PieChart width={400} height={400}>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={150}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </CardContent>
                                </Card>
                            </Grid>
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
                </>
            )}
        </Box>
    );
}

export default DashboardPage;
