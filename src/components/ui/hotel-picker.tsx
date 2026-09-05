'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Wifi, Car, UtensilsCrossed, Dumbbell, Waves, Check, X, MapPin, Users, IndianRupee } from 'lucide-react';
import { Destination } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface HotelOption {
  id: string;
  name: string;
  stars: number;
  pricePerNight: number;   // INR
  totalPrice: number;      // INR for the full stay
  imageUrl: string;
  amenities: string[];
  description: string;
  rating: number;
  reviewCount: number;
  distanceFromCenter: string;
  type: 'luxury' | 'boutique' | 'resort' | 'heritage' | 'business';
}

// ─── Hotel image pool (Unsplash photo IDs) ────────────────────────────────────
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=400&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop&auto=format&q=80',
];

const STAR_PRICES: Record<number, { min: number; max: number }> = {
  3: { min: 3500,  max: 8000 },
  4: { min: 8000,  max: 18000 },
  5: { min: 18000, max: 45000 },
  7: { min: 45000, max: 1_50_000 },
};

const HOTEL_TYPES: HotelOption['type'][] = ['luxury', 'boutique', 'resort', 'heritage', 'business'];
const TYPE_LABELS: Record<HotelOption['type'], { label: string; color: string }> = {
  luxury:   { label: 'Luxury Hotel',    color: 'text-amber-400 bg-amber-400/10' },
  boutique: { label: 'Boutique Hotel',  color: 'text-violet-400 bg-violet-400/10' },
  resort:   { label: 'Beach Resort',    color: 'text-cyan-400 bg-cyan-400/10' },
  heritage: { label: 'Heritage Hotel',  color: 'text-orange-400 bg-orange-400/10' },
  business: { label: 'Business Hotel',  color: 'text-blue-400 bg-blue-400/10' },
};

const AMENITY_ICONS: Record<string, { icon: any; label: string }> = {
  wifi:      { icon: Wifi,           label: 'Free Wi-Fi' },
  pool:      { icon: Waves,          label: 'Swimming Pool' },
  gym:       { icon: Dumbbell,       label: 'Fitness Centre' },
  restaurant:{ icon: UtensilsCrossed,label: 'Restaurant' },
  parking:   { icon: Car,            label: 'Free Parking' },
};

function getAmenities(stars: number): string[] {
  if (stars >= 7) return ['wifi', 'pool', 'gym', 'restaurant', 'parking'];
  if (stars >= 5) return ['wifi', 'pool', 'gym', 'restaurant'];
  if (stars >= 4) return ['wifi', 'pool', 'restaurant'];
  return ['wifi', 'restaurant'];
}

function getDesc(stars: number, city: string, type: HotelOption['type']): string {
  if (stars >= 7) return `An iconic ultra-luxury property in the heart of ${city}, offering world-class butler service, private pools, and Michelin-star dining.`;
  if (stars >= 5) return `A premium ${type} experience in ${city} with elegant rooms, state-of-the-art facilities, and impeccable service.`;
  if (stars >= 4) return `A superior ${type} property in ${city} offering exceptional comfort, modern amenities, and attentive service.`;
  return `A comfortable and well-located property in ${city}, perfect for travelers seeking quality at a sensible price.`;
}

// ─── Generator ────────────────────────────────────────────────────────────────
export function generateHotelOptions(
  suggestedHotels: string[],
  destination: Destination,
  preferredStar: number,
  duration: number,
  groupSize: number,
): HotelOption[] {
  const rooms = Math.ceil(groupSize / 2);
  // Real hotel brand fallbacks keyed by city, with generic global brands as ultimate fallback
  const CITY_HOTEL_FALLBACKS: Record<string, string[]> = {
    'Dubai': ['Burj Al Arab Jumeirah', 'Atlantis The Royal', 'Four Seasons Resort Dubai', 'Bulgari Resort Dubai'],
    'Paris': ['Ritz Paris', 'Four Seasons Hotel George V', 'Hôtel Plaza Athénée', 'Le Bristol Paris'],
    'Bali': ['Four Seasons Resort Bali at Sayan', 'Mandapa, a Ritz-Carlton Reserve', 'Bvlgari Resort Bali', 'Capella Ubud'],
    'Tokyo': ['Aman Tokyo', 'The Peninsula Tokyo', 'Mandarin Oriental Tokyo', 'Park Hyatt Tokyo'],
    'Malé': ['Soneva Fushi', 'Gili Lankanfushi', 'One&Only Reethi Rah', 'Cheval Blanc Randheli'],
    'New York City': ['Aman New York', 'The Plaza Hotel', 'The St. Regis New York', 'The Carlyle, A Rosewood Hotel'],
    'Sydney': ['Capella Sydney', 'Park Hyatt Sydney', 'Four Seasons Hotel Sydney', 'The Langham Sydney'],
    'Vienna': ['Hotel Sacher Wien', 'The Ritz-Carlton Vienna', 'Hotel Imperial Vienna', 'Grand Hotel Wien'],
    'Helsinki': ['Hotel Haven', 'Hotel Kämp', 'St. George Helsinki', 'Lilla Roberts'],
    'Singapore': ['Capella Singapore', 'Raffles Hotel Singapore', 'The St. Regis Singapore', 'Four Seasons Hotel Singapore'],
    'Athens': ['Hotel Grande Bretagne', 'Four Seasons Astir Palace Hotel Athens', 'King George, A Luxury Collection Hotel', 'The Dolli at Acropolis'],
    'Cairo': ['Four Seasons Hotel Cairo at Nile Plaza', 'The Nile Ritz-Carlton Cairo', 'Sofitel Cairo Nile El Gezirah', 'Fairmont Nile City Cairo'],
    'Barcelona': ['El Palace Barcelona', 'W Barcelona', 'Mandarin Oriental Barcelona', 'Hotel Arts Barcelona'],
    'London': ['The Ritz London', 'Claridge\'s London', 'The Savoy London', 'The Connaught London'],
    'Kathmandu': ['Dwarika\'s Hotel Kathmandu', 'Hyatt Regency Kathmandu', 'The Pavilions Himalayas', 'Hotel Yak & Yeti'],
    'Thimphu': ['Amankora Thimphu', 'Six Senses Thimphu', 'COMO Uma Paro', 'Le Méridien Thimphu'],
    'Dublin': ['The Shelbourne Dublin', 'Merrion Hotel Dublin', 'Ashford Castle', 'InterContinental Dublin'],
  };
  const cityFallbacks = CITY_HOTEL_FALLBACKS[destination.city] || [
    `Four Seasons Hotel ${destination.city}`,
    `The Ritz-Carlton ${destination.city}`,
    `Park Hyatt ${destination.city}`,
    `Marriott ${destination.city}`,
  ];
  const names = suggestedHotels.length >= 4 ? suggestedHotels.slice(0, 4) : [
    ...suggestedHotels,
    ...cityFallbacks,
  ].slice(0, 4);

  return names.map((name, i) => {
    const starVariant = [preferredStar, preferredStar, Math.max(3, preferredStar - 1), Math.min(7, preferredStar + 1)][i];
    const star = Math.max(3, Math.min(7, starVariant));
    const priceRange = STAR_PRICES[star] ?? STAR_PRICES[5];
    // deterministic "random" based on name hash so it's stable between renders
    const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const pct = (seed % 100) / 100;
    const pricePerNight = Math.round(priceRange.min + pct * (priceRange.max - priceRange.min));
    const totalPrice = pricePerNight * duration * rooms;

    return {
      id: `hotel-${i}`,
      name,
      stars: star,
      pricePerNight,
      totalPrice,
      imageUrl: HOTEL_IMAGES[i % HOTEL_IMAGES.length],
      amenities: getAmenities(star),
      description: getDesc(star, destination.city, HOTEL_TYPES[i % HOTEL_TYPES.length]),
      rating: parseFloat((3.8 + (seed % 12) / 10).toFixed(1)),
      reviewCount: 200 + (seed % 1800),
      distanceFromCenter: `${(0.3 + (seed % 40) / 10).toFixed(1)} km from city centre`,
      type: HOTEL_TYPES[i % HOTEL_TYPES.length],
    };
  });
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────
function HotelCard({
  hotel, selected, onSelect,
}: {
  hotel: HotelOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const typeStyle = TYPE_LABELS[hotel.type];

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      onClick={onSelect}
      className={`rounded-2xl border overflow-hidden cursor-pointer transition-all relative ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-500/30'
          : 'border-border hover:border-violet-400/40'
      }`}
    >
      {/* Selection overlay check */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center shadow-lg"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={hotel.imageUrl}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Star rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5">
          {Array.from({ length: Math.min(hotel.stars, 5) }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
          {hotel.stars === 7 && <span className="text-amber-400 text-xs font-bold ml-1">+2</span>}
        </div>
        {/* Type badge */}
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${typeStyle.color} backdrop-blur-sm`}>
          {typeStyle.label}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h4 className="font-bold text-sm leading-snug mb-1 line-clamp-1">{hotel.name}</h4>

        {/* Rating + distance */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-amber-400">{hotel.rating} ★</span>
          <span className="text-[10px] text-muted-foreground">({hotel.reviewCount.toLocaleString()} reviews)</span>
          <span className="text-[10px] text-muted-foreground">· {hotel.distanceFromCenter}</span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">{hotel.description}</p>

        {/* Amenities */}
        <div className="flex items-center gap-2 mb-3">
          {hotel.amenities.slice(0, 4).map(k => {
            const a = AMENITY_ICONS[k];
            if (!a) return null;
            const Icon = a.icon;
            return (
              <div key={k} title={a.label} className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            );
          })}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Per night</div>
            <div className="text-lg font-black text-violet-400">₹{hotel.pricePerNight.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total stay</div>
            <div className="text-sm font-bold">₹{hotel.totalPrice.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hotel Picker Modal ────────────────────────────────────────────────────────
interface HotelPickerProps {
  hotels: HotelOption[];
  destination: Destination;
  groupSize: number;
  duration: number;
  onSelect: (hotel: HotelOption) => void;
  onClose: () => void;
}

export function HotelPickerModal({ hotels, destination, groupSize, duration, onSelect, onClose }: HotelPickerProps) {
  const [selected, setSelected] = useState<HotelOption | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-3xl bg-card rounded-t-3xl md:rounded-3xl border border-border overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-black text-xl">Choose Your Hotel</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{destination.city}</span>
              <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />All prices in INR</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{groupSize} guests · {duration} nights</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable hotel cards */}
        <div className="overflow-y-auto p-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hotels.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <HotelCard
                  hotel={hotel}
                  selected={selected?.id === hotel.id}
                  onSelect={() => setSelected(hotel)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex items-center gap-4">
          <div className="flex-1">
            {selected ? (
              <div className="text-sm">
                <span className="text-muted-foreground">Selected: </span>
                <span className="font-bold text-violet-400">{selected.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">· ₹{selected.pricePerNight.toLocaleString('en-IN')}/night</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a hotel to continue</p>
            )}
          </div>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="px-6 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40 transition-all flex items-center gap-2 shrink-0"
            style={selected ? { background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' } : { background: '#374151' }}
          >
            <Check className="w-4 h-4" />
            Confirm & Build Itinerary
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
