// ===== src/components/layout/categoryMeta.ts =====
// Static metadata for categories used in the mega-menu

import {
  Smartphone, Laptop, Headphones, Watch,
  Tablet, Monitor, Gamepad, Package,
} from 'lucide-react';

export const CATEGORY_META: Record<string, { icon: any; brands: string[]; priceRanges: { label: string; min: number; max: number | '' }[] }> = {
  CAT_PHONE: {
    icon: Smartphone,
    brands: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Huawei'],
    priceRanges: [
      { label: 'Under $300', min: 0, max: 300 },
      { label: '$300 - $800', min: 300, max: 800 },
      { label: 'Over $800', min: 800, max: '' },
    ],
  },
  CAT_LAPTOP: {
    icon: Laptop,
    brands: ['MacBook', 'Dell', 'Asus ROG', 'HP', 'Lenovo', 'MSI'],
    priceRanges: [
      { label: 'Under $800', min: 0, max: 800 },
      { label: '$800 - $1500', min: 800, max: 1500 },
      { label: 'Premium (Over $1500)', min: 1500, max: '' },
    ],
  },
  CAT_AUDIO: {
    icon: Headphones,
    brands: ['Sony', 'Apple', 'JBL', 'Bose', 'Sennheiser', 'Marshall'],
    priceRanges: [
      { label: 'Under $50', min: 0, max: 50 },
      { label: '$50 - $150', min: 50, max: 150 },
      { label: 'Over $150', min: 150, max: '' },
    ],
  },
  CAT_ACCESSORY: {
    icon: Watch,
    brands: ['Mibro', 'Anker', 'Logitech', 'Garmin', 'Corsair', 'Samsung'],
    priceRanges: [
      { label: 'Under $20', min: 0, max: 20 },
      { label: '$20 - $50', min: 20, max: 50 },
      { label: 'Over $50', min: 50, max: '' },
    ],
  },
  CAT_TABLET: {
    icon: Tablet,
    brands: ['Apple iPad', 'Samsung Galaxy Tab', 'Lenovo', 'Xiaomi'],
    priceRanges: [
      { label: 'Under $300', min: 0, max: 300 },
      { label: '$300 - $800', min: 300, max: 800 },
      { label: 'Over $800', min: 800, max: '' },
    ],
  },
  CAT_MONITOR: {
    icon: Monitor,
    brands: ['LG', 'Samsung', 'Dell', 'Asus', 'BenQ'],
    priceRanges: [
      { label: 'Under $200', min: 0, max: 200 },
      { label: '$200 - $500', min: 200, max: 500 },
      { label: '4K & Ultrawide', min: 500, max: '' },
    ],
  },
  CAT_GAMING: {
    icon: Gamepad,
    brands: ['PlayStation', 'Xbox', 'Nintendo', 'Razer', 'Logitech G'],
    priceRanges: [
      { label: 'Under $100', min: 0, max: 100 },
      { label: 'Consoles ($300+)', min: 300, max: '' },
    ],
  },
};

export const DEFAULT_META = {
  icon: Package,
  brands: ['Top Brands', 'Trending Deals'],
  priceRanges: [
    { label: 'Under $50', min: 0, max: 50 },
    { label: '$50 - $200', min: 50, max: 200 },
    { label: 'Over $200', min: 200, max: '' },
  ],
};
