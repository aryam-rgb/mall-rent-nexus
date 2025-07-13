import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, CreditCard, Calendar, Wrench, AlertCircle, CheckCircle } from "lucide-react";

export const TenantDashboard = () => {
  const leaseInfo = {
    property: "Shopping Center A - Unit 101",
    startDate: "Jan 1, 2024",
    endDate: "Dec 31, 2024",
    monthlyRent: "$2,500",
    status: "active"
  };

  const paymentHistory = [
    { month: "November 2024", amount: "$2,500", date: "Nov 1, 2024", status: "paid" },
    { month: "October 2024", amount: "$2,500", date: "Oct 1, 2024", status: "paid" },
    { month: "September 2024", amount: "$2,500", date: "Sep 1, 2024", status: "paid" },
    { month: "August 2024", amount: "$2,500", date: "Aug 1, 2024", status: "paid" }
  ];

  const maintenanceRequests = [
    { id: 1, issue: "Air conditioning not working", date: "Nov 15, 2024", status: "in-progress", priority: "high" },
    { id: 2, issue: "Leaky faucet in restroom", date: "Nov 10, 2024", status: "completed", priority: "medium" },
    { id: 3, issue: "Lighting fixture replacement", date: "Nov 5, 2024", status: "completed", priority: "low" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Tenancy</h2>
        <p className="text-muted-foreground">
          View your lease details, payments, and maintenance requests
        </p>
      </div>

      {/* Lease Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Lease Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Property</p>
              <p className="text-lg font-semibold">{leaseInfo.property}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
              <p className="text-lg font-semibold">{leaseInfo.monthlyRent}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lease Period</p>
              <p className="text-sm">{leaseInfo.startDate} - {leaseInfo.endDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payments
              </CardTitle>
              <Button size="sm">Pay Rent</Button>
            </div>
            <CardDescription>
              Your payment history and upcoming dues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  November rent paid on time
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Next payment due: December 1, 2024
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Payment History</h4>
              {paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium">{payment.month}</p>
                    <p className="text-xs text-muted-foreground">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{payment.amount}</p>
                    <Badge variant="default" className="text-xs">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance
              </CardTitle>
              <Button size="sm" variant="outline">New Request</Button>
            </div>
            <CardDescription>
              Track your maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceRequests.map((request) => (
              <div key={request.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{request.issue}</p>
                    <p className="text-xs text-muted-foreground">{request.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        request.status === "completed" ? "default" :
                        request.status === "in-progress" ? "secondary" :
                        "outline"
                      }
                      className="text-xs"
                    >
                      {request.status}
                    </Badge>
                    <Badge 
                      variant={
                        request.priority === "high" ? "destructive" :
                        request.priority === "medium" ? "secondary" :
                        "outline"
                      }
                      className="text-xs ml-1"
                    >
                      {request.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};