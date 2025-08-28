import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Share2,
  Navigation,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [watchId, setWatchId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Initialize map once location is available
  const initializeMap = useCallback((lat, lng) => {
    if (window.google && window.google.maps) {
      const mapElement = document.getElementById("map");
      if (mapElement) {
        const map = new window.google.maps.Map(mapElement, {
          center: { lat, lng },
          zoom: 15,
          mapTypeId: "roadmap",
        });

        // Add marker for current location
        new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: "Your Current Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        // Add accuracy circle
        new window.google.maps.Circle({
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          map: map,
          center: { lat, lng },
          radius: 100, // 100 meters accuracy circle
        });
      }
    }
  }, []);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDnPS1u714n8U8uUspH-L7ErcxPOi5qbOQ&libraries=geometry`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (location) {
          initializeMap(location.latitude, location.longitude);
        }
      };
    }
  }, [location, initializeMap]);

  // Update map when location changes
  useEffect(() => {
    if (location && window.google && window.google.maps) {
      initializeMap(location.latitude, location.longitude);
    }
  }, [location, initializeMap]);

  // Get current position
  const getCurrentLocation = useCallback(() => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        };

        setLocation(newLocation);
        setLastUpdated(new Date());
        setError("");

        // Generate shareable URL
        const url = `${window.location.origin}${window.location.pathname}?lat=${newLocation.latitude}&lng=${newLocation.longitude}`;
        setShareUrl(url);
      },
      (error) => {
        let errorMessage = "Unable to retrieve location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        setError(errorMessage);
      },
      options
    );
  }, []);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // 30 seconds
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        };

        setLocation(newLocation);
        setLastUpdated(new Date());
        setError("");

        // Update shareable URL
        const url = `${window.location.origin}${window.location.pathname}?lat=${newLocation.latitude}&lng=${newLocation.longitude}`;
        setShareUrl(url);
      },
      (error) => {
        let errorMessage = "Tracking failed. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        setError(errorMessage);
      },
      options
    );

    setWatchId(id);
    setIsTracking(true);
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Copy share link to clipboard
  const copyShareLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Show success feedback (you could add a toast notification here)
        alert("Location link copied to clipboard!");
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          alert("Location link copied to clipboard!");
        } catch (err) {
          alert("Failed to copy link. Please copy manually: " + shareUrl);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  // Check for shared location in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get("lat");
    const lng = urlParams.get("lng");

    if (lat && lng) {
      const sharedLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        accuracy: 0,
        timestamp: new Date(),
      };
      setLocation(sharedLocation);
      setShareUrl(window.location.href);
    }
  }, []);

  // Format coordinates for display
  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(6) : "N/A";
  };

  // Format timestamp
  const formatTime = (date) => {
    return date ? date.toLocaleTimeString() : "N/A";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">
              Location Tracker
            </h1>
          </div>
          <p className="text-gray-600">
            Track your live location and share it with others
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={getCurrentLocation}
              disabled={isTracking}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Current Location
            </button>

            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isTracking
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isTracking ? "animate-spin" : ""}`}
              />
              {isTracking ? "Stop Tracking" : "Start Live Tracking"}
            </button>

            {location && (
              <button
                onClick={copyShareLink}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Location
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Location Info */}
        {location && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Current Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Latitude
                </label>
                <p className="text-lg font-mono bg-gray-50 p-2 rounded">
                  {formatCoordinate(location.latitude)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Longitude
                </label>
                <p className="text-lg font-mono bg-gray-50 p-2 rounded">
                  {formatCoordinate(location.longitude)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Accuracy
                </label>
                <p className="text-lg bg-gray-50 p-2 rounded">
                  {location.accuracy
                    ? `±${Math.round(location.accuracy)}m`
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Last Updated
                </label>
                <p className="text-lg bg-gray-50 p-2 rounded">
                  {formatTime(lastUpdated)}
                </p>
              </div>
            </div>

            {/* Tracking Status */}
            <div className="mt-4 flex items-center">
              <div
                className={`h-3 w-3 rounded-full mr-2 ${
                  isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isTracking ? "Live tracking active" : "Tracking inactive"}
              </span>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Map View</h2>
          </div>
          <div
            id="map"
            className="w-full h-96 bg-gray-100 flex items-center justify-center"
          >
            {!location ? (
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Get Current Location" to view map</p>
              </div>
            ) : !window.google ? (
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p>Loading map...</p>
                <p className="text-sm mt-2">
                  Note: Replace YOUR_GOOGLE_MAPS_API_KEY with actual API key
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Share URL Display */}
        {shareUrl && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">
              Shareable Link
            </h3>
            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={copyShareLink}
                className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this link with others to show them your location
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            Built with ❤️ by{" "}
            <a
              href="https://Ritikkumar8z.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 font-medium transition-colors duration-300"
            >
              RiTiK Kumar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationTracker;
