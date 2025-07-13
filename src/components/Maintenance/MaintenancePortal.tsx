import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, Wrench, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const MaintenancePortal = ({ userRole }: { userRole: string }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  
  const maintenanceRequests = [
    {
      id: 1,
      title: "Air conditioning not working",
      description: "AC unit in the main shopping area stopped working. Customers are complaining about the heat.",
      property: "Shopping Center A - Unit 101",
      tenant: "Coffee Shop Co.",
      priority: "high",
      status: "in-progress",
      submittedDate: "Nov 15, 2024",
      assignedTo: "HVAC Specialist Team",
      estimatedCompletion: "Nov 18, 2024"
    },
    {
      id: 2,
      title: "Leaky faucet in restroom",
      description: "Water is continuously dripping from the main faucet in the customer restroom.",
      property: "Shopping Center A - Unit 102",
      tenant: "Fashion Boutique",
      priority: "medium",
      status: "completed",
      submittedDate: "Nov 10, 2024",
      assignedTo: "Plumbing Services",
      completedDate: "Nov 12, 2024"
    },
    {
      id: 3,
      title: "Broken entrance door lock",
      description: "The main entrance door lock is not functioning properly. Security concern.",
      property: "Shopping Center B - Unit 201",
      tenant: "Electronics Store",
      priority: "high",
      status: "pending",
      submittedDate: "Nov 16, 2024",
      assignedTo: null,
      estimatedCompletion: null
    },
    {
      id: 4,
      title: "Lighting fixture replacement",
      description: "Several ceiling lights are flickering and need replacement.",
      property: "Shopping Center B - Unit 205",
      tenant: "Available Space",
      priority: "low",
      status: "completed",
      submittedDate: "Nov 5, 2024",
      assignedTo: "Electrical Maintenance",
      completedDate: "Nov 8, 2024"
    }
  ];

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.tenant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesPriority = filterPriority === "all" || request.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const stats = [
    {
      title: "Open Requests",
      value: "2",
      description: "Awaiting action",
      color: "text-orange-600"
    },
    {
      title: "In Progress",
      value: "1",
      description: "Being worked on",
      color: "text-blue-600"
    },
    {
      title: "Completed",
      value: "2",
      description: "This month",
      color: "text-green-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Portal</h2>
          <p className="text-muted-foreground">
            {userRole === "tenant" ? "Submit and track your maintenance requests" : "Manage property maintenance requests"}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Maintenance Request</DialogTitle>
              <DialogDescription>
                Describe the maintenance issue that needs attention
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input id="title" placeholder="Brief description of the issue" />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property">Property</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit101">Shopping Center A - Unit 101</SelectItem>
                      <SelectItem value="unit102">Shopping Center A - Unit 102</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide detailed description of the maintenance issue..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {userRole !== "tenant" && (
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
                  <Wrench className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search maintenance requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
          <CardDescription>
            {userRole === "tenant" ? "Your submitted requests" : "All property maintenance requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <h3 className="font-semibold">{request.title}</h3>
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(request.priority)}>
                        {request.priority} priority
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Property</p>
                        <p className="font-medium">{request.property}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">{request.submittedDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {request.status === "completed" ? "Completed" : "Assigned To"}
                        </p>
                        <p className="font-medium">
                          {request.status === "completed" 
                            ? request.completedDate 
                            : request.assignedTo || "Unassigned"
                          }
                        </p>
                      </div>
                    </div>
                    
                    {userRole !== "tenant" && (
                      <p className="text-sm text-muted-foreground">
                        Tenant: {request.tenant}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    {userRole !== "tenant" && request.status !== "completed" && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Edit className="w-3 h-3" />
                        Update
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