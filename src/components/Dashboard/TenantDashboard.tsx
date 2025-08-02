import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, CreditCard, Calendar, Wrench, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";

interface LeaseInfo {
  property_name: string;
  unit_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  due_date: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  priority: string;
}

export const TenantDashboard = () => {
  const [leaseInfo, setLeaseInfo] = useState<LeaseInfo | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();

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
          start_date,
          end_date,
          monthly_rent,
          currency,
          status,
          properties!inner(name, unit_number)
        `)
        .eq('tenant_id', profile.id)
        .eq('status', 'active')
        .single();

      if (leaseData) {
        setLeaseInfo({
          property_name: leaseData.properties.name,
          unit_number: leaseData.properties.unit_number,
          start_date: leaseData.start_date,
          end_date: leaseData.end_date,
          monthly_rent: leaseData.monthly_rent,
          currency: leaseData.currency,
          status: leaseData.status
        });
      }

      // Fetch payment history
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, amount, payment_date, due_date, status')
        .eq('tenant_id', profile.id)
        .order('payment_date', { ascending: false })
        .limit(6);

      setPaymentHistory(paymentsData || []);

      // Fetch maintenance requests
      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('id, title, description, created_at, status, priority')
        .eq('tenant_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setMaintenanceRequests(maintenanceData || []);

    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
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

      {/* Lease Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Lease Information
          </CardTitle>
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payments
              </CardTitle>
              <Button size="sm">Pay Rent</Button>
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
                    <p className="font-medium text-sm">{formatAmount(payment.amount, 'USD')}</p>
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
              <Button size="sm" variant="outline">New Request</Button>
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
    </div>
  );
};