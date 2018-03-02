/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

function autocomplete (input, latitude, longitude) {
    if (!input) return; //Don't run unless there is a change

    const dropdown = new google.maps.places.Autocomplete(input);

    dropdown.addListener("place_changed", () => {
       const place = dropdown.getPlace();
       latitude.value = place.geometry.location.lat();
       longitude.value = place.geometry.location.lng();
    });

    input.on('keydown', (e) => {
        if (e.keyCode === 13)
            e.preventDefault();
    });

}

export default autocomplete;