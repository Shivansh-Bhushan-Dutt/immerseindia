import { useState, useEffect } from 'react';
import { AppData, Experience, Region } from '../App';
import { experiencesAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Sparkles, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

type ExperienceManagerProps = {
  data: AppData;
  onUpdateData: (data: AppData) => void;
};

export function ExperienceManager({ data, onUpdateData }: ExperienceManagerProps) {
  const [experiences, setExperiences] = useState(data.experiences || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    destination: '',
    region: 'North' as Region,
    title: '',
    description: '',
    highlights: '',
    imageUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const response = await experiencesAPI.getAll();
      const experiencesData = response.data || response; // Handle both formats
      setExperiences(experiencesData);
      // Also update the parent data
      onUpdateData({
        ...data,
        experiences: experiencesData
      });
    } catch (error) {
      toast.error('Failed to load experiences');
      console.error('Error fetching experiences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isNew = (createdAt: number) => {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    return createdAt > twoDaysAgo;
  };

  const resetForm = () => {
    setFormData({ destination: '', region: 'North', title: '', description: '', highlights: '', imageUrl: '' });
    setEditingExperience(null);
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (experience: Experience) => {
    setEditingExperience(experience);
    setFormData({
      destination: experience.destination,
      region: experience.region,
      title: experience.title,
      description: experience.description,
      highlights: experience.highlights.join('\n'),
      imageUrl: experience.imageUrl || ''
    });
    setImagePreview(experience.imageUrl || '');
    setIsDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    // Validate if it's a proper image URL
    const trimmedUrl = url.trim();
    
    if (trimmedUrl) {
      // Check if URL ends with image extension or contains image hosting domains
      const isValidImageUrl = 
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(trimmedUrl) ||
        /(unsplash\.com|pexels\.com|pixabay\.com|cloudinary\.com|imgur\.com)/.test(trimmedUrl);
      
      if (!isValidImageUrl && trimmedUrl.length > 0) {
        toast.warning('Please provide a direct image URL (e.g., ends with .jpg, .png) or use file upload');
      }
    }
    
    setFormData({ ...formData, imageUrl: trimmedUrl });
    setImagePreview(trimmedUrl);
    setSelectedImage(null);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleDeleteExperience = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      try {
        await experiencesAPI.delete(id);
        await fetchExperiences(); // Refresh the list
        toast.success('Experience deleted successfully');
      } catch (error) {
        console.error('Error deleting experience:', error);
        toast.error('Failed to delete experience');
      }
    }
  };

  const handleDelete = (id: string) => {
    // This function is not used anymore, replaced by handleDeleteExperience
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const highlights = formData.highlights.split('\n').filter(h => h.trim());
      
      let experienceData: any;

      // If there's a file selected, use FormData
      if (selectedImage) {
        const formDataToSend = new FormData();
        formDataToSend.append('image', selectedImage);
        formDataToSend.append('destination', formData.destination);
        formDataToSend.append('region', formData.region);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('highlights', JSON.stringify(highlights));
        
        experienceData = formDataToSend;
      } else {
        // Otherwise send JSON with imageUrl
        experienceData = {
          destination: formData.destination,
          region: formData.region,
          title: formData.title,
          description: formData.description,
          highlights,
          imageUrl: formData.imageUrl || ''
        };
      }

      if (editingExperience) {
        // Update existing
        await experiencesAPI.update(editingExperience.id, experienceData);
        toast.success('Experience updated successfully');
      } else {
        // Add new
        await experiencesAPI.create(experienceData);
        toast.success('Experience added successfully');
      }

      // Refresh the list
      await fetchExperiences();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error(`Failed to ${editingExperience ? 'update' : 'add'} experience`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 font-semibold text-xl">Experiences</h2>
          <p className="text-slate-600">Manage travel experiences and activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExperience ? 'Edit Experience' : 'Add New Experience'}</DialogTitle>
              <DialogDescription>
                {editingExperience ? 'Update the experience details' : 'Fill in the details for the new experience'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Experience Image</Label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Upload an image or enter image URL</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="imageFile" className="text-sm">Upload Image File</Label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl" className="text-sm">Image URL (Direct Link)</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg or .png"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be a direct image link ending with .jpg, .png, etc.
                    </p>
                  </div>
                </div>
              </div>

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
                <Label htmlFor="title">Experience Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Coastal Paradise & Beach Vibes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the experience in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlights">Highlights (one per line)</Label>
                <Textarea
                  id="highlights"
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Beach hopping at Baga & Anjuna&#10;Water sports & parasailing&#10;Visit historic churches"
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingExperience ? 'Update' : 'Add'} Experience
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading experiences...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience) => (
            <Card key={experience.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {/* Image Section */}
              {experience.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={experience.imageUrl} 
                    alt={experience.destination}
                    className="w-full h-full object-cover"
                  />
                  {/* NEW badge in top-right */}
                  {isNew(experience.createdAt) && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 hover:bg-green-600 text-xs">NEW</Badge>
                    </div>
                  )}
                  {/* Overlay badges on image - moved to bottom-left */}
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/70 text-white rounded-full text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      {experience.destination}
                    </div>
                    <Badge variant="secondary" className="bg-white/90 text-slate-700 text-xs">
                      {experience.region}
                    </Badge>
                  </div>
                </div>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{experience.title}</CardTitle>
                <CardDescription className="text-sm">{experience.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-700 mb-2 text-sm font-medium">Highlights:</p>
                    <ul className="space-y-1">
                      {experience.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-slate-600 flex items-start gap-2 text-sm">
                          <span className="text-orange-500 mt-1 text-xs">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(experience)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteExperience(experience.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {experiences.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">No experiences yet. Add your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
