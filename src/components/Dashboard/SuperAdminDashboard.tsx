import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, Wrench, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  urgentMaintenance: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'lease' | 'maintenance' | 'user';
  message: string;
  time: string;
  created_at: string;
}

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    pendingMaintenance: 0,
    urgentMaintenance: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchDashboardData();
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
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', `${currentMonth}-01`);

      const monthlyRevenue = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

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

      // Fetch recent activities (payments from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, amount, payment_date, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = recentPayments?.map(payment => ({
        id: payment.id,
        type: 'payment' as const,
        message: `Payment of ${formatAmount(Number(payment.amount), 'USD')} received`,
        time: formatTimeAgo(payment.created_at),
        created_at: payment.created_at
      })) || [];

      setStats({
        totalProperties: propertiesCount || 0,
        totalTenants: tenantsCount || 0,
        monthlyRevenue,
        pendingMaintenance: pendingCount || 0,
        urgentMaintenance: urgentCount || 0
      });

      setRecentActivities(activities);
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
      color: "bg-blue-500"
    },
    {
      title: "Active Tenants",
      value: loading ? "..." : stats.totalTenants.toString(),
      change: "Registered tenants",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Monthly Revenue",
      value: loading ? "..." : formatAmount(stats.monthlyRevenue, 'USD'),
      change: "This month's payments",
      icon: DollarSign,
      color: "bg-purple-500"
    },
    {
      title: "Pending Maintenance",
      value: loading ? "..." : stats.pendingMaintenance.toString(),
      change: `${stats.urgentMaintenance} urgent`,
      icon: Wrench,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
        <p className="text-muted-foreground">
          Comprehensive view of all properties, users, and system activities
        </p>
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
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system-wide activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="space-y-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Property Occupancy</span>
              <Badge variant="default">92.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Collection Rate</span>
              <Badge variant="default">96.2%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintenance Response</span>
              <Badge variant="secondary">Good</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">System Uptime</span>
              <Badge variant="default">99.9%</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-md">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                3 urgent maintenance requests require attention
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};