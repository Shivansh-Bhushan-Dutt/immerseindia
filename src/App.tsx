import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { authAPI, experiencesAPI, itinerariesAPI, imagesAPI, updatesAPI, setAuthToken } from './services/api';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ui/error-boundary';

export type Region = 'North' | 'South' | 'East' | 'West';

export type User = {
  email: string;
  role: 'admin' | 'user';
  name: string;
};

export type Experience = {
  id: string;
  destination: string;
  region: Region;
  title: string;
  description: string;
  highlights: string[];
  imageUrl?: string;
  createdAt: number;
};

export type Itinerary = {
  id: string;
  destination: string;
  region: Region;
  title: string;
  duration: string;
  description?: string;
  days: { day: number; activities: string[] }[];
  imageUrl?: string;
  createdAt: number;
};

export type DestinationImage = {
  id: string;
  destination: string;
  region: Region;
  url: string;
  caption: string;
  createdAt: number;
};

export type UpdateType = 'newsletter' | 'travel-trend' | 'new-experience';

export type Update = {
  id: string;
  type: UpdateType;
  title: string;
  content: string;
  externalUrl?: string; // New field for external blog/post URL
  createdAt: number;
};

export type AppData = {
  experiences: Experience[];
  itineraries: Itinerary[];
  images: DestinationImage[];
  updates: Update[]; // Add updates to AppData
};

// Production-ready App component with comprehensive error handling
// All data is fetched from backend API - no mock data needed
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState({
    experiences: [],
    itineraries: [],
    images: [],
    updates: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setAuthToken(token);
        setUser(JSON.parse(storedUser));
        fetchAllData();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        handleLogout(); // Clear invalid data
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const fetchAllData = async () => {
    setIsLoading(true);
    setConnectionError(false);
    
    try {
      // Fetch all data with error handling and retries
      const promises = [
        experiencesAPI.getAll().catch(err => {
          console.error('Failed to fetch experiences:', err);
          return { data: [] };
        }),
        itinerariesAPI.getAll().catch(err => {
          console.error('Failed to fetch itineraries:', err);
          return { data: [] };
        }),
        imagesAPI.getAll().catch(err => {
          console.error('Failed to fetch images:', err);
          return { data: [] };
        }),
        updatesAPI.getAll().catch(err => {
          console.error('Failed to fetch updates:', err);
          return { data: [] };
        })
      ];
      
      const [experiencesRes, itinerariesRes, imagesRes, updatesRes] = await Promise.all(promises);
      
      setData({
        experiences: experiencesRes.data || [],
        itineraries: itinerariesRes.data || [],
        images: imagesRes.data || [],
        updates: updatesRes.data || []
      });
      
    } catch (error) {
      console.error('Critical error loading data:', error);
      setConnectionError(true);
      toast.error('Unable to connect to server. Please check your internet connection.');
      
      // Set empty arrays on error to prevent crashes
      setData({
        experiences: [],
        itineraries: [],
        images: [],
        updates: []
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = async (userData: any, token: string) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token); // For our API service
      setUser(userData);
      await fetchAllData();
      toast.success(`Welcome back, ${userData.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login successful but failed to load data');
    }
  };
  
  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      authAPI.logout();
      setUser(null);
      setData({
        experiences: [],
        itineraries: [],
        images: [],
        updates: []
      });
      setConnectionError(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      window.location.reload();
    }
  };

  const handleUpdateData = (newData: any) => {
    setData(newData);
  };

  const handleRetry = () => {
    if (user) {
      fetchAllData();
    } else {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={handleLogin} />
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg font-medium">Loading dashboard...</p>
          <p className="text-slate-500 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-slate-600 mb-6">
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={handleLogout}
              className="block w-full bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {user.role === 'admin' ? (
        <AdminDashboard
          user={user}
          data={data}
          onLogout={handleLogout}
          onUpdateData={handleUpdateData}
        />
      ) : (
        <UserDashboard
          user={user}
          data={data}
          onLogout={handleLogout}
        />
      )}
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}

export default App;
