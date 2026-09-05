'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { getContactNumber } from '@/lib/trip-utils';
import { CheckCircle, Phone, Download, RotateCcw, Star, Plane } from 'lucide-react';
import toast from 'react-hot-toast';

// Confetti animation
function fireConfetti() {
  if (typeof window !== 'undefined') {
    try {
      const end = Date.now() + 2000;
      const colors = ['#6C63FF', '#06B6D4', '#F59E0B', '#10B981', '#FF6B6B'];
      (function frame() {
        (confetti as any)({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
        (confetti as any)({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    } catch {}
  }
}

export function ConfirmedStep() {
  const { tripPlan, selectedDestination, requirements, costs, reset } = useAppStore();

  useEffect(() => {
    setTimeout(fireConfetti, 300);
  }, []);

  if (!tripPlan || !selectedDestination || !requirements || !costs) return null;

  const contactNumber = getContactNumber(selectedDestination.country);

  const handleDownloadPDF = () => {
    const content = generateTextReport(tripPlan, selectedDestination, requirements, costs);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voyago_Trip_${tripPlan.bookingRef}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Trip report downloaded!');
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 hero-gradient flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}>
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Booking Confirmed!</h1>
          <p className="text-white/60 text-lg">Your dream trip to {selectedDestination.city} is all set ✈️</p>
        </motion.div>

        {/* Booking Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/90 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden mb-6"
        >
          {/* Header */}
          <div className="p-6 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
            <div className="absolute right-4 top-4 text-7xl opacity-20">{selectedDestination.emoji}</div>
            <div className="relative z-10">
              <div className="text-xs text-white/60 uppercase tracking-widest mb-2">Booking Reference</div>
              <div className="text-3xl font-black tracking-wider">{tripPlan.bookingRef}</div>
              <div className="text-white/70 text-sm mt-1">{new Date(tripPlan.createdAt).toLocaleDateString('en-IN', { dateStyle: 'full' })}</div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Detail label="Traveller" value={requirements.name} />
            <Detail label="Destination" value={`${selectedDestination.city}, ${selectedDestination.country}`} />
            <Detail label="Duration" value={`${requirements.duration} days`} />
            <Detail label="Group Size" value={`${requirements.groupSize} people`} />
            <Detail label="Travel Month" value={requirements.travelMonth} />
            <Detail label="Hotel" value={`${requirements.hotelStar}★ Hotel`} />
          </div>

          <div className="px-6 pb-6">
            <div className="p-4 rounded-2xl text-center bg-emerald-500/10 border border-emerald-400/20">
              <div className="text-sm text-muted-foreground mb-1">Total Amount Paid</div>
              <div className="text-3xl font-black text-emerald-400">{formatCurrency(costs.total * 1.20)}</div>
            </div>
          </div>
        </motion.div>

        {/* Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="font-bold">Your Dedicated Travel Concierge</div>
              <div className="text-xs text-muted-foreground">Available 24/7 for your trip assistance</div>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase font-medium">Contact Number</div>
            <div className="text-lg font-black text-violet-400">{contactNumber}</div>
            <div className="text-xs text-muted-foreground mt-1">Quote your booking ref: <strong>{tripPlan.bookingRef}</strong></div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {['WhatsApp Available', 'Email Support', '24/7 Emergency Line'].map(s => (
              <div key={s} className="bg-muted/50 rounded-lg p-2 flex items-center justify-center gap-1 text-muted-foreground">
                <Star className="w-3 h-3 text-violet-400" />{s}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-violet-400/30 text-violet-400 font-bold hover:bg-violet-500/10 transition-colors"
          >
            <Download className="w-5 h-5" /> Download Trip Report
          </button>
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          >
            <RotateCcw className="w-5 h-5" /> Plan Another Trip
          </button>
        </motion.div>

        {/* Floating plane animation */}
        <motion.div
          className="fixed bottom-8 right-8 text-4xl"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✈️
        </motion.div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function generateTextReport(tripPlan: any, dest: any, req: any, costs: any): string {
  return `
=================================================
   VOYAGO — OFFICIAL BOOKING CONFIRMATION
=================================================
Booking Reference: ${tripPlan.bookingRef}
Date: ${new Date(tripPlan.createdAt).toLocaleDateString()}

TRAVELLER DETAILS
-----------------
Name: ${req.name}
Email: ${req.email}
Phone: ${req.phone}

TRIP SUMMARY
-----------------
Destination: ${dest.city}, ${dest.country}
Duration: ${req.duration} days
Group Size: ${req.groupSize} people
Travel Month: ${req.travelMonth}
Hotel Category: ${req.hotelStar}-Star

ITINERARY
-----------------
${tripPlan.itinerary.map((d: any) => `
Day ${d.day} - ${d.location}
  Hotel: ${d.hotel}
  Attractions: ${d.attractions.map((a: any) => a.name).join(', ') || 'None'}
  Activities: ${d.activities.map((a: any) => a.name).join(', ') || 'None'}
  Notes: ${d.notes}
`).join('')}

COST BREAKDOWN
-----------------
Visa: ₹${Math.round(costs.visa * req.groupSize * 83).toLocaleString('en-IN')}
Flights: ₹${Math.round(costs.flights * 83).toLocaleString('en-IN')}
Hotel: ₹${Math.round(costs.totalHotel * 83).toLocaleString('en-IN')}
Food: ₹${Math.round(costs.totalFood * 83).toLocaleString('en-IN')}
Activities: ₹${Math.round(costs.activities * 83).toLocaleString('en-IN')}
Shopping: ₹${Math.round(costs.shopping * 83).toLocaleString('en-IN')}
Transport: ₹${Math.round(costs.transport * 83).toLocaleString('en-IN')}
Insurance: ₹${Math.round(costs.insurance * 83).toLocaleString('en-IN')}
Miscellaneous: ₹${Math.round(costs.miscellaneous * 83).toLocaleString('en-IN')}
---
Subtotal: ₹${Math.round(costs.total * 83).toLocaleString('en-IN')}
Tax & Fees (20%): ₹${Math.round(costs.total * 0.20 * 83).toLocaleString('en-IN')}
TOTAL PAID: ₹${Math.round(costs.total * 1.20 * 83).toLocaleString('en-IN')}

SAFETY INFORMATION
-----------------
Safety Index: ${dest.safety.safetyIndex}%
Geo-Political Risk: ${dest.safety.geopoliticalRisk.toUpperCase()}
Advisory: ${dest.safety.travelAdvisory}

IMPORTANT NOTES
-----------------
${dest.cultural.importantNotes.join('\n')}

=================================================
Contact your dedicated travel concierge:
Voyago Support
Booking Ref: ${tripPlan.bookingRef}
=================================================
  `.trim();
}


