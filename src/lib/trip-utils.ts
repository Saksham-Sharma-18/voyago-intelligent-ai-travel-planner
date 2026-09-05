import { ItineraryDay, Destination, CustomerRequirements } from './types';
import { calculateCosts } from './destinations-data';

export function generateItinerary(destination: Destination, requirements: CustomerRequirements): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  const attractions = [...destination.attractions];
  const activities = [...destination.activities];
  // Real, world-renowned hotels per destination (budget 3★ / mid-range 4★ / luxury 5★ / ultra-luxury 7★)
  const DESTINATION_HOTELS: Record<string, Record<number, string[]>> = {
    'Dubai': {
      3: ['ibis Styles Dubai Jumeira', 'Rove Downtown Dubai', 'Premier Inn Dubai Al Jaddaf'],
      4: ['Marriott Hotel Al Jaddaf', 'Sheraton Dubai Creek Hotel', 'Hyatt Regency Dubai Creek Heights'],
      5: ['Waldorf Astoria Dubai International Financial Centre', 'Mandarin Oriental Jumeira', 'Four Seasons Resort Dubai at Jumeirah Beach'],
      7: ['Burj Al Arab Jumeirah', 'Atlantis The Royal', 'Bulgari Resort and Residences Dubai'],
    },
    'Paris': {
      3: ['ibis Paris Gare de Lyon', 'Hotel Cluny Square', 'Hotel de Nesle'],
      4: ['Hôtel du Louvre', 'Hôtel Lutetia', 'Mercure Paris Opera Grands Boulevards'],
      5: ['Hôtel Plaza Athénée', 'Four Seasons Hotel George V', 'Le Bristol Paris'],
      7: ['Ritz Paris', 'Hôtel de Crillon, A Rosewood Hotel', 'Cheval Blanc Paris'],
    },
    'Bali': {
      3: ['Alaya Resort Ubud', 'The Layar Seminyak', 'Puri Bambu Hotel Jimbaran'],
      4: ['The Nusa Dua Beach Hotel', 'Padma Resort Ubud', 'AYANA Segara Bali'],
      5: ['The St. Regis Bali Resort', 'Alila Villas Uluwatu', 'Bvlgari Resort Bali'],
      7: ['Four Seasons Resort Bali at Sayan', 'Mandapa, a Ritz-Carlton Reserve', 'Capella Ubud'],
    },
    'Tokyo': {
      3: ['Dormy Inn Tokyo Otemachi', 'The Royal Park Hotel Tokyo Shiodome', 'Vessel Hotel Campana Shinjuku'],
      4: ['Shinjuku Washington Hotel', 'Keio Plaza Hotel Tokyo', 'Hotel Gajoen Tokyo'],
      5: ['Mandarin Oriental Tokyo', 'The Ritz-Carlton Tokyo', 'Conrad Tokyo'],
      7: ['Aman Tokyo', 'The Peninsula Tokyo', 'Park Hyatt Tokyo'],
    },
    'Malé': {
      3: ['Hulhulé Island Hotel', 'Sala Boutique Hotel Malé', 'Aspen Hotel Malé'],
      4: ['Kurumba Maldives', 'Bandos Maldives', 'Cinnamon Dhonveli Maldives'],
      5: ['One&Only Reethi Rah', 'Gili Lankanfushi', 'The Nautilus Maldives'],
      7: ['Soneva Fushi', 'Six Senses Laamu', 'Cheval Blanc Randheli'],
    },
    'New York City': {
      3: ['Pod 51 Hotel', 'The Jane Hotel', 'Pod Times Square'],
      4: ['The Bernic Hotel', 'Arlo Midtown', 'Kimpton Hotel Theta'],
      5: ['The St. Regis New York', 'The Plaza Hotel', 'The Carlyle, A Rosewood Hotel'],
      7: ['Aman New York', 'Four Seasons Hotel New York Downtown', 'The Ritz-Carlton New York, Central Park'],
    },
    'Sydney': {
      3: ['ibis Sydney Airport', 'Veriu Waterloo', 'Travelodge Hotel Sydney'],
      4: ['Novotel Sydney City Centre', 'Rydges Sydney Central', 'Country Road Hotel Sydney'],
      5: ['Four Seasons Hotel Sydney', 'InterContinental Sydney', 'Park Hyatt Sydney'],
      7: ['Capella Sydney', 'Amora Hotel Jamison Sydney', 'The Langham Sydney'],
    },
    'Vienna': {
      3: ['Wombat\'s City Hostel Vienna', 'Hotel Josefshof am Rathaus', 'Arthotel ANA Boutique Six'],
      4: ['Hotel Bristol Vienna', 'Das Triest Hotel', 'Boutique Hotel Stadthalle'],
      5: ['Hotel Imperial Vienna', 'Palais Hansen Kempinski Vienna', 'Rosewood Vienna'],
      7: ['Hotel Sacher Wien', 'The Ritz-Carlton Vienna', 'Grand Hotel Wien'],
    },
    'Helsinki': {
      3: ['Hostel Suomenlinna', 'UrbanCamp Helsinki', 'Hotelli Finn Helsinki'],
      4: ['Scandic Grand Marina', 'GLO Hotel Art Helsinki', 'Hotel Fabian'],
      5: ['Hotel Kämp', 'Klaus K Helsinki', 'St. George Helsinki'],
      7: ['Hotel Haven', 'Lilla Roberts', 'The Bank Hotel Helsinki'],
    },
    'Singapore': {
      3: ['The Bohemian Chinatown', 'Nostalgia Hotel Singapore', 'Adler Luxury Hostel'],
      4: ['Naumi Hotel Singapore', 'Lloyd\'s Inn Singapore', 'Hotel Indigo Singapore'],
      5: ['Capella Singapore', 'Raffles Hotel Singapore', 'Fullerton Bay Hotel Singapore'],
      7: ['Four Seasons Hotel Singapore', 'The St. Regis Singapore', 'Mandarin Oriental Singapore'],
    },
    'Athens': {
      3: ['Athens Backpackers', 'Hotel Tempi', 'Fresh Hotel Athens'],
      4: ['Radisson Blu Park Hotel Athens', 'Electra Hotel Athens', 'Hotel Titania Athens'],
      5: ['Hotel Grande Bretagne', 'King George, A Luxury Collection Hotel', 'The Dolli at Acropolis'],
      7: ['Four Seasons Astir Palace Hotel Athens', 'Electra Metropolis Athens', 'Athenaeum InterContinental Athens'],
    },
    'Cairo': {
      3: ['Cairo Marriott Hotel (Budget Wing)', 'Novotel Cairo El Borg', 'ibis Cairo Citystars'],
      4: ['Kempinski Nile Hotel Cairo', 'Ramses Hilton Cairo', 'Mövenpick Hotel Cairo-Media City'],
      5: ['Four Seasons Hotel Cairo at Nile Plaza', 'Fairmont Nile City Cairo', 'The Nile Ritz-Carlton Cairo'],
      7: ['Sofitel Cairo Nile El Gezirah', 'Four Seasons Hotel Cairo at The First Residence', 'Conrad Cairo Hotel'],
    },
    'Barcelona': {
      3: ['Hostal Grau Barcelona', 'Hotel Acta Splendid', 'Hotel Jardi Barcelona'],
      4: ['Hotel Arts Barcelona', 'Gran Hotel La Florida', 'Mandarin Oriental Barcelona'],
      5: ['W Barcelona', 'Hotel Majestic Barcelona', 'Soho House Barcelona'],
      7: ['El Palace Barcelona', 'The Serras Hotel Barcelona', 'Grand Hyatt Barcelona'],
    },
    'London': {
      3: ['Hub London King\'s Cross', 'Z Hotel Shoreditch', 'ibis London City'],
      4: ['The Hoxton Holborn', 'Sanderson London', 'The Marylebone Hotel'],
      5: ['The Langham London', 'The Savoy London', 'Brown\'s Hotel London'],
      7: ['The Ritz London', 'Claridge\'s London', 'The Connaught London'],
    },
    'Kathmandu': {
      3: ['Kathmandu Guest House', 'Hotel Thamel Inn', 'Fuji Hotel Kathmandu'],
      4: ['Hotel Yak & Yeti', 'Radisson Hotel Kathmandu', 'Gokarna Forest Resort'],
      5: ['Hyatt Regency Kathmandu', 'Dwarika\'s Hotel Kathmandu', 'Shanker Hotel Kathmandu'],
      7: ['The Pavilions Himalayas', 'Dwarika\'s Resort Dhulikhel', 'Kathmandu Marriott Hotel'],
    },
    'Thimphu': {
      3: ['Hotel Jumolhari Thimphu', 'Tenzinling Resort', 'Druk Hotel Thimphu'],
      4: ['Le Méridien Thimphu', 'Kisa Hotel Thimphu', 'Hotel Phuntsho Pelri'],
      5: ['Six Senses Thimphu', 'Amankora Thimphu', 'COMO Uma Paro'],
      7: ['Six Senses Paro', 'Amankora Paro', 'Zhiwa Ling Heritage'],
    },
    'Dublin': {
      3: ['Generator Dublin', 'Isaacs Hostel Dublin', 'Jurys Inn Dublin'],
      4: ['The Alex Hotel Dublin', 'O\'Callaghan Davenport Hotel', 'Clayton Hotel Burlington Road'],
      5: ['The Shelbourne Dublin', 'Merrion Hotel Dublin', 'Ashford Castle'],
      7: ['InterContinental Dublin', 'The Westbury Hotel Dublin', 'Dylan Hotel Dublin'],
    },
  };

  const cityHotels = DESTINATION_HOTELS[destination.city];
  const hotels: Record<number, string[]> = cityHotels || {
    3: [`${destination.city} Budget Inn`, `Comfort Stay ${destination.city}`, `${destination.city} Central Hotel`],
    4: [`${destination.city} Grand Hotel`, `The ${destination.city} Plaza`, `Sheraton ${destination.city}`],
    5: [`${destination.city} Luxury Palace`, `The Ritz-Carlton ${destination.city}`, `Four Seasons ${destination.city}`],
    7: [`Aman ${destination.city}`, `Park Hyatt ${destination.city}`, `Four Seasons ${destination.city}`],
  };
  const hotelList = hotels[requirements.hotelStar] || hotels[4];

  for (let i = 0; i < requirements.duration; i++) {
    const dayAttractions = attractions.splice(0, Math.min(2, attractions.length));
    const dayActivities = activities.splice(0, Math.min(1, activities.length));
    const hotel = hotelList[i % hotelList.length];

    let notes = '';
    if (i === 0) notes = `Arrival day. Check-in and freshen up. Enjoy a welcome dinner at a local restaurant.`;
    else if (i === requirements.duration - 1) notes = `Last day. Morning at leisure. Pack and check-out. Departure transfer.`;
    else notes = `Full day of exploration. Dress appropriately for the weather.`;

    days.push({
      id: `day-${i + 1}`,
      day: i + 1,
      location: destination.city,
      attractions: dayAttractions,
      activities: dayActivities,
      hotel,
      notes,
    });
  }
  return days;
}

export function generateBookingRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'AG-';
  for (let i = 0; i < 8; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
}

export function getContactNumber(destination: string): string {
  const contacts: Record<string, string> = {
    'United Arab Emirates': '+971-4-VOYAGO (869-246)',
    'France': '+33-1-VOYAGO (869-246)',
    'Indonesia': '+62-21-VOYAGO (869-246)',
    'Japan': '+81-3-VOYAGO (869-246)',
    'Maldives': '+960-VOYAGO (869-246)',
    'United States of America': '+1-800-VOYAGO (869-246)',
  };
  return contacts[destination] || '+91-9876-543210';
}

export { calculateCosts };
