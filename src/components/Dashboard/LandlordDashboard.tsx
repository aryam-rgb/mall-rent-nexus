import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Wrench, Plus, TrendingUp } from "lucide-react";

export const LandlordDashboard = () => {
  const stats = [
    {
      title: "My Properties",
      value: "8",
      change: "100% occupied",
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      title: "Active Tenants",
      value: "24",
      change: "All current",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Monthly Income",
      value: "$18,450",
      change: "+5.2% from last month",
      icon: DollarSign,
      color: "bg-purple-500"
    },
    {
      title: "Maintenance Requests",
      value: "3",
      change: "1 urgent",
      icon: Wrench,
      color: "bg-orange-500"
    }
  ];

  const properties = [
    { id: 1, name: "Shopping Center A - Unit 101", tenant: "Coffee Shop Co.", rent: "$2,500", status: "occupied" },
    { id: 2, name: "Shopping Center A - Unit 102", tenant: "Fashion Boutique", rent: "$3,200", status: "occupied" },
    { id: 3, name: "Shopping Center B - Unit 201", tenant: "Electronics Store", rent: "$4,100", status: "occupied" },
    { id: 4, name: "Shopping Center B - Unit 205", tenant: "Available", rent: "$2,800", status: "vacant" }
  ];

  const recentPayments = [
    { tenant: "Coffee Shop Co.", amount: "$2,500", date: "Nov 1, 2024", status: "paid" },
    { tenant: "Fashion Boutique", amount: "$3,200", date: "Nov 1, 2024", status: "paid" },
    { tenant: "Electronics Store", amount: "$4,100", date: "Nov 1, 2024", status: "pending" },
    { tenant: "Book Store", amount: "$1,800", date: "Oct 28, 2024", status: "overdue" }
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
                  <p className="font-medium text-sm">{property.name}</p>
                  <p className="text-xs text-muted-foreground">{property.tenant}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{property.rent}</p>
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
                  <p className="font-medium text-sm">{payment.tenant}</p>
                  <p className="text-xs text-muted-foreground">{payment.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{payment.amount}</p>
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