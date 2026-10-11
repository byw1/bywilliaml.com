/**
 * Shared facts for the Imposter pages. Topic names, colours and sample words
 * come straight from the app's bundled topics (byw1/imposter: src/topics/bundled.ts),
 * and the colours from its design tokens (src/ui/tokens.ts).
 */

export const GITHUB_URL = 'https://github.com/byw1/imposter'
export const ISSUES_URL = 'https://github.com/byw1/imposter/issues'
/** Set once the listing is live; until then the button reads "Coming to iPhone". */
export const APP_STORE_URL: string | null = null
/** A public TestFlight link, once there is one. */
export const BETA_URL: string | null = null

export const INK = '#0C0A10'

export const palette = {
  lime: '#C8FF2E',
  red: '#FF4560',
  blue: '#2EA8FF',
  purple: '#9B5CFF',
  teal: '#00C2B2',
  yellow: '#FFE500',
  orange: '#FF6B2C',
  indigo: '#5B5BFF',
  magenta: '#E040FB',
} as const

export type BundledTopic = {
  name: string
  emoji: string
  color: string
  /** The first few of the topic's fifty words. */
  words: string[]
}

/** Text on a topic colour: ink on all of them except indigo, as in the app. */
export function textOn(hex: string): string {
  return hex.toUpperCase() === palette.indigo ? '#FFFFFF' : INK
}

export const TOPICS: BundledTopic[] = [
  {
    "name": "Food",
    "emoji": "🍕",
    "color": "#FF6B2C",
    "words": [
      "Pizza",
      "Sushi",
      "Tacos",
      "Pancakes",
      "Spaghetti",
      "Burger",
      "Popcorn",
      "Ice cream",
      "Donut",
      "Curry"
    ]
  },
  {
    "name": "Animals",
    "emoji": "🦁",
    "color": "#00C2B2",
    "words": [
      "Lion",
      "Penguin",
      "Elephant",
      "Giraffe",
      "Shark",
      "Octopus",
      "Kangaroo",
      "Owl",
      "Dolphin",
      "Panda"
    ]
  },
  {
    "name": "Places",
    "emoji": "🏝️",
    "color": "#5B5BFF",
    "words": [
      "Beach",
      "Airport",
      "Hospital",
      "Library",
      "Zoo",
      "Gym",
      "Casino",
      "Museum",
      "Cinema",
      "Supermarket"
    ]
  },
  {
    "name": "Jobs",
    "emoji": "🧑‍🚒",
    "color": "#FFE500",
    "words": [
      "Firefighter",
      "Teacher",
      "Doctor",
      "Chef",
      "Pilot",
      "Astronaut",
      "Plumber",
      "Lawyer",
      "Dentist",
      "Farmer"
    ]
  },
  {
    "name": "Movies & TV",
    "emoji": "🎬",
    "color": "#9B5CFF",
    "words": [
      "Titanic",
      "Frozen",
      "Shrek",
      "Jaws",
      "Star Wars",
      "Harry Potter",
      "The Lion King",
      "Toy Story",
      "Jurassic Park",
      "Finding Nemo"
    ]
  },
  {
    "name": "Sports",
    "emoji": "⚽",
    "color": "#E040FB",
    "words": [
      "Soccer",
      "Basketball",
      "Tennis",
      "Golf",
      "Swimming",
      "Boxing",
      "Surfing",
      "Skiing",
      "Baseball",
      "Bowling"
    ]
  },
  {
    "name": "Around the house",
    "emoji": "🛋️",
    "color": "#00C2B2",
    "words": [
      "Toaster",
      "Couch",
      "Bathtub",
      "Fridge",
      "Microwave",
      "Pillow",
      "Toothbrush",
      "Vacuum",
      "Mirror",
      "Lamp"
    ]
  },
  {
    "name": "Music",
    "emoji": "🎸",
    "color": "#9B5CFF",
    "words": [
      "Guitar",
      "Piano",
      "Drums",
      "Violin",
      "Trumpet",
      "Saxophone",
      "Microphone",
      "Karaoke",
      "Concert",
      "Choir"
    ]
  },
  {
    "name": "Party",
    "emoji": "🎉",
    "color": "#E040FB",
    "words": [
      "Balloon",
      "Birthday cake",
      "Piñata",
      "Confetti",
      "Costume",
      "Dance floor",
      "Party hat",
      "Sleepover",
      "Karaoke night",
      "Surprise party"
    ]
  },
  {
    "name": "Fantasy",
    "emoji": "🐉",
    "color": "#5B5BFF",
    "words": [
      "Dragon",
      "Unicorn",
      "Wizard",
      "Mermaid",
      "Vampire",
      "Werewolf",
      "Ghost",
      "Zombie",
      "Fairy",
      "Troll"
    ]
  },
  {
    "name": "School",
    "emoji": "🎒",
    "color": "#FFE500",
    "words": [
      "Homework",
      "Recess",
      "Detention",
      "Lunchbox",
      "Backpack",
      "Pop quiz",
      "Field trip",
      "Yearbook",
      "Graduation",
      "Locker"
    ]
  },
  {
    "name": "Travel",
    "emoji": "✈️",
    "color": "#FF6B2C",
    "words": [
      "Passport",
      "Suitcase",
      "Road trip",
      "Jet lag",
      "Souvenir",
      "Postcard",
      "Map",
      "Tent",
      "Motel",
      "Hostel"
    ]
  }
]
