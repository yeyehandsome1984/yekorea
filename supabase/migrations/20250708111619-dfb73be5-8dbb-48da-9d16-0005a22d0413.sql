-- Create storage policies for the chapters bucket to allow uploads

-- Policy to allow authenticated users to upload files to the chapters bucket
CREATE POLICY "Allow authenticated users to upload to chapters bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chapters' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update files in the chapters bucket  
CREATE POLICY "Allow authenticated users to update files in chapters bucket"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chapters' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow public read access to the chapters bucket
CREATE POLICY "Allow public read access to chapters bucket"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chapters');