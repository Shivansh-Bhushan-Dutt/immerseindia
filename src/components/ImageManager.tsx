import { useState, useEffect } from 'react';
import { AppData, DestinationImage, Region } from '../App';
import { imagesAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, MapPin, Filter } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

type ImageManagerProps = {
  data: AppData;
  onUpdateData: (data: AppData) => void;
};

interface ImageUploadData {
  destination: string;
  region: Region;
  caption: string;
  url: string;
  file?: File;
}

export function ImageManager({ data, onUpdateData }: ImageManagerProps) {
  const [images, setImages] = useState(data.images || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<DestinationImage | null>(null);
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'landscape' | 'portrait'>('all');
  const [imageOrientations, setImageOrientations] = useState<Record<string, 'landscape' | 'portrait'>>({});
  const [formData, setFormData] = useState({
    destination: '',
    region: 'North' as Region,
    url: '',
    caption: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchImages();
  }, []);

  const isNew = (createdAt: number) => {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    return createdAt > twoDaysAgo;
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>, imageId: string) => {
    const img = e.target as HTMLImageElement;
    const orientation = img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait';
    setImageOrientations(prev => ({ ...prev, [imageId]: orientation }));
  };

  const getFilteredImages = () => {
    if (orientationFilter === 'all') return images;
    return images.filter(image => {
      const orientation = imageOrientations[image.id];
      return orientation === orientationFilter;
    });
  };

  const resetForm = () => {
    setFormData({ destination: '', region: 'North', url: '', caption: '' });
    setEditingImage(null);
    setUploadedFile(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (image: DestinationImage) => {
    setEditingImage(image);
    setFormData({
      destination: image.destination,
      region: image.region,
      url: image.url,
      caption: image.caption
    });
    setUploadedFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setIsLoading(true);
      try {
        await imagesAPI.delete(id);
        const newImages = images.filter(img => img.id !== id);
        setImages(newImages);
        onUpdateData({ ...data, images: newImages });
        toast.success('Image deleted successfully');
      } catch (error) {
        toast.error('Failed to delete image');
        console.error('Error deleting image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadedFile(file);
        // Create a local URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData({ ...formData, url: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await imagesAPI.getAll();
      const imageData = response.data || response || [];
      setImages(imageData);
      onUpdateData({
        ...data,
        images: imageData
      });
    } catch (error) {
      toast.error('Failed to load images');
      console.error('Error fetching images:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (imageData: ImageUploadData) => {
    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload to Cloudinary
      const formData = new FormData();
      formData.append('destination', imageData.destination);
      formData.append('region', imageData.region);
      formData.append('caption', imageData.caption);
      
      // If user uploaded a file, send it to Cloudinary via backend
      if (imageData.file) {
        formData.append('image', imageData.file);
        console.log('Uploading file to Cloudinary:', imageData.file.name);
      } else if (imageData.url) {
        // If user provided a URL, just send the URL
        formData.append('url', imageData.url);
        console.log('Adding image from URL:', imageData.url);
      } else {
        throw new Error('Please provide an image file or URL');
      }

      // Upload to backend (which will upload to Cloudinary if file is provided)
      const response = await fetch(`${process.env.REACT_APP_API_URL}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const result = await response.json();
      console.log('Upload response:', result);
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }

      const createdImage = result.data;

      // Validate that we got a proper URL
      if (!createdImage.url) {
        throw new Error('No image URL received from server');
      }

      console.log('Image created with URL:', createdImage.url);
      
      if (imageData.file) {
        toast.success('Image uploaded to Cloudinary successfully!');
      } else {
        toast.success('Image added successfully!');
      }

      // Refresh images from backend to ensure sync
      await fetchImages();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that we have either a file or URL
    if (!uploadedFile && !formData.url) {
      toast.error('Please provide an image URL or upload an image');
      return;
    }

    if (editingImage) {
      // Handle update
      try {
        setIsLoading(true);
        const formDataToSend = new FormData();
        formDataToSend.append('destination', formData.destination);
        formDataToSend.append('region', formData.region);
        formDataToSend.append('caption', formData.caption);
        
        if (uploadedFile) {
          formDataToSend.append('image', uploadedFile);
          console.log('Updating with new file:', uploadedFile.name);
        } else if (formData.url) {
          formDataToSend.append('url', formData.url);
          console.log('Updating with URL:', formData.url);
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/images/${editingImage.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formDataToSend
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
          throw new Error(errorData.error || 'Failed to update');
        }
        
        const result = await response.json();
        console.log('Update response:', result);
        
        if (!result.success || !result.data) {
          throw new Error('Invalid response from server');
        }

        toast.success('Image updated successfully');
        
        // Refresh images from backend
        await fetchImages();
        
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update image');
        console.error('Update error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle create - use handleUploadImage
      await handleUploadImage({
        destination: formData.destination,
        region: formData.region,
        caption: formData.caption,
        url: formData.url,
        file: uploadedFile || undefined
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div>
      {isLoading && images.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading images...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 font-semibold text-xl">Destination Images</h2>
          <p className="text-slate-600">Manage photos and media for destinations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <Select value={orientationFilter} onValueChange={(value) => setOrientationFilter(value as 'all' | 'landscape' | 'portrait')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Images" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Images</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingImage ? 'Edit Image' : 'Add New Image'}</DialogTitle>
              <DialogDescription>
                {editingImage ? 'Update the image details' : 'Upload an image from your computer or provide a URL'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Goa, Ladakh, Kerala"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value as Region })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North">North India</SelectItem>
                      <SelectItem value="South">South India</SelectItem>
                      <SelectItem value="East">East India</SelectItem>
                      <SelectItem value="West">West India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload Image from Computer</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {uploadedFile && (
                  <p className="text-sm text-green-600">✓ {uploadedFile.name} selected</p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Image URL (Direct Link)</Label>
                <Input
                  id="url"
                  type="url"
                  value={uploadedFile ? '' : formData.url}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    if (url) {
                      const isValidImageUrl = 
                        /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url) ||
                        /(unsplash\.com|pexels\.com|pixabay\.com|cloudinary\.com|imgur\.com)/.test(url);
                      
                      if (!isValidImageUrl && url.length > 0) {
                        toast.warning('Please provide a direct image URL (e.g., ends with .jpg, .png) or use file upload');
                      }
                    }
                    setFormData({ ...formData, url });
                  }}
                  placeholder="https://example.com/image.jpg or .png"
                  disabled={!!uploadedFile}
                />
                <p className="text-sm text-slate-500">Must be a direct image link ending with .jpg, .png, etc.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Brief description of the image"
                  required
                />
              </div>

              {formData.url && (
                <div className="border rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={formData.url}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  {editingImage ? 'Update' : 'Add'} Image
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {getFilteredImages().map((image) => (
          <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative group h-64">
              <ImageWithFallback
                src={image.url}
                alt={image.caption}
                className="w-full h-full object-cover"
                onLoad={(e) => handleImageLoad(e, image.id)}
              />
              <div className="absolute top-2 left-2 flex gap-2">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/70 text-white rounded-full text-sm backdrop-blur-sm">
                  <MapPin className="w-3 h-3" />
                  {image.destination}
                </div>
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">{image.region}</Badge>
                {isNew(image.createdAt) && (
                  <Badge className="bg-green-500 hover:bg-green-600">NEW</Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-slate-700 mb-4">{image.caption}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(image)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">No images yet. Add your first one!</p>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}
