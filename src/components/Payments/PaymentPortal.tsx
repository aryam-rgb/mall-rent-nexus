import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, Search, DollarSign, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PaymentPortal = ({ userRole }: { userRole: string }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const payments = [
    {
      id: 1,
      tenant: "Coffee Shop Co.",
      property: "Shopping Center A - Unit 101",
      amount: "$2,500",
      dueDate: "Dec 1, 2024",
      paidDate: "Nov 28, 2024",
      status: "paid",
      method: "Credit Card"
    },
    {
      id: 2,
      tenant: "Fashion Boutique",
      property: "Shopping Center A - Unit 102",
      amount: "$3,200",
      dueDate: "Dec 1, 2024",
      paidDate: "Dec 1, 2024",
      status: "paid",
      method: "Bank Transfer"
    },
    {
      id: 3,
      tenant: "Electronics Store",
      property: "Shopping Center B - Unit 201",
      amount: "$4,100",
      dueDate: "Dec 1, 2024",
      paidDate: null,
      status: "pending",
      method: null
    },
    {
      id: 4,
      tenant: "Book Store",
      property: "Shopping Center C - Unit 301",
      amount: "$1,800",
      dueDate: "Nov 1, 2024",
      paidDate: null,
      status: "overdue",
      method: null
    }
  ];

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Calendar className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const stats = [
    {
      title: "Total Collected",
      value: "$5,700",
      description: "This month",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Pending Payments",
      value: "$4,100",
      description: "Due this month",
      icon: Calendar,
      color: "text-orange-600"
    },
    {
      title: "Overdue Amount",
      value: "$1,800",
      description: "Requires attention",
      icon: AlertCircle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
        <p className="text-muted-foreground">
          {userRole === "tenant" ? "View your payment history and make payments" : "Track tenant payments and generate reports"}
        </p>
      </div>

      {/* Stats Cards - Only for landlords and superadmin */}
      {userRole !== "tenant" && (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>
                {userRole === "tenant" ? "Your payment history" : "Tenant payment tracking"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              {userRole === "tenant" && (
                <Button size="sm" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <h3 className="font-semibold">
                        {userRole === "tenant" ? payment.property : payment.tenant}
                      </h3>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium text-lg">{payment.amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{payment.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid Date</p>
                        <p className="font-medium">{payment.paidDate || "Not paid"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-medium">{payment.method || "N/A"}</p>
                      </div>
                    </div>
                    {userRole !== "tenant" && (
                      <p className="text-sm text-muted-foreground">
                        Property: {payment.property}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {payment.status === "pending" && userRole === "tenant" && (
                      <Button size="sm" className="gap-1">
                        <CreditCard className="w-3 h-3" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};