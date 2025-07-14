import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { SuperAdminDashboard } from "@/components/Dashboard/SuperAdminDashboard";
import { LandlordDashboard } from "@/components/Dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/Dashboard/TenantDashboard";
import { PropertyManagement } from "@/components/Properties/PropertyManagementReal";
import { LeaseManagement } from "@/components/Leases/LeaseManagement";
import { PaymentPortal } from "@/components/Payments/PaymentPortal";
import { MaintenancePortal } from "@/components/Maintenance/MaintenancePortal";
import { UserManagement } from "@/components/Users/UserManagement";
import { CurrencySettings } from "@/components/Settings/CurrencySettings";
import { PaymentMethodsSettings } from "@/components/Settings/PaymentMethodsSettings";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    signOut();
  };

  const renderContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case "dashboard":
        if (profile.role === "superadmin") return <SuperAdminDashboard />;
        if (profile.role === "landlord") return <LandlordDashboard />;
        return <TenantDashboard />;
      
      case "users":
        return profile.role === "superadmin" ? <UserManagement /> : <div>Access denied</div>;
      
      case "properties":
        return <PropertyManagement />;
      
      case "tenants":
      case "leases":
      case "lease":
        return <LeaseManagement />;
      
      case "payments":
        return <PaymentPortal userRole={profile.role} />;
      
      case "maintenance":
        return <MaintenancePortal userRole={profile.role} />;
      
      case "settings":
        return profile.role === "superadmin" ? (
          <div className="space-y-6">
            <CurrencySettings />
            <PaymentMethodsSettings />
          </div>
        ) : <div>Access denied</div>;
      
      default:
        return <div>Page not found</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to auth page
  }

  return (
    <DashboardLayout
      user={{ name: profile.name, email: profile.email, role: profile.role }}
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
