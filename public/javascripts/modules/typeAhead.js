/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

const axios = require('axios');
const dompurity = require('dompurify');

function searchResultsHTML(stores) {
    return stores.map(store => {
       return dompurity.sanitize(`
        <a href="/store/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
        </a>
       `);
    }).join('');
}

function typeAhead(search) {
    console.log(search);
    if (!search) return; //Never run search with null parameters

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function() {
        if (!this.value) {
            //In case there is no value
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML = '';
        axios
            .get(`/apiv1/search?q=${this.value}`)
            .then(res => {
                if (res.data.length) {
                    searchResults.innerHTML = dompurity.sanitize(searchResultsHTML(res.data));
                    return;
                }
                searchResults.innerHTML = dompurity.sanitize(`<div class="search__result">No Results found for ${this.value}</div>`);
            }).catch(err => {
                console.log(err);
        });
    });


    searchInput.on('keyup', (e) => {
        //We are only handling Up(38), Down(40) & enter(13)
        if (![38, 40, 13].includes(e.keyCode)) {
            return;
        }

        const active = 'search__result--active';
        const current = search.querySelector(`.${active}`);
        const items = search.querySelectorAll('.search__result');
        let next;

        if (e.keyCode === 40 && current) {
            next = current.nextElementSibling || items[0];
        } else if(e.keyCode === 40) {
            next = items[0];
        } else if(e.keyCode === 38 && current) {
            next = current.previousElementSibling || items[items.length -1];
        } else if (e.keyCode === 38) {
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            window.location = current.href;
            return;
        }

        if (current) {
            current.classList.remove(active);
        }
        next.classList.add(active);
    });
}

export default typeAhead;