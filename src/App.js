import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Proposals from './pages/proposals'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Proposals />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
