import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import '../sass/style.scss';

import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

autocomplete ($('#address'), $('#latitude'), $('#longitude'));

typeAhead( $('.search'));

makeMap($('#map'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);