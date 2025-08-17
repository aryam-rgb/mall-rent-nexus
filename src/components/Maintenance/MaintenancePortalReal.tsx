import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, Wrench, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  properties?: {
    name: string;
    location: string;
    unit_number: string;
  };
  tenant_profile?: {
    name: string;
  };
}

interface Property {
  id: string;
  name: string;
  location: string;
  unit_number: string;
}

export const MaintenancePortalReal = ({ userRole }: { userRole: string }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    property_id: "",
  });
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaintenanceRequests();
    fetchProperties();

    // Set up real-time subscription
    const channel = supabase
      .channel('maintenance-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () => {
        fetchMaintenanceRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const fetchMaintenanceRequests = async () => {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          properties (name, location, unit_number),
          tenant_profile:profiles!maintenance_requests_tenant_id_fkey (name)
        `);

      // Filter based on user role
      if (userRole === 'tenant' && profile?.id) {
        query = query.eq('tenant_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, location, unit_number');

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSubmitRequest = async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          property_id: formData.property_id,
          tenant_id: profile.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance request submitted successfully",
      });

      setIsNewRequestOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        property_id: "",
      });
      fetchMaintenanceRequests();
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast({
        title: "Error",
        description: "Failed to submit maintenance request",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request status updated successfully",
      });

      fetchMaintenanceRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.properties?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.tenant_profile?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesPriority = filterPriority === "all" || request.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-primary" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats for non-tenant users
  const stats = userRole !== "tenant" ? [
    {
      title: "Open Requests",
      value: requests.filter(r => r.status === 'pending').length.toString(),
      description: "Awaiting action",
      color: "text-warning"
    },
    {
      title: "In Progress",
      value: requests.filter(r => r.status === 'in-progress').length.toString(),
      description: "Being worked on",
      color: "text-primary"
    },
    {
      title: "Completed",
      value: requests.filter(r => r.status === 'completed').length.toString(),
      description: "This month",
      color: "text-success"
    }
  ] : [];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Portal</h2>
          <p className="text-muted-foreground">
            {userRole === "tenant" ? "Submit and track your maintenance requests" : "Manage property maintenance requests"}
          </p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
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
                <Input 
                  id="title" 
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property">Property</Label>
                  <Select value={formData.property_id} onValueChange={(value) => setFormData({...formData, property_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.location} ({property.unit_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
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
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitRequest} disabled={!formData.title || !formData.description || !formData.property_id}>
                  Submit Request
                </Button>
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
                        <p className="font-medium">
                          {request.properties ? 
                            `${request.properties.name} - ${request.properties.location} (${request.properties.unit_number})` :
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">{formatDate(request.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assigned To</p>
                        <p className="font-medium">{request.assigned_to || "Unassigned"}</p>
                      </div>
                    </div>
                    
                    {userRole !== "tenant" && (
                      <p className="text-sm text-muted-foreground">
                        Tenant: {request.tenant_profile?.name || 'N/A'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    {userRole !== "tenant" && request.status !== "completed" && (
                      <Select onValueChange={(value) => handleStatusUpdate(request.id, value)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No maintenance requests found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
            <DialogDescription>
              Full details of the maintenance request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedRequest.status)}
                <h3 className="text-lg font-semibold">{selectedRequest.title}</h3>
                <Badge variant={getStatusVariant(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
                <Badge variant={getPriorityVariant(selectedRequest.priority)}>
                  {selectedRequest.priority} priority
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{selectedRequest.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Property</Label>
                    <p className="text-sm font-medium mt-1">
                      {selectedRequest.properties ? 
                        `${selectedRequest.properties.name} - ${selectedRequest.properties.location} (${selectedRequest.properties.unit_number})` :
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <p className="text-sm font-medium mt-1">
                      {selectedRequest.assigned_to || "Unassigned"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Submitted On</Label>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(selectedRequest.created_at)}
                    </p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(selectedRequest.updated_at)}
                    </p>
                  </div>
                </div>
                
                {userRole !== "tenant" && (
                  <div>
                    <Label>Tenant</Label>
                    <p className="text-sm font-medium mt-1">
                      {selectedRequest.tenant_profile?.name || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};