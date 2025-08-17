import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, CreditCard, Calendar, Wrench, AlertCircle, CheckCircle, Bell, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/Payments/PaymentModal";

interface LeaseInfo {
  id: string;
  property_id: string;
  property_name: string;
  unit_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  status: string;
  landlord_id: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  due_date: string;
  currency: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  priority: string;
  property_id: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  is_urgent: boolean;
  created_at: string;
  read_status: any;
}

interface LeaseRenewalRequest {
  id: string;
  requested_end_date: string;
  requested_rent: number;
  request_message: string;
  status: string;
  created_at: string;
  response_message: string;
}

export const TenantDashboardReal = () => {
  const [leaseInfo, setLeaseInfo] = useState<LeaseInfo | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [renewalRequests, setRenewalRequests] = useState<LeaseRenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  
  // Form states
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    priority: "medium"
  });
  
  const [renewalForm, setRenewalForm] = useState({
    requested_end_date: "",
    requested_rent: "",
    request_message: ""
  });

  const { profile } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchTenantData();
    }
  }, [profile]);

  const fetchTenantData = async () => {
    if (!profile) return;

    try {
      // Fetch tenant's active lease
      const { data: leaseData } = await supabase
        .from('leases')
        .select(`
          id,
          start_date,
          end_date,
          monthly_rent,
          currency,
          status,
          landlord_id,
          property_id,
          properties!inner(id, name, unit_number)
        `)
        .eq('tenant_id', profile.id)
        .eq('status', 'active')
        .single();

      if (leaseData) {
        setLeaseInfo({
          id: leaseData.id,
          property_id: leaseData.property_id,
          property_name: leaseData.properties.name,
          unit_number: leaseData.properties.unit_number,
          start_date: leaseData.start_date,
          end_date: leaseData.end_date,
          monthly_rent: leaseData.monthly_rent,
          currency: leaseData.currency,
          status: leaseData.status,
          landlord_id: leaseData.landlord_id
        });
      }

      // Fetch payment history
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, amount, payment_date, due_date, status, currency')
        .eq('tenant_id', profile.id)
        .order('payment_date', { ascending: false })
        .limit(6);

      setPaymentHistory(paymentsData || []);

      // Fetch maintenance requests
      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('id, title, description, created_at, status, priority, property_id')
        .eq('tenant_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setMaintenanceRequests(maintenanceData || []);

      // Fetch notices
      const { data: noticesData } = await supabase
        .from('notices')
        .select('id, title, content, is_urgent, created_at, read_status')
        .or(`recipient_type.eq.all,and(recipient_type.eq.individual,recipient_id.eq.${profile.id}),and(recipient_type.eq.property,property_id.eq.${leaseData?.property_id})`)
        .order('created_at', { ascending: false })
        .limit(5);

      setNotices(noticesData || []);

      // Fetch lease renewal requests
      const { data: renewalData } = await supabase
        .from('lease_renewal_requests')
        .select('id, requested_end_date, requested_rent, request_message, status, created_at, response_message')
        .eq('tenant_id', profile.id)
        .order('created_at', { ascending: false });

      setRenewalRequests(renewalData || []);

    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async () => {
    if (!profile || !leaseInfo) return;

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: maintenanceForm.title,
          description: maintenanceForm.description,
          priority: maintenanceForm.priority,
          tenant_id: profile.id,
          landlord_id: leaseInfo.landlord_id,
          property_id: leaseInfo.property_id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance request submitted successfully",
      });

      setMaintenanceForm({ title: "", description: "", priority: "medium" });
      setShowMaintenanceDialog(false);
      fetchTenantData();
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast({
        title: "Error",
        description: "Failed to submit maintenance request",
        variant: "destructive",
      });
    }
  };

  const handleRenewalSubmit = async () => {
    if (!profile || !leaseInfo) return;

    try {
      const { error } = await supabase
        .from('lease_renewal_requests')
        .insert({
          lease_id: leaseInfo.id,
          tenant_id: profile.id,
          landlord_id: leaseInfo.landlord_id,
          requested_end_date: renewalForm.requested_end_date,
          requested_rent: parseFloat(renewalForm.requested_rent) || leaseInfo.monthly_rent,
          request_message: renewalForm.request_message,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lease renewal request submitted successfully",
      });

      setRenewalForm({ requested_end_date: "", requested_rent: "", request_message: "" });
      setShowRenewalDialog(false);
      fetchTenantData();
    } catch (error) {
      console.error('Error submitting renewal request:', error);
      toast({
        title: "Error",
        description: "Failed to submit renewal request",
        variant: "destructive",
      });
    }
  };

  const markNoticeAsRead = async (noticeId: string) => {
    if (!profile) return;

    const notice = notices.find(n => n.id === noticeId);
    if (!notice) return;

    const currentReadStatus = notice.read_status || {};
    const updatedReadStatus = {
      ...currentReadStatus,
      [profile.id]: true
    };

    try {
      const { error } = await supabase
        .from('notices')
        .update({ read_status: updatedReadStatus })
        .eq('id', noticeId);

      if (error) throw error;

      setNotices(notices.map(n => 
        n.id === noticeId 
          ? { ...n, read_status: updatedReadStatus }
          : n
      ));
    } catch (error) {
      console.error('Error marking notice as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Tenancy</h2>
        <p className="text-muted-foreground">
          View your lease details, payments, and maintenance requests
        </p>
      </div>

      {/* Notices Section */}
      {notices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.map((notice) => {
              const isRead = notice.read_status?.[profile?.id];
              return (
                <div 
                  key={notice.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isRead ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  }`}
                  onClick={() => markNoticeAsRead(notice.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notice.title}</h4>
                        {notice.is_urgent && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        {!isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notice.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Lease Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Lease Information
            </CardTitle>
            <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Renewal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Lease Renewal</DialogTitle>
                  <DialogDescription>
                    Submit a request to renew your lease with updated terms
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="requested_end_date">Requested End Date</Label>
                    <Input
                      id="requested_end_date"
                      type="date"
                      value={renewalForm.requested_end_date}
                      onChange={(e) => setRenewalForm({ ...renewalForm, requested_end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="requested_rent">Requested Monthly Rent (optional)</Label>
                    <Input
                      id="requested_rent"
                      type="number"
                      placeholder={`Current: ${leaseInfo?.monthly_rent || 0}`}
                      value={renewalForm.requested_rent}
                      onChange={(e) => setRenewalForm({ ...renewalForm, requested_rent: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="request_message">Message (optional)</Label>
                    <Textarea
                      id="request_message"
                      placeholder="Any additional comments or requests..."
                      value={renewalForm.request_message}
                      onChange={(e) => setRenewalForm({ ...renewalForm, request_message: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleRenewalSubmit} disabled={!renewalForm.requested_end_date}>
                      Submit Request
                    </Button>
                    <Button variant="outline" onClick={() => setShowRenewalDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading lease information...</div>
          ) : leaseInfo ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Property</p>
                <p className="text-lg font-semibold">{leaseInfo.property_name} - {leaseInfo.unit_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lease Period</p>
                <p className="text-lg font-semibold">{new Date(leaseInfo.start_date).toLocaleDateString()} - {new Date(leaseInfo.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-semibold">{formatAmount(leaseInfo.monthly_rent, leaseInfo.currency as 'USD' | 'UGX')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="default">{leaseInfo.status}</Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No active lease found</div>
          )}
        </CardContent>
      </Card>

      {/* Renewal Requests */}
      {renewalRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Lease Renewal Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renewalRequests.map((request) => (
              <div key={request.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Renewal until {new Date(request.requested_end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.request_message && (
                      <p className="text-xs text-muted-foreground mt-1">{request.request_message}</p>
                    )}
                    {request.response_message && (
                      <p className="text-xs text-primary mt-1">Response: {request.response_message}</p>
                    )}
                  </div>
                  <Badge 
                    variant={
                      request.status === "approved" ? "default" : 
                      request.status === "rejected" ? "destructive" : 
                      "secondary"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payments
              </CardTitle>
              <Button size="sm" onClick={() => setShowPaymentModal(true)}>
                Pay Rent
              </Button>
            </div>
            <CardDescription>
              Your payment history and upcoming dues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading payment history...</div>
            ) : paymentHistory.length > 0 ? (
              paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{new Date(payment.payment_date).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(payment.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatAmount(payment.amount, payment.currency as 'USD' | 'UGX')}</p>
                    <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No payment history found</div>
            )}
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
              <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">New Request</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Maintenance Request</DialogTitle>
                    <DialogDescription>
                      Describe the issue you're experiencing in your unit
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Brief description of the issue"
                        value={maintenanceForm.title}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed description of the maintenance issue"
                        value={maintenanceForm.description}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={maintenanceForm.priority} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleMaintenanceSubmit} disabled={!maintenanceForm.title || !maintenanceForm.description}>
                        Submit Request
                      </Button>
                      <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Track your maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading maintenance requests...</div>
            ) : maintenanceRequests.length > 0 ? (
              maintenanceRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{request.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        request.priority === "high" ? "destructive" : 
                        request.priority === "medium" ? "secondary" : 
                        "outline"
                      }
                    >
                      {request.priority}
                    </Badge>
                    <Badge 
                      variant={
                        request.status === "completed" ? "default" : 
                        request.status === "in-progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {request.status === "completed" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : request.status === "in-progress" ? (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      ) : null}
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No maintenance requests found</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && leaseInfo && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          payment={{
            id: parseInt(leaseInfo.id.substring(0, 8), 16),
            tenant: profile?.name || "Tenant",
            property: `${leaseInfo.property_name} - ${leaseInfo.unit_number}`,
            amount: formatAmount(leaseInfo.monthly_rent, leaseInfo.currency as 'USD' | 'UGX'),
            dueDate: new Date().toLocaleDateString(),
            status: "pending"
          }}
          onPaymentSubmit={async (paymentData) => {
            // Handle payment submission logic here
            console.log('Payment submitted:', paymentData);
            setShowPaymentModal(false);
            fetchTenantData();
          }}
        />
      )}
    </div>
  );
};