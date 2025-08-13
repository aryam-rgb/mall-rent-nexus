import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, FileText, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface Lease {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit: number;
  status: string;
  terms?: string;
  currency: string;
  property: {
    name: string;
    unit_number: string;
    location: string;
  };
  tenant: {
    name: string;
    email: string;
  };
}

interface Property {
  id: string;
  name: string;
  unit_number: string;
  location: string;
  status: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const LeaseManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    tenant_id: "",
    start_date: "",
    end_date: "",
    monthly_rent: "",
    deposit: "",
    terms: "",
    currency: "USD"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLeases();
    fetchProperties();
    fetchTenants();
  }, []);

  const fetchLeases = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          property:properties(name, unit_number, location),
          tenant:profiles!leases_tenant_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeases(data || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leases",
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
        .select('*')
        .eq('status', 'available')
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('name');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleCreateLease = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('leases')
        .insert({
          property_id: formData.property_id,
          tenant_id: formData.tenant_id,
          landlord_id: profile.id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          monthly_rent: parseFloat(formData.monthly_rent),
          deposit: parseFloat(formData.deposit),
          terms: formData.terms,
          currency: formData.currency,
          status: 'active'
        });

      if (error) throw error;

      // Update property status to occupied
      await supabase
        .from('properties')
        .update({ status: 'occupied' })
        .eq('id', formData.property_id);

      toast({
        title: "Success",
        description: "Lease created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchLeases();
      fetchProperties();
    } catch (error) {
      console.error('Error creating lease:', error);
      toast({
        title: "Error",
        description: "Failed to create lease",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLease = async () => {
    if (!editingLease) return;

    try {
      const { error } = await supabase
        .from('leases')
        .update({
          property_id: formData.property_id,
          tenant_id: formData.tenant_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          monthly_rent: parseFloat(formData.monthly_rent),
          deposit: parseFloat(formData.deposit),
          terms: formData.terms,
          currency: formData.currency
        })
        .eq('id', editingLease.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lease updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingLease(null);
      resetForm();
      fetchLeases();
    } catch (error) {
      console.error('Error updating lease:', error);
      toast({
        title: "Error",
        description: "Failed to update lease",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLease = async (leaseId: string, propertyId: string) => {
    try {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', leaseId);

      if (error) throw error;

      // Update property status back to available
      await supabase
        .from('properties')
        .update({ status: 'available' })
        .eq('id', propertyId);

      toast({
        title: "Success",
        description: "Lease deleted successfully",
      });

      fetchLeases();
      fetchProperties();
    } catch (error) {
      console.error('Error deleting lease:', error);
      toast({
        title: "Error",
        description: "Failed to delete lease",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      monthly_rent: "",
      deposit: "",
      terms: "",
      currency: "USD"
    });
  };

  const openEditDialog = (lease: Lease) => {
    setEditingLease(lease);
    setFormData({
      property_id: lease.property_id,
      tenant_id: lease.tenant_id,
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: lease.monthly_rent.toString(),
      deposit: lease.deposit.toString(),
      terms: lease.terms || "",
      currency: lease.currency
    });
    setIsEditDialogOpen(true);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(parseISO(endDate), new Date());
  };

  const getStatus = (endDate: string, currentStatus: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(endDate);
    if (daysUntilExpiry < 0) return "expired";
    return currentStatus;
  };

  const filteredLeases = leases.filter(lease =>
    lease.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lease.tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading leases...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lease Management</h2>
          <p className="text-muted-foreground">
            Manage lease agreements and track expiration dates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  <Select value={formData.property_id} onValueChange={(value) => setFormData({...formData, property_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                  <Input 
                    id="monthlyRent" 
                    type="number"
                    placeholder="2500"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Security Deposit</Label>
                  <Input 
                    id="deposit" 
                    type="number"
                    placeholder="5000"
                    value={formData.deposit}
                    onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="UGX">UGX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea 
                  id="terms"
                  placeholder="Enter lease terms and conditions..."
                  value={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>Cancel</Button>
                <Button onClick={handleCreateLease}>Create Lease</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lease Agreement</DialogTitle>
              <DialogDescription>
                Update lease agreement details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-property">Property</Label>
                  <Select value={formData.property_id} onValueChange={(value) => setFormData({...formData, property_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.unit_number}
                        </SelectItem>
                      ))}
                      {editingLease && (
                        <SelectItem value={editingLease.property_id}>
                          {editingLease.property.name} - {editingLease.property.unit_number} (Current)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tenant">Tenant</Label>
                  <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input 
                    id="edit-startDate" 
                    type="date" 
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input 
                    id="edit-endDate" 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-monthlyRent">Monthly Rent</Label>
                  <Input 
                    id="edit-monthlyRent" 
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deposit">Security Deposit</Label>
                  <Input 
                    id="edit-deposit" 
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="UGX">UGX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-terms">Terms & Conditions</Label>
                <Textarea 
                  id="edit-terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); setEditingLease(null); resetForm();}}>Cancel</Button>
                <Button onClick={handleUpdateLease}>Update Lease</Button>
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
          {filteredLeases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No leases found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeases.map((lease) => {
                const daysUntilExpiry = getDaysUntilExpiry(lease.end_date);
                const currentStatus = getStatus(lease.end_date, lease.status);
                
                return (
                  <div key={lease.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">{lease.property.name} - {lease.property.unit_number}</h3>
                          <Badge variant={getStatusColor(currentStatus, daysUntilExpiry)}>
                            {currentStatus}
                          </Badge>
                          {getExpiryWarning(daysUntilExpiry, currentStatus) && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {getExpiryWarning(daysUntilExpiry, currentStatus)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tenant: {lease.tenant.name} ({lease.tenant.email})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Start Date</p>
                            <p className="font-medium">{format(parseISO(lease.start_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">End Date</p>
                            <p className="font-medium">{format(parseISO(lease.end_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monthly Rent</p>
                            <p className="font-medium">{lease.currency} {lease.monthly_rent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Security Deposit</p>
                            <p className="font-medium">{lease.currency} {lease.deposit.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={() => openEditDialog(lease)}
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lease</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this lease? This action cannot be undone and will make the property available again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteLease(lease.id, lease.property_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};