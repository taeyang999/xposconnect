import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Schedule from './pages/Schedule';
import ServiceLogs from './pages/ServiceLogs';
import Inventory from './pages/Inventory';
import Employees from './pages/Employees';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Customers": Customers,
    "CustomerDetail": CustomerDetail,
    "Schedule": Schedule,
    "ServiceLogs": ServiceLogs,
    "Inventory": Inventory,
    "Employees": Employees,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};