import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, Building2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  username?: string;
}

interface UserWithProperties extends UserProfile {
  properties: string[];
}

interface Property {
  id: string;
  name: string;
  location: string;
  unit_number: string;
  status: string;
}

export const UserManagement = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [users, setUsers] = useState<UserWithProperties[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProperties | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    role: "",
    password: ""
  });
  const [editUser, setEditUser] = useState({
    id: "",
    name: "",
    email: "",
    username: "",
    phone: "",
    role: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('id, name, location, unit_number, status')
        .eq('status', 'available');

      if (error) throw error;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // For each user, fetch their properties
      const usersWithProperties = await Promise.all(
        (profiles || []).map(async (profile) => {
          const properties = [];

          if (profile.role === 'landlord') {
            // Get properties owned by this landlord
            const { data: ownedProperties } = await supabase
              .from('properties')
              .select('name, location')
              .eq('landlord_id', profile.id);
            
            if (ownedProperties) {
              properties.push(...ownedProperties.map(p => `${p.name} (${p.location})`));
            }
          } else if (profile.role === 'tenant') {
            // Get properties rented by this tenant
            const { data: leases } = await supabase
              .from('leases')
              .select('properties(name, location, unit_number)')
              .eq('tenant_id', profile.id)
              .eq('status', 'active');
            
            if (leases) {
              leases.forEach(lease => {
                if (lease.properties) {
                  const prop = lease.properties as any;
                  properties.push(`${prop.name} - Unit ${prop.unit_number}`);
                }
              });
            }
          }

          return {
            ...profile,
            properties: properties.length > 0 ? properties : ['No properties assigned']
          };
        })
      );

      setUsers(usersWithProperties);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role,
            username: newUser.username || newUser.name.toLowerCase().replace(/\s+/g, ''),
            phone: newUser.phone
          }
        }
      });

      if (authError) throw authError;

      toast.success('User created successfully');
      setIsAddDialogOpen(false);
      setNewUser({ name: "", email: "", username: "", phone: "", role: "", password: "" });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!editUser.name || !editUser.email || !editUser.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editUser.name,
          email: editUser.email,
          username: editUser.username,
          phone: editUser.phone,
          role: editUser.role
        })
        .eq('id', editUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setEditUser({ id: "", name: "", email: "", username: "", phone: "", role: "" });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleAssignUnit = async (userId: string, propertyId: string) => {
    try {
      // Create a new lease for the tenant
      const today = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(today.getFullYear() + 1);

      const { error: leaseError } = await supabase
        .from('leases')
        .insert({
          property_id: propertyId,
          tenant_id: userId,
          landlord_id: profile?.id,
          start_date: today.toISOString().split('T')[0],
          end_date: oneYearLater.toISOString().split('T')[0],
          monthly_rent: 1000, // Default rent, can be customized
          deposit: 1000,
          status: 'active'
        });

      if (leaseError) throw leaseError;

      // Update property status to occupied
      const { error: propertyError } = await supabase
        .from('properties')
        .update({ status: 'occupied' })
        .eq('id', propertyId);

      if (propertyError) throw propertyError;

      toast.success('Unit assigned successfully');
      setIsUnitDialogOpen(false);
      fetchUsers();
      fetchProperties();
    } catch (error: any) {
      console.error('Error assigning unit:', error);
      toast.error(error.message || 'Failed to assign unit');
    }
  };

  const openEditDialog = (user: UserWithProperties) => {
    setEditUser({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || "",
      phone: user.phone || "",
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const openUnitDialog = (user: UserWithProperties) => {
    setSelectedUser(user);
    setIsUnitDialogOpen(true);
  };

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
    { 
      title: "Total Users", 
      value: users.length.toString(), 
      description: "Active system users" 
    },
    { 
      title: "Landlords", 
      value: users.filter(u => u.role === 'landlord').length.toString(), 
      description: "Property managers" 
    },
    { 
      title: "Tenants", 
      value: users.filter(u => u.role === 'tenant').length.toString(), 
      description: "Property renters" 
    }
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  <Label htmlFor="userName">Full Name *</Label>
                  <Input 
                    id="userName" 
                    placeholder="Enter full name" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userUsername">Username</Label>
                  <Input 
                    id="userUsername" 
                    placeholder="Enter unique username" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email *</Label>
                <Input 
                  id="userEmail" 
                  type="email" 
                  placeholder="Enter email address" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Phone</Label>
                  <Input 
                    id="userPhone" 
                    placeholder="Enter phone number" 
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      {profile?.role === 'superadmin' && (
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userPassword">Temporary Password *</Label>
                <Input 
                  id="userPassword" 
                  type="password" 
                  placeholder="Enter temporary password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateUser}>Create User</Button>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {searchTerm || filterRole !== "all" ? "No users found matching your criteria" : "No users registered yet"}
              </div>
            </div>
          ) : (
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Joined: </span>
                          <span className="font-medium">
                            {new Date(user.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {user.role === "landlord" ? "Manages Properties:" : 
                           user.role === "tenant" ? "Renting:" : "System Access"}
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
                    
                    {profile?.role === 'superadmin' && (
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditDialog(user)}>
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        {user.role === 'tenant' && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openUnitDialog(user)}>
                            <Building2 className="w-3 h-3" />
                            Assign Unit
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user account and remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editUserName">Full Name *</Label>
                <Input 
                  id="editUserName" 
                  placeholder="Enter full name" 
                  value={editUser.name}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserUsername">Username</Label>
                <Input 
                  id="editUserUsername" 
                  placeholder="Enter unique username" 
                  value={editUser.username}
                  onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editUserEmail">Email *</Label>
              <Input 
                id="editUserEmail" 
                type="email" 
                placeholder="Enter email address" 
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editUserPhone">Phone</Label>
                <Input 
                  id="editUserPhone" 
                  placeholder="Enter phone number" 
                  value={editUser.phone}
                  onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserRole">Role *</Label>
                <Select value={editUser.role} onValueChange={(value) => setEditUser({...editUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    {profile?.role === 'superadmin' && (
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditUser}>Update User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit Assignment Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Unit to {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Select an available unit to assign to this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">No available units found</div>
                <p className="text-sm text-muted-foreground mt-2">
                  All units are currently occupied or there are no properties added yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {properties.map((property) => (
                  <Card key={property.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{property.name}</h4>
                          <p className="text-sm text-muted-foreground">Unit {property.unit_number}</p>
                          <p className="text-sm text-muted-foreground">{property.location}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => selectedUser && handleAssignUnit(selectedUser.id, property.id)}
                        >
                          Assign Unit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};