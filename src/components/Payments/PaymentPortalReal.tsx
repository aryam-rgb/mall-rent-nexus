import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, Search, DollarSign, Calendar, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentModal } from "./PaymentModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: string;
  payment_reference: string | null;
  notes: string | null;
  currency: string;
  created_at: string;
  lease_id: string;
  tenant_id: string;
  landlord_id: string;
  payment_method_id: string | null;
  lease?: {
    properties: {
      name: string;
      location: string;
      unit_number: string;
    };
  };
  tenant_profile?: {
    name: string;
  };
  payment_methods?: {
    name: string;
  };
}

interface Tenant {
  id: string;
  name: string;
}

interface Lease {
  id: string;
  tenant_id: string;
  monthly_rent: number;
  currency: string;
  properties: {
    name: string;
    location: string;
    unit_number: string;
  };
  profiles: {
    name: string;
  };
}

export const PaymentPortalReal = ({ userRole }: { userRole: string }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    lease_id: "",
    amount: "",
    due_date: "",
    payment_date: "",
    status: "pending",
    notes: "",
  });
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchPayments();
    if (userRole !== "tenant") {
      fetchTenants();
      fetchLeases();
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          lease:leases (
            properties (name, location, unit_number)
          ),
          tenant_profile:profiles!payments_tenant_id_fkey (name),
          payment_methods (name)
        `);

      // Filter based on user role
      if (userRole === 'tenant' && profile?.id) {
        query = query.eq('tenant_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'tenant');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchLeases = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          tenant_id,
          monthly_rent,
          currency,
          properties (name, location, unit_number),
          profiles!leases_tenant_id_fkey (name)
        `)
        .eq('status', 'active');

      if (error) throw error;
      setLeases(data || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
    }
  };

  const handleAddPayment = async () => {
    if (!profile?.id) return;

    try {
      const selectedLease = leases.find(l => l.id === formData.lease_id);
      if (!selectedLease) return;

      const { error } = await supabase
        .from('payments')
        .insert({
          lease_id: formData.lease_id,
          tenant_id: selectedLease.tenant_id,
          landlord_id: profile.id,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          payment_date: formData.payment_date || null,
          status: formData.status,
          notes: formData.notes || null,
          currency: selectedLease.currency || 'USD'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment record created successfully",
      });

      setIsAddPaymentOpen(false);
      setFormData({
        lease_id: "",
        amount: "",
        due_date: "",
        payment_date: "",
        status: "pending",
        notes: "",
      });
      fetchPayments();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment record",
        variant: "destructive",
      });
    }
  };

  const filteredPayments = payments.filter(payment => {
    const propertyName = payment.lease?.properties?.name || '';
    const tenantName = payment.tenant_profile?.name || '';
    const matchesSearch = propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "partial":
        return <DollarSign className="w-4 h-4 text-primary" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Calendar className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "partial":
        return "outline";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
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
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalCollected = payments
    .filter(p => p.status === 'paid' && p.payment_date?.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const overdueAmount = payments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = userRole !== "tenant" ? [
    {
      title: "Total Collected",
      value: formatAmount(totalCollected, 'USD' as const),
      description: "This month",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Pending Payments",
      value: formatAmount(pendingAmount, 'USD' as const),
      description: "Due this month",
      icon: Calendar,
      color: "text-warning"
    },
    {
      title: "Overdue Amount",
      value: formatAmount(overdueAmount, 'USD' as const),
      description: "Requires attention",
      icon: AlertCircle,
      color: "text-destructive"
    }
  ] : [];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">
            {userRole === "tenant" ? "View your payment history and make payments" : "Track tenant payments and generate reports"}
          </p>
        </div>
        {userRole !== "tenant" && (
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Payment Record</DialogTitle>
                <DialogDescription>
                  Create a payment record for a tenant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lease">Tenant & Property</Label>
                  <Select value={formData.lease_id} onValueChange={(value) => setFormData({...formData, lease_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant and property" />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((lease) => (
                        <SelectItem key={lease.id} value={lease.id}>
                          {(lease.profiles as any)?.name} - {lease.properties?.name} ({lease.properties?.unit_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input 
                      id="due_date" 
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date (if paid)</Label>
                    <Input 
                      id="payment_date" 
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input 
                    id="notes" 
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddPayment} disabled={!formData.lease_id || !formData.amount || !formData.due_date}>
                    Add Payment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
                <SelectItem value="partial">Partial</SelectItem>
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
                        {userRole === "tenant" 
                          ? `${payment.lease?.properties?.name} - ${payment.lease?.properties?.unit_number}`
                          : payment.tenant_profile?.name
                        }
                      </h3>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium text-lg">{formatAmount(payment.amount, payment.currency as 'USD' | 'UGX')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{formatDate(payment.due_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid Date</p>
                        <p className="font-medium">{payment.payment_date ? formatDate(payment.payment_date) : "Not paid"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-medium">{payment.payment_methods?.name || "N/A"}</p>
                      </div>
                    </div>
                    {userRole !== "tenant" && (
                      <p className="text-sm text-muted-foreground">
                        Property: {payment.lease?.properties ? 
                          `${payment.lease.properties.name} - ${payment.lease.properties.location} (${payment.lease.properties.unit_number})` :
                          'N/A'
                        }
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground">
                        Notes: {payment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {(payment.status === "pending" || payment.status === "partial") && userRole === "tenant" && (
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        <CreditCard className="w-3 h-3" />
                        {payment.status === "partial" ? "Pay Balance" : "Pay Now"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No payments found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onPaymentSubmit={(paymentData) => {
          console.log("Payment submitted:", paymentData);
          // Here you would typically send the payment data to your backend
        }}
      />
    </div>
  );
};