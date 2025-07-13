import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, FileText, Calendar, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LeaseManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [leases] = useState([
    {
      id: 1,
      propertyName: "Shopping Center A - Unit 101",
      tenantName: "Coffee Shop Co.",
      tenantEmail: "contact@coffeeshop.com",
      startDate: "Jan 1, 2024",
      endDate: "Dec 31, 2024",
      monthlyRent: "$2,500",
      deposit: "$5,000",
      status: "active",
      daysUntilExpiry: 45
    },
    {
      id: 2,
      propertyName: "Shopping Center A - Unit 102",
      tenantName: "Fashion Boutique",
      tenantEmail: "info@fashionboutique.com",
      startDate: "Jul 1, 2024",
      endDate: "Jun 30, 2025",
      monthlyRent: "$3,200",
      deposit: "$6,400",
      status: "active",
      daysUntilExpiry: 225
    },
    {
      id: 3,
      propertyName: "Shopping Center B - Unit 201",
      tenantName: "Electronics Store",
      tenantEmail: "admin@electrostore.com",
      startDate: "Mar 15, 2024",
      endDate: "Mar 15, 2025",
      monthlyRent: "$4,100",
      deposit: "$8,200",
      status: "active",
      daysUntilExpiry: 120
    },
    {
      id: 4,
      propertyName: "Shopping Center C - Unit 301",
      tenantName: "Book Store",
      tenantEmail: "hello@bookstore.com",
      startDate: "Oct 1, 2023",
      endDate: "Sep 30, 2024",
      monthlyRent: "$1,800",
      deposit: "$3,600",
      status: "expired",
      daysUntilExpiry: -30
    }
  ]);

  const filteredLeases = leases.filter(lease =>
    lease.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lease.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string, daysUntilExpiry: number) => {
    if (status === "expired") return "destructive";
    if (daysUntilExpiry <= 30) return "destructive";
    if (daysUntilExpiry <= 60) return "secondary";
    return "default";
  };

  const getExpiryWarning = (daysUntilExpiry: number, status: string) => {
    if (status === "expired") return "Expired";
    if (daysUntilExpiry <= 7) return "Expires this week";
    if (daysUntilExpiry <= 30) return "Expires soon";
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lease Management</h2>
          <p className="text-muted-foreground">
            Manage lease agreements and track expiration dates
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Lease
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lease Agreement</DialogTitle>
              <DialogDescription>
                Set up a new lease agreement for a tenant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property">Property</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit101">Shopping Center A - Unit 101</SelectItem>
                      <SelectItem value="unit205">Shopping Center B - Unit 205</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant">Tenant</Label>
                  <Input id="tenant" placeholder="Tenant name" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                  <Input id="monthlyRent" placeholder="e.g., $2,500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Security Deposit</Label>
                  <Input id="deposit" placeholder="e.g., $5,000" />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Lease</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leases by property or tenant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lease Agreements</CardTitle>
          <CardDescription>
            Active and expired lease agreements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeases.map((lease) => (
              <div key={lease.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{lease.propertyName}</h3>
                      <Badge variant={getStatusColor(lease.status, lease.daysUntilExpiry)}>
                        {lease.status}
                      </Badge>
                      {getExpiryWarning(lease.daysUntilExpiry, lease.status) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {getExpiryWarning(lease.daysUntilExpiry, lease.status)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tenant: {lease.tenantName} ({lease.tenantEmail})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">{lease.startDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">{lease.endDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Rent</p>
                        <p className="font-medium">{lease.monthlyRent}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Security Deposit</p>
                        <p className="font-medium">{lease.deposit}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      Renew
                    </Button>
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