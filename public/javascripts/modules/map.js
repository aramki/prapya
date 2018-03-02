/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */
const axios = require('axios');
import { $ } from './bling';
const dompurity = require('dompurify');

const mapOptions = {
    center: {lat: 12.96, lng: 77.72 },
    zoom: 6
};
//TODO take geolocation permission and put the users location as center
function loadAround(map, lat = 12.96, lng = 77.72) {
    axios.get(`/apiv1/stores/around?lat=${lat}&lng=${lng}`)
        .then(res => {
           const places = res.data;
           if (!places.length) {
               alert('No Places found');
               return;
           }

           //Create a bounds to put the markers at proper zoom level
           const bounds = new google.maps.LatLngBounds();
           const infoWindow = new google.maps.InfoWindow();

           const markers = places.map(place => {
              const [placeLng, placeLat] = place.location.coordinates;
              //console.log(placeLat, placeLng);
              const position = {lat: placeLat, lng: placeLng};
              bounds.extend(position);
              const marker = new google.maps.Marker({
                  map: map,
                  position: position});
              marker.place = place;
              return marker;
           });
           console.log(markers);

           //On marker click, show information
           markers.forEach(marker => {
               return marker.addListener('click', function () {
                   const html = `
                   <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>
                            <p>${this.place.name} - ${this.place.location.address}</p>
                        </a>
                   </div>
                   `;
                   infoWindow.setContent(html);
                   infoWindow.open(map, this);
               });
           });

           //Zoom the map to fit the markers
           map.setCenter(bounds.getCenter());
           map.fitBounds(bounds);
        })
        .catch(console.error);
}

function makeMap (mapDiv) {
    if (!mapDiv) return;
    //Making the map
    const map = new google.maps.Map(mapDiv, mapOptions);
    loadAround(map);
    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
       const place = autocomplete.getPlace();
       loadAround(map, place.geometry.location.lat(), place.geometry.location.lng());
    });

}

export default makeMap;
