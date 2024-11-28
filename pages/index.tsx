import { useLoadScript, GoogleMap, MarkerF, CircleF } from '@react-google-maps/api';
import { NextPage } from 'next';
import { useMemo, useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import styles from '../styles/Home.module.css';
import PlacesAutocomplete from '../components/PlacesAutocomplete';

const Home: NextPage = () => {
  const [lat, setLat] = useState(27.672932021393862); // Default coordinates
  const [lng, setLng] = useState(85.31184012689732); // Default coordinates
  const [zoom, setZoom] = useState(14); // Default zoom level
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null); // Store directions
  const [userLocation, setUserLocation] = useState<google.maps.LatLng | null>(null); // Store user location
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const libraries = useMemo(() => ['places'], []);
  const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng]);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: false,
      clickableIcons: true,
      scrollwheel: true,
      zoomControl: true,
    }),
    []
  );

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  // Initialize Directions Service and Renderer once map is loaded
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer();
    directionsRendererRef.current.setMap(map);
    getCurrentLocation(map); // Fetch user's current location and set marker
  };

  // Fetch the user's current location
  const getCurrentLocation = (map: google.maps.Map) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLoc = new google.maps.LatLng(latitude, longitude);
          setUserLocation(userLoc); // Set user location
          setLat(latitude);
          setLng(longitude);
          setZoom(14); // Zoom to user location
        },
        (error) => {
          console.error('Error fetching location:', error);
        }
      );
    }
  };

  // Handle address selection from PlacesAutocomplete
  const handleAddressSelect = (address: string) => {
    getGeocode({ address }).then((results) => {
      const { lat, lng } = getLatLng(results[0]);
      setLat(lat);
      setLng(lng);
      setZoom(14); // Reset zoom level after selecting an address
    });
  };

  // Handle the directions request
  const handleDirections = (origin: google.maps.LatLng | google.maps.LatLngLiteral, destination: google.maps.LatLng | google.maps.LatLngLiteral) => {
    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current?.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        setDirections(result); // Set the directions result to state
        directionsRendererRef.current?.setDirections(result); // Display directions on the map
      } else {
        console.error('Directions request failed due to', status);
      }
    });
  };

  // Trigger directions calculation
  const onDirectionButtonClick = () => {
    if (userLocation && mapCenter) {
      handleDirections(userLocation, mapCenter); // Trigger directions from user location to destination
    } else {
      console.log('User location or map center is undefined');
    }
  };

  return (
    <div className={styles.homeWrapper}>
      <div className={styles.sidebar}>
        {/* Button to trigger directions */}
        <button onClick={onDirectionButtonClick}>Get Directions</button>

        {/* Pass the address selection handler */}
        <PlacesAutocomplete onAddressSelect={handleAddressSelect} />
      </div>

      <GoogleMap
        options={mapOptions}
        zoom={zoom}
        center={mapCenter}
        mapTypeId={google.maps.MapTypeId.ROADMAP}
        mapContainerStyle={{ width: '80%', height: '100vh' }}
        onLoad={onMapLoad} // Initialize map and load user location
      >
        {/* User's current location marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/man.png', // Custom icon for "human-like" figure
              scaledSize: new google.maps.Size(32, 32), // Size of the marker
            }}
            onClick={() => onDirectionButtonClick()} // Use the same function as the button
            onLoad={() => console.log('User Location Marker Loaded')}
          />
        )}

        <MarkerF position={mapCenter} onLoad={() => console.log('Destination Marker Loaded')} />

        {[1000, 2500].map((radius, idx) => {
          return (
            <CircleF
              key={idx}
              center={mapCenter}
              radius={radius}
              onLoad={() => console.log('Circle Load...')}
              options={{
                fillColor: radius > 1000 ? 'red' : 'green',
                strokeColor: radius > 1000 ? 'red' : 'green',
                strokeOpacity: 0.8,
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
};

export default Home;
