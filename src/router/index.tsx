import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { 
  LoginPage, 
  NotFound, 
  AdminDashboardPage, 
  EmployeeManagementPage, 
  EmployeeDashboardPage
} from "@/pages";
import TodayAttendancePage from "@/pages/admin/TodayAttendancePage";
import MonthlyAttendancePage from "@/pages/admin/MonthlyAttendancePage";
import SecurityLogsPage from "@/pages/admin/SecurityLogsPage";
import HistoryScreen from "@/pages/employee/HistoryScreen";
import LocationTestPage from "@/pages/employee/LocationTestPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        path: "admin",
        element: <AdminDashboardPage />,
        children: [
          { index: true, element: <EmployeeManagementPage /> },
          { path: "employees", element: <EmployeeManagementPage /> },
          { path: "today-attendance", element: <TodayAttendancePage /> },
          { path: "monthly-attendance", element: <MonthlyAttendancePage /> },
          { path: "security-logs", element: <SecurityLogsPage /> },
        ],
      },
      {
        path: "employee",
        element: <EmployeeDashboardPage />,
        children: [
          { index: true, element: <EmployeeDashboardPage /> },
          { path: "history", element: <HistoryScreen /> },
          { path: "location-test", element: <LocationTestPage /> },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);