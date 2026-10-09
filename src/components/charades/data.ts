/**
 * Shared facts for the Charades pages. Deck names, colours and sample cards
 * come straight from the app's bundled decks (byw1/Deckhead: assets/decks).
 */

export const GITHUB_URL = 'https://github.com/byw1/Deckhead'
export const ISSUES_URL = 'https://github.com/byw1/Deckhead/issues'
/** Set once the listing is live; until then the button reads "Coming soon". */
export const APP_STORE_URL: string | null = null
export const SKILL_ZIP = '/charades/charades-deck-maker.zip'

export const INK = '#0A0A0D'

export const palette = {
  yellow: '#FFE500',
  green: '#2EE86F',
  orange: '#FF6B2C',
  blue: '#2EA8FF',
  pink: '#FF3D8B',
  purple: '#9B5CFF',
  red: '#FF3B47',
  teal: '#00C2B2',
  indigo: '#5B5BFF',
  magenta: '#E040FB',
} as const

export type BundledDeck = {
  name: string
  emoji: string
  color: string
  blurb: string
  cards: string[]
}

/** Readable text on a deck colour: ink on the light ones, white on the rest. */
export function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return (1.05) / (l + 0.05) >= (l + 0.05) / 0.05 ? '#FFFFFF' : INK
}

export const DECKS: BundledDeck[] = [
  {
    "name": "2010s Throwback",
    "emoji": "📼",
    "color": "#E040FB",
    "blurb": "Silly Bandz, Club Penguin and Vine. Your childhood, now a party game.",
    "cards": [
      "Vine",
      "Fidget spinner",
      "Silly Bandz",
      "Hoverboard",
      "Selfie stick",
      "iPod Nano",
      "Club Penguin",
      "Webkinz"
    ]
  },
  {
    "name": "Act It Out",
    "emoji": "🎭",
    "color": "#9B5CFF",
    "blurb": "Stepping on a Lego, getting left on read, a mime stuck in a box. No talking, all drama.",
    "cards": [
      "Stepping on a Lego",
      "Parallel parking",
      "Losing your keys",
      "Winning the lottery",
      "Sneezing",
      "Running for a bus",
      "Blowing out candles",
      "Stubbing your toe"
    ]
  },
  {
    "name": "Animals",
    "emoji": "🦁",
    "color": "#00C2B2",
    "blurb": "Capybaras, angry geese and everything in between. Flapping, honking and crawling strongly encouraged.",
    "cards": [
      "Capybara",
      "Elephant",
      "Penguin",
      "Octopus",
      "Kangaroo",
      "Sloth",
      "Flamingo",
      "Hedgehog"
    ]
  },
  {
    "name": "Anime & Gaming",
    "emoji": "🎮",
    "color": "#FF3B47",
    "blurb": "Shonen heroes, Nintendo royalty and the games that ate your weekends.",
    "cards": [
      "Pikachu",
      "Naruto",
      "Goku",
      "One Piece",
      "Attack on Titan",
      "Studio Ghibli",
      "My Neighbor Totoro",
      "Sailor Moon"
    ]
  },
  {
    "name": "Home Sweet Home",
    "emoji": "🏠",
    "color": "#2EA8FF",
    "blurb": "Air fryers, ring lights, Stanley cups and the junk drawer. Ordinary stuff is weirdly hard to describe.",
    "cards": [
      "Air fryer",
      "Kettle",
      "Doorbell",
      "Colander",
      "Hairdryer",
      "Doormat",
      "Coat hanger",
      "Ironing board"
    ]
  },
  {
    "name": "Celebrities",
    "emoji": "⭐",
    "color": "#9B5CFF",
    "blurb": "Movie stars, comedians, creators and icons. Do the impression; everyone will know.",
    "cards": [
      "Zendaya",
      "Timothée Chalamet",
      "Tom Holland",
      "Margot Robbie",
      "Ryan Gosling",
      "Ryan Reynolds",
      "Dwayne Johnson",
      "Kevin Hart"
    ]
  },
  {
    "name": "College Life",
    "emoji": "🎓",
    "color": "#FFE500",
    "blurb": "Dorms, deadlines and the dining hall. Everyone has a story for at least half of these.",
    "cards": [
      "Dorm room",
      "Roommate",
      "All-nighter",
      "Group project",
      "Ramen noodles",
      "Dining hall",
      "Office hours",
      "Syllabus"
    ]
  },
  {
    "name": "Emoji Charades",
    "emoji": "😜",
    "color": "#5B5BFF",
    "blurb": "Movies, songs, holidays and sayings in emoji. The room acts out the emoji, no talking; the answer sits under them for the room.",
    "cards": [
      "🦁👑",
      "🕷️👨",
      "❄️👸",
      "🦈🏖️",
      "🚢🧊💔",
      "🧙‍♂️⚡👓",
      "🦖🏝️",
      "🐠🔍"
    ]
  },
  {
    "name": "Movie Night",
    "emoji": "🍿",
    "color": "#FF3D8B",
    "blurb": "Blockbusters, Pixar, rom-coms and the ones everyone quotes. If you haven’t seen it, you’ve seen the memes.",
    "cards": [
      "Barbie",
      "Jurassic Park",
      "The Lion King",
      "Titanic",
      "Jaws",
      "Star Wars",
      "The Matrix",
      "Forrest Gump"
    ]
  },
  {
    "name": "Food & Drink",
    "emoji": "🍕",
    "color": "#FF3B47",
    "blurb": "Birria tacos, Dubai chocolate, hot honey and the classics. Do not play this one hungry.",
    "cards": [
      "Pizza",
      "Spaghetti",
      "Avocado",
      "Pancakes",
      "Sushi",
      "Garlic bread",
      "Cheeseburger",
      "Popcorn"
    ]
  },
  {
    "name": "Gen Z Slang",
    "emoji": "💅",
    "color": "#E040FB",
    "blurb": "Explain it without saying it. Harder than it sounds, and the older people in the room are in trouble.",
    "cards": [
      "Rizz",
      "No cap",
      "Bussin",
      "Slay",
      "It's giving",
      "Delulu",
      "Main character",
      "NPC"
    ]
  },
  {
    "name": "Music Icons",
    "emoji": "🎤",
    "color": "#00C2B2",
    "blurb": "Pop stars, rappers and legends. Humming is allowed. Singing the chorus is cheating, but everyone does it.",
    "cards": [
      "Taylor Swift",
      "Beyoncé",
      "Drake",
      "Bad Bunny",
      "Billie Eilish",
      "Harry Styles",
      "Ariana Grande",
      "Olivia Rodrigo"
    ]
  },
  {
    "name": "Movie & TV Quotes",
    "emoji": "💬",
    "color": "#E040FB",
    "blurb": "Say it like they said it. The room acts out the line, the guesser shouts it back. Accents encouraged.",
    "cards": [
      "May the Force be with you",
      "I'll be back",
      "You can't handle the truth!",
      "Here's Johnny!",
      "Houston, we have a problem",
      "I'm the king of the world!",
      "Life is like a box of chocolates",
      "Just keep swimming"
    ]
  },
  {
    "name": "Reality TV",
    "emoji": "🌹",
    "color": "#FF3D8B",
    "blurb": "Villas, tribes, bake-offs and reunions. Somebody in the room has watched all of these.",
    "cards": [
      "Survivor",
      "Big Brother",
      "The Bachelor",
      "Love Island",
      "Keeping Up with the Kardashians",
      "The Great British Bake Off",
      "Shark Tank",
      "American Idol"
    ]
  },
  {
    "name": "Snacks & Fast Food",
    "emoji": "🍟",
    "color": "#FFE500",
    "blurb": "Gas station runs, drive-thru orders and the snacks you buy for the group.",
    "cards": [
      "Takis",
      "Flamin' Hot Cheetos",
      "Doritos",
      "Oreos",
      "Pringles",
      "Goldfish",
      "Pop-Tarts",
      "Lunchables"
    ]
  },
  {
    "name": "Sports",
    "emoji": "🏀",
    "color": "#2EA8FF",
    "blurb": "Legends, superstars and the moments everyone acts out. Slam dunks, hat tricks and the Gatorade shower.",
    "cards": [
      "Slam dunk",
      "LeBron James",
      "Michael Jordan",
      "Stephen Curry",
      "Kobe Bryant",
      "Shaquille O’Neal",
      "Serena Williams",
      "Simone Biles"
    ]
  },
  {
    "name": "Viral Internet",
    "emoji": "📱",
    "color": "#5B5BFF",
    "blurb": "Memes, challenges and the videos everyone sent to the group chat.",
    "cards": [
      "Rickroll",
      "Distracted boyfriend",
      "Ice Bucket Challenge",
      "Mannequin Challenge",
      "Harlem Shake",
      "Gangnam Style",
      "Planking",
      "Dab"
    ]
  }
]
