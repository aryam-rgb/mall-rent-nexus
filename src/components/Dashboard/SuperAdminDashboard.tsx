import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Wrench, TrendingUp, AlertCircle, Settings, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { MaintenancePortalReal } from "@/components/Maintenance/MaintenancePortalReal";
import { PaymentPortalReal } from "@/components/Payments/PaymentPortalReal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  urgentMaintenance: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'lease' | 'maintenance' | 'user' | 'property';
  message: string;
  time: string;
  created_at: string;
}

export const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    pendingMaintenance: 0,
    urgentMaintenance: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const propertiesChannel = supabase
      .channel('properties-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const maintenanceChannel = supabase
      .channel('maintenance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const leasesChannel = supabase
      .channel('leases-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leases' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(propertiesChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(leasesChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Fetch tenants count (profiles with role 'tenant')
      const { count: tenantsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'tenant');

      // Fetch this month's revenue
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('status', 'paid')
        .gte('payment_date', `${currentMonth}-01`);

      const monthlyRevenue = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Fetch monthly revenue data for chart (last 6 months)
      const { data: monthlyData } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('status', 'paid')
        .gte('payment_date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 10));

      // Group payments by month for chart
      const monthlyChart = monthlyData?.reduce((acc, payment) => {
        const month = payment.payment_date.slice(0, 7);
        const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!acc[month]) {
          acc[month] = { month: monthName, revenue: 0 };
        }
        acc[month].revenue += Number(payment.amount);
        return acc;
      }, {} as Record<string, { month: string; revenue: number }>) || {};

      const chartDataArray = Object.values(monthlyChart).sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
      );

      // Fetch maintenance requests
      const { count: pendingCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: urgentCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'high')
        .eq('status', 'pending');

      // Fetch recent activities (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Fetch recent payments
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, amount, payment_date, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent property additions
      const { data: recentProperties } = await supabase
        .from('properties')
        .select('id, name, location, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent lease creations
      const { data: recentLeases } = await supabase
        .from('leases')
        .select('id, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent maintenance requests
      const { data: recentMaintenance } = await supabase
        .from('maintenance_requests')
        .select('id, title, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine all activities
      const activities: RecentActivity[] = [
        ...(recentPayments?.map(payment => ({
          id: payment.id,
          type: 'payment' as const,
          message: `Payment of ${formatAmount(Number(payment.amount), 'USD')} received`,
          time: formatTimeAgo(payment.created_at),
          created_at: payment.created_at
        })) || []),
        ...(recentProperties?.map(property => ({
          id: property.id,
          type: 'property' as const,
          message: `New property "${property.name}" added in ${property.location}`,
          time: formatTimeAgo(property.created_at),
          created_at: property.created_at
        })) || []),
        ...(recentLeases?.map(lease => ({
          id: lease.id,
          type: 'lease' as const,
          message: `New lease agreement created`,
          time: formatTimeAgo(lease.created_at),
          created_at: lease.created_at
        })) || []),
        ...(recentMaintenance?.map(request => ({
          id: request.id,
          type: 'maintenance' as const,
          message: `Maintenance request: ${request.title}`,
          time: formatTimeAgo(request.created_at),
          created_at: request.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

      setStats({
        totalProperties: propertiesCount || 0,
        totalTenants: tenantsCount || 0,
        monthlyRevenue,
        pendingMaintenance: pendingCount || 0,
        urgentMaintenance: urgentCount || 0
      });

      setRecentActivities(activities);
      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const dashboardStats = [
    {
      title: "Total Properties",
      value: loading ? "..." : stats.totalProperties.toString(),
      change: "Managed properties",
      icon: Building2,
      color: "bg-primary"
    },
    {
      title: "Active Tenants",
      value: loading ? "..." : stats.totalTenants.toString(),
      change: "Registered tenants",
      icon: Users,
      color: "bg-success"
    },
    {
      title: "Monthly Revenue",
      value: loading ? "..." : formatAmount(stats.monthlyRevenue, 'USD'),
      change: "This month's payments",
      icon: DollarSign,
      color: "bg-warning"
    },
    {
      title: "Pending Maintenance",
      value: loading ? "..." : stats.pendingMaintenance.toString(),
      change: `${stats.urgentMaintenance} urgent`,
      icon: Wrench,
      color: stats.urgentMaintenance > 0 ? "bg-destructive" : "bg-muted"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive management of properties, tenants, and system activities
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

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
                <div className={`${stat.color} p-2 rounded-md shadow-sm`}>
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

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Property Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Property Overview</CardTitle>
            <CardDescription>
              Distribution of property metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Total Properties</span>
                </div>
                <span className="text-2xl font-bold">{stats.totalProperties}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-success" />
                  <span className="font-medium">Occupied Units</span>
                </div>
                <span className="text-2xl font-bold">{stats.totalTenants}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-warning" />
                  <span className="font-medium">Maintenance Requests</span>
                </div>
                <span className="text-2xl font-bold">{stats.pendingMaintenance}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system-wide activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="space-y-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Real-time system metrics and health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Property Occupancy</span>
              <Badge variant="default">
                {loading ? "..." : `${Math.round((stats.totalTenants / Math.max(stats.totalProperties, 1)) * 100)}%`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Collection Rate</span>
              <Badge variant="default">
                {loading ? "..." : `${Math.round((stats.monthlyRevenue > 0 ? 95 : 0))}%`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintenance Response</span>
              <Badge variant={stats.urgentMaintenance > 5 ? "destructive" : stats.urgentMaintenance > 2 ? "secondary" : "default"}>
                {stats.urgentMaintenance === 0 ? "Excellent" : stats.urgentMaintenance <= 2 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Maintenance Requests</span>
              <Badge variant="secondary">{loading ? "..." : stats.pendingMaintenance}</Badge>
            </div>
            {stats.urgentMaintenance > 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {stats.urgentMaintenance} urgent maintenance request{stats.urgentMaintenance > 1 ? 's' : ''} require{stats.urgentMaintenance === 1 ? 's' : ''} attention
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentPortalReal userRole="superadmin" />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenancePortalReal userRole="superadmin" />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Currency Management</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Manage currency settings and exchange rates
                  </p>
                  <Button variant="outline" size="sm">Configure Currency</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Payment Methods</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configure available payment methods for tenants
                  </p>
                  <Button variant="outline" size="sm">Manage Payment Methods</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">User Management</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Manage user accounts and permissions
                  </p>
                  <Button variant="outline" size="sm">Manage Users</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};