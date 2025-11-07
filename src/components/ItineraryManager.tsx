import { useState, useEffect } from 'react';
import { AppData, Itinerary, Region } from '../App';
import { itinerariesAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

type ItineraryManagerProps = {
  data: AppData;
  onUpdateData: (data: AppData) => void;
};

export function ItineraryManager({ data, onUpdateData }: ItineraryManagerProps) {
  const [itineraries, setItineraries] = useState(data.itineraries || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<Itinerary | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    destination: '',
    region: 'North' as Region,
    title: '',
    duration: '',
    daysData: '',
    imageUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchItineraries();
  }, []);
  
  const fetchItineraries = async () => {
    setIsLoading(true);
    try {
      const response = await itinerariesAPI.getAll();
      const itinerariesData = response.data || response;
      setItineraries(itinerariesData);
      onUpdateData({
        ...data,
        itineraries: itinerariesData
      });
    } catch (error) {
      toast.error('Failed to load itineraries');
      console.error('Error fetching itineraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isNew = (createdAt: number) => {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    return createdAt > twoDaysAgo;
  };

  const resetForm = () => {
    setFormData({ destination: '', region: 'North', title: '', duration: '', daysData: '', imageUrl: '' });
    setEditingItinerary(null);
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (itinerary: Itinerary) => {
    setEditingItinerary(itinerary);
    const daysData = itinerary.days.map(day =>
      `Day ${day.day}:\n${day.activities.join('\n')}`
    ).join('\n\n');
    
    setFormData({
      destination: itinerary.destination,
      region: itinerary.region,
      title: itinerary.title,
      duration: itinerary.duration,
      daysData,
      imageUrl: itinerary.imageUrl || ''
    });
    setImagePreview(itinerary.imageUrl || '');
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      try {
        await itinerariesAPI.delete(id);
        await fetchItineraries(); // Refresh the list
        toast.success('Itinerary deleted successfully');
      } catch (error) {
        toast.error('Failed to delete itinerary');
        console.error('Error deleting itinerary:', error);
      }
    }
  };

  const getItineraryImage = (itinerary: Itinerary) => {
    if (itinerary.imageUrl) {
      return itinerary.imageUrl;
    }
    
    // Fallback images based on destination
    const imageMap: { [key: string]: string } = {
      'Ladakh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
      'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=250&fit=crop',
      'Kerala': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=250&fit=crop',
      'Rajasthan': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=250&fit=crop',
      'Kashmir': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    };
    
    return imageMap[itinerary.destination] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=250&fit=crop';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Parse days data
      const dayBlocks = formData.daysData.split(/Day \d+:/i).filter(b => b.trim());
      const days = dayBlocks.map((block, idx) => ({
        day: idx + 1,
        activities: block.trim().split('\n').filter(a => a.trim())
      }));

      let itineraryData: any;

      // If there's a selected image file, use FormData
      if (selectedImage) {
        const formDataToSend = new FormData();
        formDataToSend.append('image', selectedImage);
        formDataToSend.append('destination', formData.destination);
        formDataToSend.append('region', formData.region);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('duration', formData.duration);
        formDataToSend.append('days', JSON.stringify(days));
        
        itineraryData = formDataToSend;
      } else {
        // Otherwise send JSON with imageUrl
        itineraryData = {
          destination: formData.destination,
          region: formData.region,
          title: formData.title,
          duration: formData.duration,
          days,
          imageUrl: formData.imageUrl || ''
        };
      }

      if (editingItinerary) {
        // Update existing
        await itinerariesAPI.update(editingItinerary.id, itineraryData);
        toast.success('Itinerary updated successfully');
      } else {
        // Add new
        await itinerariesAPI.create(itineraryData);
        toast.success('Itinerary added successfully');
      }

      // Refresh the list
      await fetchItineraries();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error(`Failed to ${editingItinerary ? 'update' : 'add'} itinerary`);
    } finally {
      setIsLoading(false);
    }
  };

  const getOverviewText = (itinerary: Itinerary) => {
    const totalActivities = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);
    const firstFewActivities = itinerary.days.slice(0, 2).map(day => day.activities[0]).filter(Boolean);
    
    return `${itinerary.days.length}-day journey featuring ${totalActivities} curated activities. Experience ${firstFewActivities.join(', ')} and much more in this comprehensive ${itinerary.destination} adventure.`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 font-semibold text-xl">Itineraries</h2>
          <p className="text-slate-600">Manage day-wise travel plans</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Itinerary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItinerary ? 'Edit Itinerary' : 'Add New Itinerary'}</DialogTitle>
              <DialogDescription>
                {editingItinerary ? 'Update the itinerary details' : 'Fill in the details for the new itinerary'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Itinerary Image *</Label>
                
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
                <Label htmlFor="title">Itinerary Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Coastal Paradise & Beach Vibes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 7 Days / 6 Nights"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysData">Day-wise Plan</Label>
                <Textarea
                  id="daysData"
                  value={formData.daysData}
                  onChange={(e) => setFormData({ ...formData, daysData: e.target.value })}
                  placeholder="Day 1:&#10;Arrival at airport&#10;Check-in to hotel&#10;Welcome dinner&#10;&#10;Day 2:&#10;Beach activities&#10;Lunch by the sea"
                  rows={12}
                  required
                />
                <p className="text-sm text-slate-500">Format: "Day X:" followed by activities, one per line</p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingItinerary ? 'Update' : 'Add'} Itinerary
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading itineraries...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((itinerary) => (
            <Card key={itinerary.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={getItineraryImage(itinerary)} 
                  alt={itinerary.destination}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=250&fit=crop';
                  }}
                />
                {/* NEW badge in top-right */}
                {isNew(itinerary.createdAt) && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 hover:bg-green-600 text-xs">NEW</Badge>
                  </div>
                )}
                {/* Tags in bottom-left - only destination, no region */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/70 text-white rounded-full text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    {itinerary.destination}
                  </div>
                </div>
                {/* Duration badge in bottom-right */}
                <div className="absolute bottom-3 right-3">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/90 text-white rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    {itinerary.duration}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">{itinerary.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-3">
                  {getOverviewText(itinerary)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(itinerary)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(itinerary.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {itineraries.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">No itineraries yet. Add your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
