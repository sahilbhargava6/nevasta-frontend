'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

// Pincode -> city/state, ported from the design prototype (COM_PIN_MAP).
// Only an offline fallback now: usePincodeLookup verifies every pincode with
// the API (MapmyIndia, India Post backup) and uses this map only when the
// API can't be reached. Unknown pincodes leave city/state editable.
const PIN_MAP: Record<string, string> = {
  '400001':'Mumbai|Maharashtra','400002':'Mumbai|Maharashtra','400051':'Mumbai|Maharashtra',
  '400064':'Mumbai|Maharashtra','400070':'Mumbai|Maharashtra','400076':'Mumbai|Maharashtra',
  '110001':'New Delhi|Delhi','110002':'New Delhi|Delhi','110003':'New Delhi|Delhi',
  '110011':'New Delhi|Delhi','110016':'New Delhi|Delhi','110020':'New Delhi|Delhi',
  '560001':'Bengaluru|Karnataka','560002':'Bengaluru|Karnataka','560008':'Bengaluru|Karnataka',
  '560034':'Bengaluru|Karnataka','560037':'Bengaluru|Karnataka','560100':'Bengaluru|Karnataka',
  '600001':'Chennai|Tamil Nadu','600002':'Chennai|Tamil Nadu','600006':'Chennai|Tamil Nadu',
  '600018':'Chennai|Tamil Nadu','600041':'Chennai|Tamil Nadu',
  '700001':'Kolkata|West Bengal','700002':'Kolkata|West Bengal','700006':'Kolkata|West Bengal',
  '700016':'Kolkata|West Bengal','700032':'Kolkata|West Bengal',
  '500001':'Hyderabad|Telangana','500002':'Hyderabad|Telangana','500032':'Hyderabad|Telangana',
  '500081':'Hyderabad|Telangana','500084':'Hyderabad|Telangana',
  '411001':'Pune|Maharashtra','411002':'Pune|Maharashtra','411013':'Pune|Maharashtra',
  '411028':'Pune|Maharashtra','411038':'Pune|Maharashtra',
  '380001':'Ahmedabad|Gujarat','380002':'Ahmedabad|Gujarat','380009':'Ahmedabad|Gujarat',
  '380054':'Ahmedabad|Gujarat','380059':'Ahmedabad|Gujarat',
  '302001':'Jaipur|Rajasthan','302002':'Jaipur|Rajasthan','302004':'Jaipur|Rajasthan',
  '226001':'Lucknow|Uttar Pradesh','226002':'Lucknow|Uttar Pradesh','226010':'Lucknow|Uttar Pradesh',
  '201301':'Noida|Uttar Pradesh','201010':'Noida|Uttar Pradesh',
  '201001':'Ghaziabad|Uttar Pradesh','201002':'Ghaziabad|Uttar Pradesh',
  '122001':'Gurugram|Haryana','122002':'Gurugram|Haryana','122022':'Gurugram|Haryana',
  '131001':'Sonipat|Haryana','132001':'Karnal|Haryana',
  '160001':'Chandigarh|Chandigarh','160002':'Chandigarh|Chandigarh',
  '248001':'Dehradun|Uttarakhand','248002':'Dehradun|Uttarakhand',
  '440001':'Nagpur|Maharashtra','440002':'Nagpur|Maharashtra',
  '452001':'Indore|Madhya Pradesh','452002':'Indore|Madhya Pradesh',
  '462001':'Bhopal|Madhya Pradesh','462002':'Bhopal|Madhya Pradesh',
  '395001':'Surat|Gujarat','395002':'Surat|Gujarat','395003':'Surat|Gujarat',
  '390001':'Vadodara|Gujarat','390002':'Vadodara|Gujarat',
  '641001':'Coimbatore|Tamil Nadu','641002':'Coimbatore|Tamil Nadu',
  '625001':'Madurai|Tamil Nadu','625002':'Madurai|Tamil Nadu',
  '682001':'Kochi|Kerala','682002':'Kochi|Kerala','682006':'Kochi|Kerala',
  '695001':'Thiruvananthapuram|Kerala','695002':'Thiruvananthapuram|Kerala',
  '530001':'Visakhapatnam|Andhra Pradesh','530002':'Visakhapatnam|Andhra Pradesh',
  '520001':'Vijayawada|Andhra Pradesh','521001':'Vijayawada|Andhra Pradesh',
  '831001':'Jamshedpur|Jharkhand','834001':'Ranchi|Jharkhand',
  '800001':'Patna|Bihar','800002':'Patna|Bihar','800014':'Patna|Bihar',
  '208001':'Kanpur|Uttar Pradesh','208002':'Kanpur|Uttar Pradesh',
  '282001':'Agra|Uttar Pradesh','282002':'Agra|Uttar Pradesh',
  '250001':'Meerut|Uttar Pradesh','250002':'Meerut|Uttar Pradesh'
};

export function lookupPincode(pincode: string): { city: string; state: string } | null {
  const hit = PIN_MAP[pincode.trim()];
  if (!hit) return null;
  const [city, state] = hit.split('|');
  return { city, state };
}

export function isValidPincode(pincode: string): boolean {
  return /^[1-9]\d{5}$/.test(pincode.trim());
}

/**
 * - idle: not 6 digits yet
 * - checking: asking the API
 * - verified: the pincode exists; `info` has the place
 * - not_found: no such pincode (block the form)
 * - unavailable: couldn't check (don't block; let the customer type city/state)
 */
export type PincodeStatus = 'idle' | 'checking' | 'verified' | 'not_found' | 'unavailable';

export interface PincodeInfo {
  city: string;
  district: string;
  state: string;
  locality: string | null;
}

const cache = new Map<string, { status: 'verified' | 'not_found'; info: PincodeInfo | null }>();

/**
 * Verifies a pincode as it is typed and calls `onPlace` with the place (verified, or
 * from the offline list when the API is down), so
 * the form can fill in city and state. Debounced; answers are cached per page load.
 */
export function usePincodeLookup(pincode: string, onPlace?: (info: PincodeInfo) => void) {
  const pin = pincode.trim();
  const valid = isValidPincode(pin);
  const [result, setResult] = useState<{ pin: string; status: PincodeStatus; info: PincodeInfo | null }>({ pin: '', status: 'idle', info: null });
  const callback = useRef(onPlace);
  useEffect(() => {
    callback.current = onPlace;
  });

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const done = (status: PincodeStatus, info: PincodeInfo | null) => {
      if (cancelled) return;
      setResult({ pin, status, info });
      if (info && (status === 'verified' || status === 'unavailable')) callback.current?.(info);
    };

    const hit = cache.get(pin);
    if (hit) {
      done(hit.status, hit.info);
      return () => {
        cancelled = true;
      };
    }

    setResult({ pin, status: 'checking', info: null });
    const timer = setTimeout(async () => {
      try {
        const res: any = await api.get(`/utilities/pincode/${pin}`);
        const d = res.data ?? {};
        const info: PincodeInfo = { city: d.city ?? '', district: d.district ?? '', state: d.state ?? '', locality: d.locality ?? null };
        cache.set(pin, { status: 'verified', info });
        done('verified', info);
      } catch (err) {
        if ((err as { status?: number }).status === 404) {
          cache.set(pin, { status: 'not_found', info: null });
          done('not_found', null);
        } else {
          // Offline fallback: the design's built-in list, else manual entry
          const local = lookupPincode(pin);
          done('unavailable', local ? { ...local, district: '', locality: null } : null);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pin, valid]);

  if (!valid || result.pin !== pin) return { status: (valid ? 'checking' : 'idle') as PincodeStatus, info: null };
  return { status: result.status, info: result.info };
}

/** One line under the pincode field describing the check. */
export function pincodeHint(status: PincodeStatus, info: PincodeInfo | null): { text: string; color: string } | null {
  switch (status) {
    case 'checking':
      return { text: 'Checking pincode…', color: '#7A5E44' };
    case 'verified':
      return info ? { text: `✓ ${[info.locality, info.city, info.state].filter(Boolean).join(', ')}`, color: '#2D7A3A' } : null;
    case 'not_found':
      return { text: "⚠ We couldn't find this pincode. Please check it.", color: '#DC2626' };
    case 'unavailable':
      return { text: info ? `${info.city}, ${info.state} (couldn't verify right now)` : "Couldn't verify right now. Please enter your city and state.", color: '#B45309' };
    default:
      return null;
  }
}
