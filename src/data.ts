/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InvestmentPlan, TeamMember, TransactionRecord } from './types';

export const INITIAL_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_special_offer',
    type: 'vip',
    title: 'DLF Luxury Residencies Fund',
    price: 750,
    dailyIncome: 4536,
    durationDays: 2,
    totalProfit: 9072,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    slotsMax: 10,
    slotsPurchased: 0,
  },
  {
    id: 'plan_product_a',
    type: 'daily',
    title: 'Urban Smart Studio Fund',
    price: 280,
    dailyIncome: 240,
    durationDays: 50,
    totalProfit: 12000,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    slotsMax: 10,
    slotsPurchased: 3,
  },
  {
    id: 'plan_apex_ultima',
    type: 'daily',
    title: 'Sovereign Commercial Plaza Fund',
    price: 1200,
    dailyIncome: 510,
    durationDays: 45,
    totalProfit: 22950,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    slotsMax: 15,
    slotsPurchased: 5,
  },
  {
    id: 'plan_royale_luxury',
    type: 'daily',
    title: 'Prestige Waterfront Villa Fund',
    price: 3500,
    dailyIncome: 1580,
    durationDays: 40,
    totalProfit: 63200,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
    slotsMax: 12,
    slotsPurchased: 2,
  },
  {
    id: 'plan_tractor_emulsion',
    type: 'daily',
    title: 'Affordable Housing Prime Fund',
    price: 8000,
    dailyIncome: 3850,
    durationDays: 35,
    totalProfit: 134750,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
    slotsMax: 8,
    slotsPurchased: 1,
  },
  {
    id: 'plan_vip_elite',
    type: 'vip',
    title: 'Emaar Premium Penthouse Syndicate',
    price: 15000,
    dailyIncome: 9500,
    durationDays: 4,
    totalProfit: 38000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    slotsMax: 5,
    slotsPurchased: 1,
  },
  {
    id: 'plan_vip_mega',
    type: 'vip',
    title: 'Grand Metro Mall Equity Venture',
    price: 50000,
    dailyIncome: 35000,
    durationDays: 3,
    totalProfit: 105000,
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    slotsMax: 5,
    slotsPurchased: 0,
  }
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team_1',
    name: 'Sandeep Kumar',
    phone: '987***4120',
    level: 1,
    dateJoined: '2026-07-10',
    totalInvested: 1030,
    commissionEarned: 103,
  },
  {
    id: 'team_2',
    name: 'Vijay Sharma',
    phone: '914***8831',
    level: 1,
    dateJoined: '2026-07-12',
    totalInvested: 280,
    commissionEarned: 28,
  },
  {
    id: 'team_3',
    name: 'Anil Yadav',
    phone: '875***9021',
    level: 2,
    dateJoined: '2026-07-11',
    totalInvested: 750,
    commissionEarned: 37.5,
  },
  {
    id: 'team_4',
    name: 'Rakesh Pal',
    phone: '701***1243',
    level: 3,
    dateJoined: '2026-07-12',
    totalInvested: 280,
    commissionEarned: 5.6,
  },
  {
    id: 'team_5',
    name: 'Manoj Singh',
    phone: '945***3342',
    level: 1,
    dateJoined: '2026-07-13',
    totalInvested: 0,
    commissionEarned: 0,
  }
];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx_init_1',
    type: 'checkin',
    amount: 15,
    date: '2026-07-12 09:15:00',
    status: 'success',
    description: 'Daily Check-in Bonus credited',
    userId: 'usr_demo',
    userPhone: '+91 9876543210'
  },
  {
    id: 'tx_init_2',
    type: 'recharge',
    amount: 500,
    date: '2026-07-12 10:30:24',
    status: 'success',
    description: 'Recharge approval via PhonePe UPI',
    utr: '623910385920',
    userId: 'usr_demo',
    userPhone: '+91 9876543210'
  },
  {
    id: 'tx_init_3',
    type: 'purchase',
    amount: 280,
    date: '2026-07-12 11:00:15',
    status: 'success',
    description: 'Purchased Product A (Beautiful Homes) plan',
    userId: 'usr_demo',
    userPhone: '+91 9876543210'
  },
  {
    id: 'tx_init_4',
    type: 'commission',
    amount: 103,
    date: '2026-07-12 14:22:11',
    status: 'success',
    description: 'Lvl 1 Commission from Sandeep Kumar (10% standard reward)',
    userId: 'usr_demo',
    userPhone: '+91 9876543210'
  }
];

export const QUICK_MOCK_NAMES = [
  'Amit', 'Rahul', 'Rohan', 'Satish', 'Vivek', 'Manish', 'Vikram', 'Dinesh', 'Ajay', 'Kamal',
  'Pankaj', 'Sanjay', 'Suraj', 'Arvind', 'Piyush', 'Karan', 'Deepak', 'Nitin', 'Ashok', 'Suresh'
];

export const GENERATE_RANDOM_LIVE_NOTIF = (): string => {
  const name = QUICK_MOCK_NAMES[Math.floor(Math.random() * QUICK_MOCK_NAMES.length)];
  const digits = Math.floor(100 + Math.random() * 900);
  const events = [
    { text: `recharged ₹${[500, 750, 1000, 2200, 4840][Math.floor(Math.random() * 5)]}`, weight: 0.35 },
    { text: `withdrew ₹${[300, 1200, 2500, 4500][Math.floor(Math.random() * 4)]} successfully`, weight: 0.25 },
    { text: `purchased Special Offer Plan & earned ₹4,536 today`, weight: 0.20 },
    { text: `registered a new friend & earned Lvl 1 commission`, weight: 0.20 },
  ];
  
  // pick weighted event
  let r = Math.random();
  let selectedEvent = events[0].text;
  let sum = 0;
  for (const ev of events) {
    sum += ev.weight;
    if (r <= sum) {
      selectedEvent = ev.text;
      break;
    }
  }
  
  return `${name} ***${digits} ${selectedEvent}`;
};
