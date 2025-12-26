import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import ServiceLogs from './pages/ServiceLogs';
import EmployeePermissions from './pages/EmployeePermissions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CustomerDetail": CustomerDetail,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Employees": Employees,
    "Inventory": Inventory,
    "Profile": Profile,
    "Reports": Reports,
    "Schedule": Schedule,
    "ServiceLogs": ServiceLogs,
    "EmployeePermissions": EmployeePermissions,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};