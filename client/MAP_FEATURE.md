# Interactive Map Feature - Map-First Workflow

## Overview
The Property Management Dashboard features a **map-first workflow** with reverse geocoding. Users select the location on an interactive map, and the address is automatically filled in the form.

## Features

### 1. **Map-First Approach** 🗺️
- Click "Pick from Map" button to open the interactive map
- **No need to type the address manually**
- Select location by clicking anywhere on the map or dragging the marker
- Address and city fields are **automatically populated** via reverse geocoding

### 2. **Reverse Geocoding** 📍
- Automatically converts coordinates to human-readable addresses
- Uses OpenStreetMap Nominatim API (free, no API key required)
- Extracts street name and city from the selected location
- Updates form fields in real-time

### 3. **Interactive Map Controls**
- **Click on Map**: Click anywhere to place the marker and fetch address
- **Drag Marker**: Fine-tune location by dragging the red marker
- **Zoom Controls**: Use + / - buttons or mouse wheel to zoom
- **Pan**: Click and drag the map to explore different areas
- **Crosshair Cursor**: Visual indicator that the map is clickable

### 4. **Visual Feedback**
- Blue instruction banner explaining how to use the map
- Real-time coordinate display (latitude, longitude)
- Green success indicator showing selected address
- "View in Google Maps" link for verification
- Popup on marker showing property details

## How to Use (Map-First Workflow)

### **Adding a Property**:
1. Fill in property title and type (optional)
2. **Click "Pick from Map"** button (primary action)
3. Map opens centered on Kathmandu (or last selected location)
4. **Click anywhere on the map** to select location
   - OR drag the marker to adjust position
5. Address and city fields **auto-fill automatically**
6. Fine-tune location if needed
7. Close map and continue with other property details

### **Editing a Property**:
1. Existing location loads on the map automatically
2. Click "Pick from Map" to adjust location
3. Click new location or drag marker
4. Address updates automatically
5. Save changes

## Technical Details

### Libraries
- **Leaflet** 1.9.x - Core mapping library
- **React-Leaflet** 4.2.1 - React components for Leaflet

### APIs
- **Geocoding**: Nominatim forward geocoding (optional fallback)
- **Reverse Geocoding**: Nominatim reverse geocoding (primary method)
- **Tile Provider**: OpenStreetMap tiles

### Data Flow
1. User clicks on map → Gets coordinates (lat, lng)
2. Coordinates sent to Nominatim reverse geocoding API
3. API returns address components (street, city, country, etc.)
4. Address fields auto-populate in the form
5. Coordinates saved with property to database

### Storage
- **latitude**: Decimal degrees (e.g., 27.717245)
- **longitude**: Decimal degrees (e.g., 85.323959)
- Stored in property database record

## UI/UX Features

### Visual Design
- **Map Height**: 450px (increased for better visibility)
- **Border Radius**: 8px rounded corners
- **Instructions Banner**: Blue gradient with icon
- **Success Indicator**: Green banner when address is selected
- **Button Style**: Primary gradient with hover effects

### User Guidance
- Placeholder text: "Click 'Pick from Map' to auto-fill address"
- Field hint below input explaining the workflow
- Map instructions at the top of the map
- Crosshair cursor indicating clickable area

### Accessibility
- Clear visual indicators
- Descriptive button text
- Helpful tooltips and hints
- Keyboard navigation support (map controls)

## Browser Compatibility

✅ Chrome/Edge (latest)  
✅ Firefox (latest)  
✅ Safari (latest)  
✅ Mobile browsers (touch support)

## Advantages of Map-First Workflow

1. **No Typing Errors**: Address comes directly from map data
2. **Faster**: One click vs. typing full address
3. **More Accurate**: Precise coordinates with visual confirmation
4. **User-Friendly**: Intuitive visual selection
5. **Consistent Format**: Addresses follow standardized format from API
6. **Accessible**: Works for users unfamiliar with exact street names
