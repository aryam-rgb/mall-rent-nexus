-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true);

-- Create storage bucket for maintenance images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-images', 'maintenance-images', true);

-- Create storage policies for property images
CREATE POLICY "Anyone can view property images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update property images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete property images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Create storage policies for maintenance images
CREATE POLICY "Users can view their maintenance images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'maintenance-images');

CREATE POLICY "Authenticated users can upload maintenance images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'maintenance-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update maintenance images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'maintenance-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete maintenance images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'maintenance-images' AND auth.role() = 'authenticated');