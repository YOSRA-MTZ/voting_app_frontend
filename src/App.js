import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Voting from "./Voting.json";

const votingAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508"; // Remplacez par l'adresse du contrat déployé

function App() {
  const [proposals, setProposals] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [newProposalName, setNewProposalName] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [votedIndices, setVotedIndices] = useState([]);

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

  async function vote(proposalIndex) {
    if (!currentAccount) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(votingAddress, Voting.abi, signer);

      const transaction = await contract.vote(proposalIndex);
      await transaction.wait();

      await loadProposals();
      setVotedIndices([...votedIndices, proposalIndex]);
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

  return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>Voting App</h1>
        {currentAccount ? (
            <div>
              <h2>Proposals</h2>
              {proposals.map((proposal, index) => (
                  <div key={index} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
                    <p><strong>{proposal.name}</strong></p>
                    {proposal.image && <img src={proposal.image} alt={proposal.name} style={{ maxWidth: "100px" }} />}
                    <p>Vote Count: {proposal.voteCount}</p>
                    {!votedIndices.includes(index) && (
                        <button onClick={() => vote(index)}>Vote</button>
                    )}
                  </div>
              ))}
              <div style={{ marginTop: "20px" }}>
                <h3>Submit a New Proposal</h3>
                <input
                    type="text"
                    placeholder="Proposal Name"
                    value={newProposalName}
                    onChange={(e) => setNewProposalName(e.target.value)}
                    style={{ padding: "5px", marginRight: "10px" }}
                />
                <input type="file" onChange={uploadFile} />
                {fileUrl && <img src={fileUrl} alt="File" width="100px" style={{ display: "block", marginTop: "10px" }} />}
                <button onClick={submitProposal} style={{ display: "block", marginTop: "10px", padding: "5px 10px" }}>Submit Proposal</button>
              </div>
            </div>
        ) : (
            <button onClick={connectWallet} style={{ padding: "10px 20px" }}>Connect Wallet</button>
        )}
      </div>
  );
}

export default App;
