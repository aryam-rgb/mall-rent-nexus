import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Wrench, Plus, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";

interface LandlordStats {
  myProperties: number;
  activeTenants: number;
  monthlyIncome: number;
  maintenanceRequests: number;
  urgentMaintenance: number;
}

interface Property {
  id: string;
  name: string;
  unit_number: string;
  rent_amount: number;
  currency: string;
  status: string;
  tenant_name?: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  tenant_name?: string;
}

export const LandlordDashboard = () => {
  const [stats, setStats] = useState<LandlordStats>({
    myProperties: 0,
    activeTenants: 0,
    monthlyIncome: 0,
    maintenanceRequests: 0,
    urgentMaintenance: 0
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (profile) {
      fetchLandlordData();
    }
  }, [profile]);

  const fetchLandlordData = async () => {
    if (!profile) return;

    try {
      // Fetch landlord's properties
      const { data: propertiesData, count: propertiesCount } = await supabase
        .from('properties')
        .select('id, name, unit_number, rent_amount, currency, status', { count: 'exact' })
        .eq('landlord_id', profile.id);

      // Fetch active leases for this landlord
      const { data: leasesData, count: tenantsCount } = await supabase
        .from('leases')
        .select('tenant_id, property_id', { count: 'exact' })
        .eq('landlord_id', profile.id)
        .eq('status', 'active');

      // Fetch this month's income
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('landlord_id', profile.id)
        .eq('status', 'paid')
        .gte('payment_date', `${currentMonth}-01`);

      const monthlyIncome = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Fetch maintenance requests
      const { count: maintenanceCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', profile.id)
        .eq('status', 'pending');

      const { count: urgentCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', profile.id)
        .eq('priority', 'high')
        .eq('status', 'pending');

      // Fetch recent payments
      const { data: recentPaymentsData } = await supabase
        .from('payments')
        .select('id, amount, payment_date, status')
        .eq('landlord_id', profile.id)
        .order('payment_date', { ascending: false })
        .limit(5);

      setStats({
        myProperties: propertiesCount || 0,
        activeTenants: tenantsCount || 0,
        monthlyIncome,
        maintenanceRequests: maintenanceCount || 0,
        urgentMaintenance: urgentCount || 0
      });

      setProperties(propertiesData?.map(prop => ({
        ...prop,
        tenant_name: prop.status === 'occupied' ? 'Tenant' : 'Available'
      })) || []);

      setRecentPayments(recentPaymentsData?.map(payment => ({
        ...payment,
        tenant_name: 'Tenant'
      })) || []);

    } catch (error) {
      console.error('Error fetching landlord data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      title: "My Properties",
      value: loading ? "..." : stats.myProperties.toString(),
      change: `${properties.filter(p => p.status === 'occupied').length}/${stats.myProperties} occupied`,
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      title: "Active Tenants",
      value: loading ? "..." : stats.activeTenants.toString(),
      change: "Current leases",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Monthly Income",
      value: loading ? "..." : formatAmount(stats.monthlyIncome, 'USD'),
      change: "This month's revenue",
      icon: DollarSign,
      color: "bg-purple-500"
    },
    {
      title: "Maintenance Requests",
      value: loading ? "..." : stats.maintenanceRequests.toString(),
      change: `${stats.urgentMaintenance} urgent`,
      icon: Wrench,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Property Overview</h2>
          <p className="text-muted-foreground">
            Manage your properties and monitor tenant activities
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-md`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle>My Properties</CardTitle>
            <CardDescription>
              Overview of your rental properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{property.name} - {property.unit_number}</p>
                  <p className="text-xs text-muted-foreground">{property.tenant_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatAmount(property.rent_amount, property.currency as 'USD' | 'UGX')}</p>
                  <Badge variant={property.status === "occupied" ? "default" : "secondary"}>
                    {property.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Latest tenant payment activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{payment.tenant_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatAmount(payment.amount, 'USD')}</p>
                  <Badge 
                    variant={
                      payment.status === "paid" ? "default" : 
                      payment.status === "pending" ? "secondary" : 
                      "destructive"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};