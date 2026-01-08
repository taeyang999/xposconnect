import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import EmployeePermissions from './pages/EmployeePermissions';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import ServiceLogs from './pages/ServiceLogs';
import AuditLogs from './pages/AuditLogs';
import CustomerLayoutSettings from './pages/CustomerLayoutSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CustomerDetail": CustomerDetail,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "EmployeePermissions": EmployeePermissions,
    "Employees": Employees,
    "Inventory": Inventory,
    "Profile": Profile,
    "Reports": Reports,
    "Schedule": Schedule,
    "ServiceLogs": ServiceLogs,
    "AuditLogs": AuditLogs,
    "CustomerLayoutSettings": CustomerLayoutSettings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};