/**
 * William's desk, item by item. This is the one file to edit for the /setup
 * page: the 3-D room places a hotspot for every id below, and the list under
 * it renders these entries in order.
 *
 * Affiliate links: set `buyUrl` on an item and a "Buy" button appears on its
 * card (and in the room's label). Leave it empty and the button stays hidden.
 */
export interface GearItem {
  id: GearId
  name: string
  maker: string
  category: 'Display' | 'Computer' | 'Input' | 'Audio' | 'Seating'
  /** The specific configuration William owns. */
  spec: string
  /** Why it's on the desk, in his words. */
  note: string
  buyUrl?: string
}

export type GearId =
  | 'monitors'
  | 'macbook'
  | 'keyboard'
  | 'mouse'
  | 'streamdeck'
  | 'mic'
  | 'speakers'
  | 'airpods'
  | 'chair'

export const GEAR: GearItem[] = [
  {
    id: 'monitors',
    name: '32" 4K Monitors',
    maker: 'Dell',
    category: 'Display',
    spec: 'Two of them, side by side — 4K, ~32 inch',
    note: 'two big 4k panels is the biggest upgrade you can make. one for the work, one for everything else.',
    buyUrl: '',
  },
  {
    id: 'macbook',
    name: 'MacBook Pro 14"',
    maker: 'Apple',
    category: 'Computer',
    spec: 'M4 · 24 GB RAM · bought in 2024',
    note: 'drives both monitors without breaking a sweat and still goes everywhere with me.',
    buyUrl: '',
  },
  {
    id: 'keyboard',
    name: 'MX Keys',
    maker: 'Logitech',
    category: 'Input',
    spec: 'Full-size, backlit, multi-device',
    note: 'quiet, low-profile, and it hops between machines with one key.',
    buyUrl: '',
  },
  {
    id: 'mouse',
    name: 'MX Master 3S',
    maker: 'Logitech',
    category: 'Input',
    spec: 'Silent clicks · MagSpeed scroll wheel',
    note: 'the free-spinning scroll wheel ruins every other mouse for you.',
    buyUrl: '',
  },
  {
    id: 'streamdeck',
    name: 'Stream Deck',
    maker: 'Elgato',
    category: 'Input',
    spec: '15-key',
    note: 'fifteen buttons for the things i do fifty times a day.',
    buyUrl: '',
  },
  {
    id: 'mic',
    name: 'Yeti',
    maker: 'Blue',
    category: 'Audio',
    spec: 'USB condenser microphone',
    note: 'plug it in and you sound like you mean it on every call.',
    buyUrl: '',
  },
  {
    id: 'speakers',
    name: 'Z333 Speakers',
    maker: 'Logitech',
    category: 'Audio',
    spec: '2.1 — two satellites plus a subwoofer',
    note: 'real bass for not much money. the sub lives under the desk.',
    buyUrl: '',
  },
  {
    id: 'airpods',
    name: 'AirPods Pro',
    maker: 'Apple',
    category: 'Audio',
    spec: 'Latest generation — two pairs',
    note: 'two pairs on rotation: when one dies, the other is already charged. never not on a call.',
    buyUrl: '',
  },
  {
    id: 'chair',
    name: 'Leap V2',
    maker: 'Steelcase · refurbished by Madison Seating',
    category: 'Seating',
    spec: 'Refurbished Steelcase Leap V2',
    note: 'literally the best chair in the game. buy it refurbished and keep the difference.',
    buyUrl: '',
  },
]
