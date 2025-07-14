import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, Edit, Trash2, MapPin, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  landlord_id: string;
  name: string;
  location: string;
  unit_number: string;
  size_sqft: number;
  rent_amount: number;
  currency: 'USD' | 'UGX';
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
  image_url?: string;
}

export const PropertyManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const { profile } = useAuth();
  const { currentCurrency, formatAmount, convertAmount } = useCurrency();
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [sizeSqft, setSizeSqft] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [currency, setCurrency] = useState<'USD' | 'UGX'>('USD');
  const [status, setStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [description, setDescription] = useState("");

  // Sample images array
  const sampleImages = [
    '/images/mall-1.jpg',
    '/images/mall-2.jpg',
    '/images/mall-3.jpg',
    '/images/mall-4.jpg',
    '/images/mall-5.jpg'
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      let query = supabase.from("properties").select("*");
      
      // Filter by landlord if not superadmin
      if (profile?.role === 'landlord') {
        query = query.eq('landlord_id', profile.id);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data as Property[] || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setLocation("");
    setUnitNumber("");
    setSizeSqft("");
    setRentAmount("");
    setCurrency('USD');
    setStatus('available');
    setDescription("");
    setEditingProperty(null);
  };

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setName(property.name);
    setLocation(property.location);
    setUnitNumber(property.unit_number);
    setSizeSqft(property.size_sqft.toString());
    setRentAmount(property.rent_amount.toString());
    setCurrency(property.currency);
    setStatus(property.status);
    setDescription(property.description || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];

    try {
      if (editingProperty) {
        const { error } = await supabase
          .from("properties")
          .update({
            name,
            location,
            unit_number: unitNumber,
            size_sqft: parseInt(sizeSqft),
            rent_amount: parseFloat(rentAmount),
            currency,
            status,
            description,
          })
          .eq("id", editingProperty.id);

        if (error) throw error;
        
        toast({
          title: "Property updated",
          description: "The property has been successfully updated.",
        });
      } else {
        const { error } = await supabase
          .from("properties")
          .insert({
            landlord_id: profile.id,
            name,
            location,
            unit_number: unitNumber,
            size_sqft: parseInt(sizeSqft),
            rent_amount: parseFloat(rentAmount),
            currency,
            status,
            description,
            image_url: randomImage,
          });

        if (error) throw error;
        
        toast({
          title: "Property added",
          description: "The new property has been successfully added.",
        });
      }

      fetchProperties();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted.",
      });
      
      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "occupied":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "maintenance":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatRentAmount = (amount: number, propCurrency: 'USD' | 'UGX') => {
    if (propCurrency === currentCurrency) {
      return formatAmount(amount, propCurrency);
    }
    const converted = convertAmount(amount, propCurrency, currentCurrency);
    return `${formatAmount(converted, currentCurrency)} (${formatAmount(amount, propCurrency)})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Property Management</h2>
          <p className="text-muted-foreground">Manage your mall properties and units</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Add New Property"}
              </DialogTitle>
              <DialogDescription>
                {editingProperty ? "Update property details" : "Create a new property listing"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Downtown Mall - Unit 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit Number</Label>
                  <Input
                    id="unitNumber"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Downtown Mall, Floor 1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizeSqft">Size (sq ft)</Label>
                  <Input
                    id="sizeSqft"
                    type="number"
                    value={sizeSqft}
                    onChange={(e) => setSizeSqft(e.target.value)}
                    placeholder="1200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Rent Amount</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    step="0.01"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder="2500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
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
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Property description, amenities, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProperty ? "Update" : "Add"} Property
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="group hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
              {property.image_url && (
                <img
                  src={property.image_url}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1">{property.name}</CardTitle>
                <Badge className={getStatusColor(property.status)}>
                  {property.status}
                </Badge>
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {property.location}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="font-medium">{property.unit_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium flex items-center">
                    <Square className="w-3 h-3 mr-1" />
                    {property.size_sqft.toLocaleString()} sq ft
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Monthly Rent</p>
                <p className="text-lg font-bold text-primary">
                  {formatRentAmount(property.rent_amount, property.currency)}
                </p>
              </div>
              {property.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {property.description}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(property)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(property.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No properties match your search." : "Start by adding your first property."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};