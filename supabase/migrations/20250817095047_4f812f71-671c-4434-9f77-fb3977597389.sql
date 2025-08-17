-- Create lease renewal requests table
CREATE TABLE public.lease_renewal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  requested_end_date DATE NOT NULL,
  requested_rent NUMERIC,
  request_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.lease_renewal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for lease renewal requests
CREATE POLICY "Tenants can create renewal requests" 
ON public.lease_renewal_requests 
FOR INSERT 
WITH CHECK (tenant_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their renewal requests" 
ON public.lease_renewal_requests 
FOR SELECT 
USING (
  tenant_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
  landlord_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'superadmin')
);

CREATE POLICY "Landlords can update renewal requests" 
ON public.lease_renewal_requests 
FOR UPDATE 
USING (
  landlord_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'superadmin')
);

-- Create trigger for timestamps
CREATE TRIGGER update_lease_renewal_requests_updated_at
BEFORE UPDATE ON public.lease_renewal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();