import { MaltaLocality } from '../types';

export const MALTA_LOCALITIES: MaltaLocality[] = [
  {
    name: 'Sliema',
    region: 'Harbour',
    postalPrefix: 'SLM',
    deliveryTimeMins: 15,
    deliveryFee: 2.50,
    coordinates: { lat: 35.9122, lng: 14.5042 }
  },
  {
    name: "St. Julian's",
    region: 'Harbour',
    postalPrefix: 'STJ',
    deliveryTimeMins: 18,
    deliveryFee: 2.50,
    coordinates: { lat: 35.9189, lng: 14.4883 }
  },
  {
    name: 'Gzira',
    region: 'Harbour',
    postalPrefix: 'GZR',
    deliveryTimeMins: 15,
    deliveryFee: 2.50,
    coordinates: { lat: 35.9058, lng: 14.4953 }
  },
  {
    name: 'Msida',
    region: 'Harbour',
    postalPrefix: 'MSD',
    deliveryTimeMins: 18,
    deliveryFee: 2.50,
    coordinates: { lat: 35.8972, lng: 14.4894 }
  },
  {
    name: 'Valletta',
    region: 'Harbour',
    postalPrefix: 'VLT',
    deliveryTimeMins: 20,
    deliveryFee: 2.50,
    coordinates: { lat: 35.8989, lng: 14.5146 }
  },
  {
    name: 'Birkirkara',
    region: 'Central',
    postalPrefix: 'BKR',
    deliveryTimeMins: 20,
    deliveryFee: 2.50,
    coordinates: { lat: 35.8972, lng: 14.4611 }
  },
  {
    name: 'Mosta',
    region: 'Central',
    postalPrefix: 'MST',
    deliveryTimeMins: 25,
    deliveryFee: 2.50,
    coordinates: { lat: 35.9094, lng: 14.4256 }
  },
  {
    name: 'Qormi',
    region: 'Central',
    postalPrefix: 'QRM',
    deliveryTimeMins: 22,
    deliveryFee: 2.50,
    coordinates: { lat: 35.8767, lng: 14.4719 }
  },
  {
    name: 'Hamrun',
    region: 'Harbour',
    postalPrefix: 'HMR',
    deliveryTimeMins: 20,
    deliveryFee: 2.50,
    coordinates: { lat: 35.8856, lng: 14.4878 }
  },
  {
    name: 'San Gwann',
    region: 'Central',
    postalPrefix: 'SGN',
    deliveryTimeMins: 18,
    deliveryFee: 2.50,
    coordinates: { lat: 35.9075, lng: 14.4764 }
  },
  {
    name: "St. Paul's Bay / Bugibba",
    region: 'Northern',
    postalPrefix: 'SPB',
    deliveryTimeMins: 30,
    deliveryFee: 3.00,
    coordinates: { lat: 35.9497, lng: 14.4036 }
  },
  {
    name: 'Mellieha',
    region: 'Northern',
    postalPrefix: 'MLH',
    deliveryTimeMins: 35,
    deliveryFee: 3.50,
    coordinates: { lat: 35.9564, lng: 14.3622 }
  },
  {
    name: 'Marsaskala',
    region: 'Southern',
    postalPrefix: 'MSK',
    deliveryTimeMins: 30,
    deliveryFee: 3.00,
    coordinates: { lat: 35.8625, lng: 14.5672 }
  },
  {
    name: 'Victoria (Rabat), Gozo',
    region: 'Gozo',
    postalPrefix: 'VCT',
    deliveryTimeMins: 55,
    deliveryFee: 5.00,
    coordinates: { lat: 36.0444, lng: 14.2397 }
  }
];

// DESI BOLT Central Malta Fulfillment Warehouse & Store
export const DESI_BOLT_HUB = {
  name: 'DESI BOLT Central Store',
  address: 'Central store. Triq weid il ghajan  haz zabbar',
  vat: '30384926',
  phone: '79791146',
  whatsappUrl: 'https://wa.me/35679791146',
  coordinates: { lat: 35.8761, lng: 14.5350 }
};

