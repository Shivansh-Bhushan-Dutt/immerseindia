import { Experience } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin } from 'lucide-react';

type ExperienceViewerProps = {
  experiences: Experience[];
};

export function ExperienceViewer({ experiences }: ExperienceViewerProps) {
  const isNew = (createdAt: number) => {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    return createdAt > twoDaysAgo;
  };

  // Fallback image function for experiences without images
  const getExperienceImage = (experience: Experience) => {
    if (experience.imageUrl) {
      return experience.imageUrl;
    }
    
    // Fallback images based on destination
    const imageMap: { [key: string]: string } = {
      'Ladakh': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=250&fit=crop',
      'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=250&fit=crop',
      'Kerala': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=250&fit=crop',
      'Rajasthan': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=250&fit=crop',
      'Kashmir': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    };
    
    return imageMap[experience.destination] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=250&fit=crop';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-slate-900 font-semibold text-xl">Experiences</h2>
        <p className="text-slate-600">Browse travel experiences and activities</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {experiences.map((experience) => (
          <Card key={experience.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={getExperienceImage(experience)} 
                alt={experience.destination}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=250&fit=crop';
                }}
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
                  <MapPin className="w-3 h-3" />
                  {experience.destination}
                </div>
                <Badge variant="secondary" className="bg-white/90 text-slate-700 text-xs">
                  {experience.region}
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{experience.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-3">{experience.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div>
                <p className="text-slate-700 mb-2 text-sm font-medium">Highlights:</p>
                <ul className="space-y-1">
                  {experience.highlights.map((highlight, idx) => (
                    <li key={idx} className="text-slate-600 flex items-start gap-2 text-sm">
                      <span className="text-orange-500 mt-1 text-xs">•</span>
                      <span className="line-clamp-1">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {experiences.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">No experiences available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
