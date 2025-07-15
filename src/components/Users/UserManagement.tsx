import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Users, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  
  const users = [
    {
      id: 1,
      name: "John Smith",
      email: "john@coffeeshop.com",
      phone: "+1 (555) 123-4567",
      role: "tenant",
      status: "active",
      properties: ["Shopping Center A - Unit 101"],
      joinDate: "Jan 15, 2024"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@properties.com",
      phone: "+1 (555) 234-5678",
      role: "landlord",
      status: "active",
      properties: ["Shopping Center A", "Shopping Center B"],
      joinDate: "Dec 1, 2023"
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@fashionboutique.com",
      phone: "+1 (555) 345-6789",
      role: "tenant",
      status: "active",
      properties: ["Shopping Center A - Unit 102"],
      joinDate: "Jul 1, 2024"
    },
    {
      id: 4,
      name: "Emma Wilson",
      email: "emma@electrostore.com",
      phone: "+1 (555) 456-7890",
      role: "tenant",
      status: "inactive",
      properties: ["Shopping Center B - Unit 201"],
      joinDate: "Mar 15, 2024"
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@realestate.com",
      phone: "+1 (555) 567-8901",
      role: "landlord",
      status: "active",
      properties: ["Shopping Center C"],
      joinDate: "Aug 10, 2023"
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "default";
      case "landlord":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "default" : "destructive";
  };

  const stats = [
    { title: "Total Users", value: "5", description: "Active system users" },
    { title: "Landlords", value: "2", description: "Property managers" },
    { title: "Tenants", value: "3", description: "Property renters" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account in the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name</Label>
                  <Input id="userName" placeholder="Enter full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input id="userEmail" type="email" placeholder="Enter email address" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Phone</Label>
                  <Input id="userPhone" placeholder="Enter phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Role</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userPassword">Temporary Password</Label>
                <Input id="userPassword" type="password" placeholder="Enter temporary password" />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button onClick={() => {
                  // Here you would typically send user data to your backend
                  console.log("Creating user...");
                }}>Create User</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="landlord">Landlords</SelectItem>
                <SelectItem value="tenant">Tenants</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage all registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Joined: </span>
                        <span className="font-medium">{user.joinDate}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {user.role === "landlord" ? "Manages Properties:" : "Renting:"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {user.properties.map((property, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {property}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                      Delete
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