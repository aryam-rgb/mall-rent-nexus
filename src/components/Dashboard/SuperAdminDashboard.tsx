import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, Wrench, TrendingUp, AlertCircle } from "lucide-react";

export const SuperAdminDashboard = () => {
  const stats = [
    {
      title: "Total Properties",
      value: "24",
      change: "+2 this month",
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      title: "Active Tenants",
      value: "187",
      change: "+12 this month",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Monthly Revenue",
      value: "$145,720",
      change: "+8.2% from last month",
      icon: DollarSign,
      color: "bg-purple-500"
    },
    {
      title: "Pending Maintenance",
      value: "8",
      change: "3 urgent",
      icon: Wrench,
      color: "bg-orange-500"
    }
  ];

  const recentActivities = [
    { type: "payment", message: "Tenant John Smith paid $2,500 for Unit 101", time: "2 hours ago" },
    { type: "lease", message: "New lease signed for Unit 205", time: "4 hours ago" },
    { type: "maintenance", message: "Maintenance request submitted for Unit 301", time: "6 hours ago" },
    { type: "user", message: "New landlord account created: Sarah Johnson", time: "1 day ago" }
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
        {stats.map((stat, index) => {
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