import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Building2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const PropertyManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [properties] = useState([
    {
      id: 1,
      name: "Shopping Center A - Unit 101",
      location: "Downtown Mall, Floor 1",
      size: "1,200 sq ft",
      rent: "$2,500",
      status: "occupied",
      tenant: "Coffee Shop Co.",
      leaseEnd: "Dec 31, 2024"
    },
    {
      id: 2,
      name: "Shopping Center A - Unit 102",
      location: "Downtown Mall, Floor 1",
      size: "800 sq ft",
      rent: "$3,200",
      status: "occupied",
      tenant: "Fashion Boutique",
      leaseEnd: "Jun 30, 2025"
    },
    {
      id: 3,
      name: "Shopping Center B - Unit 201",
      location: "North Plaza, Floor 2",
      size: "2,000 sq ft",
      rent: "$4,100",
      status: "occupied",
      tenant: "Electronics Store",
      leaseEnd: "Mar 15, 2025"
    },
    {
      id: 4,
      name: "Shopping Center B - Unit 205",
      location: "North Plaza, Floor 2",
      size: "1,500 sq ft",
      rent: "$2,800",
      status: "vacant",
      tenant: null,
      leaseEnd: null
    }
  ]);

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PropertyForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="propertyName">Property Name</Label>
          <Input id="propertyName" placeholder="e.g., Shopping Center A - Unit 101" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="e.g., Downtown Mall, Floor 1" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input id="size" placeholder="e.g., 1,200 sq ft" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rent">Monthly Rent</Label>
          <Input id="rent" placeholder="e.g., $2,500" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Property description and amenities..." />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save Property</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Property Management</h2>
          <p className="text-muted-foreground">
            Manage your rental properties and track occupancy
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Create a new rental property in your portfolio
              </DialogDescription>
            </DialogHeader>
            <PropertyForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search properties by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                </div>
                <Badge variant={property.status === "occupied" ? "default" : property.status === "vacant" ? "secondary" : "outline"}>
                  {property.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {property.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{property.size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Rent</p>
                  <p className="font-medium">{property.rent}</p>
                </div>
              </div>
              
              {property.tenant && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Current Tenant</p>
                  <p className="font-medium">{property.tenant}</p>
                  <p className="text-xs text-muted-foreground">
                    Lease ends: {property.leaseEnd}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};