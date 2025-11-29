import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Vehicles from "./Vehicles";

import Clients from "./Clients";

import CRM from "./CRM";

import ContractTemplates from "./ContractTemplates";

import SaleTemplates from "./SaleTemplates";

import BudgetTemplates from "./BudgetTemplates";

import ConsignmentTemplates from "./ConsignmentTemplates";

import Agency from "./Agency";

import Tasks from "./Tasks";

import Inspections from "./Inspections";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Vehicles: Vehicles,
    
    Clients: Clients,
    
    CRM: CRM,
    
    ContractTemplates: ContractTemplates,
    
    SaleTemplates: SaleTemplates,
    
    BudgetTemplates: BudgetTemplates,
    
    ConsignmentTemplates: ConsignmentTemplates,
    
    Agency: Agency,
    
    Tasks: Tasks,
    
    Inspections: Inspections,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Vehicles" element={<Vehicles />} />
                
                <Route path="/Clients" element={<Clients />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/ContractTemplates" element={<ContractTemplates />} />
                
                <Route path="/SaleTemplates" element={<SaleTemplates />} />
                
                <Route path="/BudgetTemplates" element={<BudgetTemplates />} />
                
                <Route path="/ConsignmentTemplates" element={<ConsignmentTemplates />} />
                
                <Route path="/Agency" element={<Agency />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Inspections" element={<Inspections />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}