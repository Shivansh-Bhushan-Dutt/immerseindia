import { useState } from 'react';
import { Itinerary } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Download, MapPin, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

type ItineraryViewerProps = {
  itineraries: Itinerary[];
};

export function ItineraryViewer({ itineraries }: ItineraryViewerProps) {
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isNew = (createdAt: number) => {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    return createdAt > twoDaysAgo;
  };

  // Fallback image function for itineraries without images
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

  const getOverviewText = (itinerary: Itinerary) => {
    // Use custom description if available, otherwise generate one
    if (itinerary.description) {
      return itinerary.description;
    }
    
    const totalActivities = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);
    const firstFewActivities = itinerary.days.slice(0, 2).map(day => day.activities[0]).filter(Boolean);
    
    return `${itinerary.days.length}-day journey featuring ${totalActivities} curated activities. Experience ${firstFewActivities.join(', ')} and much more in this comprehensive ${itinerary.destination} adventure.`;
  };

  const handleCardClick = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setIsDialogOpen(true);
  };

  const handleDownload = (itinerary: Itinerary) => {
    const content = `${itinerary.title}\n${itinerary.destination}\n${itinerary.duration}\n\n${itinerary.days.map(day => 
      `Day ${day.day}:\n${day.activities.map(a => `- ${a}`).join('\n')}`
    ).join('\n\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itinerary.destination}-Itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Itinerary downloaded successfully');
  };

  const handleJsonDownload = (itinerary: Itinerary) => {
    const fileData = JSON.stringify(itinerary, null, 2);
    const blob = new Blob([fileData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `itinerary-${itinerary.destination}.json`;
    link.href = url;
    link.click();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-slate-900 font-semibold text-xl">Itineraries</h2>
        <p className="text-slate-600">View and download day-wise travel plans</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {itineraries.map((itinerary) => (
          <Card 
            key={itinerary.id} 
            className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
            onClick={() => handleCardClick(itinerary)}
          >
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
              <CardDescription className="text-sm line-clamp-4">
                {itinerary.description || getOverviewText(itinerary)}
              </CardDescription>
            </CardHeader>

            {/* Download Button in Card */}
            <div className="p-4 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(itinerary);
                }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog for Full Itinerary View */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedItinerary?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedItinerary?.destination} • {selectedItinerary?.duration}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItinerary && (
            <div className="space-y-6">
              {/* Header Image */}
              <div className="relative h-64 overflow-hidden rounded-lg">
                <img 
                  src={getItineraryImage(selectedItinerary)} 
                  alt={selectedItinerary.destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-purple-600">{selectedItinerary.region}</Badge>
                  <Badge variant="secondary">{selectedItinerary.duration}</Badge>
                </div>
              </div>

              {/* Overview */}
              <div className="bg-purple-50/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Trip Overview</h3>
                <p className="text-slate-700">{getOverviewText(selectedItinerary)}</p>
              </div>

              {/* Day-wise Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Day-wise Itinerary</h3>
                {selectedItinerary.days.map((day) => (
                  <div key={day.day} className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50/50 rounded-r-lg">
                    <h4 className="text-purple-700 font-semibold mb-3 text-lg">Day {day.day}</h4>
                    <ul className="space-y-2">
                      {day.activities.map((activity, idx) => (
                        <li key={idx} className="text-slate-700 flex items-start gap-3">
                          <span className="text-purple-500 mt-1 text-sm">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => selectedItinerary && handleDownload(selectedItinerary)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Complete Itinerary
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {itineraries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">No itineraries available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
