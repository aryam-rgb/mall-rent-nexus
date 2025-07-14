import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencySelector } from "@/components/Currency/CurrencySelector";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut,
  Home,
  Wrench
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  user: { name: string; email: string; role: string };
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardLayout = ({ 
  children, 
  user, 
  onLogout, 
  activeTab, 
  onTabChange 
}: DashboardLayoutProps) => {
  const getNavigationItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }
    ];

    switch (user.role) {
      case "superadmin":
        return [
          ...baseItems,
          { id: "users", label: "Users", icon: Users },
          { id: "properties", label: "Properties", icon: Building2 },
          { id: "leases", label: "Leases", icon: FileText },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "maintenance", label: "Maintenance", icon: Wrench },
          { id: "settings", label: "Settings", icon: Settings }
        ];
      case "landlord":
        return [
          ...baseItems,
          { id: "properties", label: "My Properties", icon: Building2 },
          { id: "tenants", label: "Tenants", icon: Users },
          { id: "leases", label: "Leases", icon: FileText },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "maintenance", label: "Maintenance", icon: Wrench }
        ];
      case "tenant":
        return [
          ...baseItems,
          { id: "lease", label: "My Lease", icon: Home },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "maintenance", label: "Maintenance", icon: Wrench }
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Mall Management</h1>
              <p className="text-xs text-muted-foreground">Property Rental System</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <CurrencySelector />
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};