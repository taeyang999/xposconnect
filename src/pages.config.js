import AuditLogs from './pages/AuditLogs';
import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import EmployeePermissions from './pages/EmployeePermissions';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import ServiceLogs from './pages/ServiceLogs';
import Schedule from './pages/Schedule';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AuditLogs": AuditLogs,
    "CustomerDetail": CustomerDetail,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "EmployeePermissions": EmployeePermissions,
    "Employees": Employees,
    "Inventory": Inventory,
    "Profile": Profile,
    "Reports": Reports,
    "ServiceLogs": ServiceLogs,
    "Schedule": Schedule,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};