import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Users, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notice {
  id: string;
  title: string;
  content: string;
  recipient_type: string;
  recipient_id: string | null;
  property_id: string | null;
  is_urgent: boolean;
  created_at: string;
  read_status: any;
  sender: {
    name: string;
  };
  property?: {
    name: string;
    unit_number: string;
  };
  recipient?: {
    name: string;
  };
}

interface Property {
  id: string;
  name: string;
  unit_number: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
}

export const NoticeManagement = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
    recipient_type: "all",
    recipient_id: "",
    property_id: "",
    is_urgent: false
  });

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile && (profile.role === 'landlord' || profile.role === 'superadmin')) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    try {
      // Fetch notices
      let noticesQuery = supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile.role === 'landlord') {
        noticesQuery = noticesQuery.eq('sender_id', profile.id);
      }

      const { data: noticesData } = await noticesQuery;
      
      // Transform the data to match our interface
      const transformedNotices: Notice[] = (noticesData || []).map(notice => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        recipient_type: notice.recipient_type,
        recipient_id: notice.recipient_id,
        property_id: notice.property_id,
        is_urgent: notice.is_urgent,
        created_at: notice.created_at,
        read_status: notice.read_status,
        sender: { name: 'Admin' }
      }));
      
      setNotices(transformedNotices);

      // Fetch properties
      let propertiesQuery = supabase
        .from('properties')
        .select('id, name, unit_number');

      if (profile.role === 'landlord') {
        propertiesQuery = propertiesQuery.eq('landlord_id', profile.id);
      }

      const { data: propertiesData } = await propertiesQuery;
      setProperties(propertiesData || []);

      // Fetch tenants
      const { data: tenantsData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'tenant');

      setTenants(tenantsData || []);

    } catch (error) {
      console.error('Error fetching notice data:', error);
      toast({
        title: "Error",
        description: "Failed to load notice data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async () => {
    if (!profile) return;

    try {
      const noticeData = {
        title: noticeForm.title,
        content: noticeForm.content,
        recipient_type: noticeForm.recipient_type,
        recipient_id: noticeForm.recipient_type === 'individual' ? noticeForm.recipient_id : null,
        property_id: noticeForm.recipient_type === 'property' ? noticeForm.property_id : null,
        is_urgent: noticeForm.is_urgent,
        sender_id: profile.id
      };

      const { error } = await supabase
        .from('notices')
        .insert(noticeData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notice created successfully",
      });

      setNoticeForm({
        title: "",
        content: "",
        recipient_type: "all",
        recipient_id: "",
        property_id: "",
        is_urgent: false
      });
      setShowCreateDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error creating notice:', error);
      toast({
        title: "Error",
        description: "Failed to create notice",
        variant: "destructive",
      });
    }
  };

  const getRecipientInfo = (notice: Notice) => {
    switch (notice.recipient_type) {
      case 'all':
        return { text: 'All Tenants', icon: Users };
      case 'individual':
        return { text: notice.recipient?.name || 'Individual Tenant', icon: User };
      case 'property':
        return { text: `${notice.property?.name} - ${notice.property?.unit_number}` || 'Property Tenants', icon: Building };
      default:
        return { text: 'Unknown', icon: User };
    }
  };

  const getReadCount = (notice: Notice) => {
    if (!notice.read_status || typeof notice.read_status !== 'object') return 0;
    return Object.values(notice.read_status).filter(Boolean).length;
  };

  if (loading) {
    return <div className="text-center py-4">Loading notices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notice Management</h2>
          <p className="text-muted-foreground">
            Send notices and announcements to tenants
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Notice</DialogTitle>
              <DialogDescription>
                Send a notice to tenants. Choose recipients and set urgency level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notice title"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Notice content"
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="recipient_type">Send To</Label>
                <Select 
                  value={noticeForm.recipient_type} 
                  onValueChange={(value) => setNoticeForm({ 
                    ...noticeForm, 
                    recipient_type: value,
                    recipient_id: "",
                    property_id: ""
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="individual">Individual Tenant</SelectItem>
                    <SelectItem value="property">Property Tenants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {noticeForm.recipient_type === 'individual' && (
                <div>
                  <Label htmlFor="recipient_id">Select Tenant</Label>
                  <Select 
                    value={noticeForm.recipient_id} 
                    onValueChange={(value) => setNoticeForm({ ...noticeForm, recipient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a tenant" />
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
              )}

              {noticeForm.recipient_type === 'property' && (
                <div>
                  <Label htmlFor="property_id">Select Property</Label>
                  <Select 
                    value={noticeForm.property_id} 
                    onValueChange={(value) => setNoticeForm({ ...noticeForm, property_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property" />
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
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_urgent"
                  checked={noticeForm.is_urgent}
                  onCheckedChange={(checked) => setNoticeForm({ ...noticeForm, is_urgent: checked })}
                />
                <Label htmlFor="is_urgent">Mark as Urgent</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateNotice} 
                  disabled={!noticeForm.title || !noticeForm.content}
                  className="flex-1"
                >
                  Send Notice
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notices created yet</p>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice) => {
            const recipientInfo = getRecipientInfo(notice);
            const RecipientIcon = recipientInfo.icon;
            const readCount = getReadCount(notice);
            
            return (
              <Card key={notice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        {notice.is_urgent && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <RecipientIcon className="w-4 h-4" />
                          {recipientInfo.text}
                        </div>
                        <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                        {notice.recipient_type !== 'individual' && (
                          <span>{readCount} read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{notice.content}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};