import { useState } from "react";
import { LoginForm } from "@/components/Auth/LoginForm";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { SuperAdminDashboard } from "@/components/Dashboard/SuperAdminDashboard";
import { LandlordDashboard } from "@/components/Dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/Dashboard/TenantDashboard";
import { PropertyManagement } from "@/components/Properties/PropertyManagement";
import { LeaseManagement } from "@/components/Leases/LeaseManagement";
import { PaymentPortal } from "@/components/Payments/PaymentPortal";
import { MaintenancePortal } from "@/components/Maintenance/MaintenancePortal";
import { UserManagement } from "@/components/Users/UserManagement";

interface User {
  email: string;
  role: string;
  name: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("dashboard");
  };

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case "dashboard":
        if (user.role === "superadmin") return <SuperAdminDashboard />;
        if (user.role === "landlord") return <LandlordDashboard />;
        return <TenantDashboard />;
      
      case "users":
        return user.role === "superadmin" ? <UserManagement /> : <div>Access denied</div>;
      
      case "properties":
        return <PropertyManagement />;
      
      case "tenants":
      case "leases":
      case "lease":
        return <LeaseManagement />;
      
      case "payments":
        return <PaymentPortal userRole={user.role} />;
      
      case "maintenance":
        return <MaintenancePortal userRole={user.role} />;
      
      default:
        return <div>Page not found</div>;
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
