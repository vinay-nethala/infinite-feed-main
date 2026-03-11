// Deterministic pseudo-random generator (mulberry32)
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOTAL_POSTS = 1_000_000;
const FIRST_NAMES = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte', 'James', 'Amelia', 'Aiden', 'Harper', 'Elijah', 'Evelyn', 'Benjamin'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const SENTENCES = [
  'Just had the most amazing coffee this morning ☕',
  'Anyone else watching the sunset right now? Absolutely breathtaking 🌅',
  'Working on a new project and I cannot wait to share it with everyone!',
  'Hot take: pineapple belongs on pizza. Fight me.',
  'Spent the whole day coding and finally fixed that bug that was driving me crazy 🎉',
  'The weather today is perfect for a long walk in the park.',
  'Just finished reading an incredible book. Highly recommend it!',
  'Who else thinks that Mondays should be optional? 😂',
  'Made homemade pasta for the first time and it actually turned out great!',
  'Thinking about starting a podcast. Would anyone listen?',
  'The new season of my favorite show just dropped and I have zero self-control.',
  'Grateful for all the amazing people in my life. You know who you are ❤️',
  'Just adopted a puppy and my heart is so full right now 🐶',
  'Unpopular opinion: winter is the best season.',
  'Learning a new programming language is both exciting and terrifying.',
  'Can we normalize taking mental health days? Seriously.',
  'That awkward moment when you wave back at someone who wasn\'t waving at you.',
  'Finally tried that restaurant everyone\'s been talking about. Worth the hype!',
  'Sometimes you just need to turn off your phone and enjoy the silence.',
  'My plants are thriving and I feel like a proud parent 🌱',
];

const MEDIA_TYPES: Array<'image' | 'video' | 'link' | 'none'> = ['image', 'video', 'link', 'none'];

export interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  media: {
    type: 'image' | 'video' | 'link' | 'none';
    urls: string[];
  };
  likes: number;
  comments: number;
  shares: number;
}

function generatePost(id: number): Post {
  const rng = mulberry32(id * 7919);
  const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];

  // Generate 1-4 sentences
  const sentenceCount = 1 + Math.floor(rng() * 4);
  const content = Array.from({ length: sentenceCount }, () =>
    SENTENCES[Math.floor(rng() * SENTENCES.length)]
  ).join(' ');

  const mediaRoll = rng();
  let mediaType: 'image' | 'video' | 'link' | 'none';
  if (mediaRoll < 0.35) mediaType = 'image';
  else if (mediaRoll < 0.45) mediaType = 'video';
  else if (mediaRoll < 0.55) mediaType = 'link';
  else mediaType = 'none';

  const urls: string[] = [];
  if (mediaType === 'image') {
    const imgCount = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < imgCount; i++) {
      const w = 400 + Math.floor(rng() * 200);
      const h = 300 + Math.floor(rng() * 200);
      urls.push(`https://picsum.photos/seed/${id}-${i}/${w}/${h}`);
    }
  } else if (mediaType === 'video') {
    urls.push(`https://picsum.photos/seed/${id}/640/360`);
  } else if (mediaType === 'link') {
    urls.push(`https://example.com/article/${id}`);
  }

  const daysAgo = Math.floor(rng() * 365);
  const hoursAgo = Math.floor(rng() * 24);
  const date = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);

  return {
    id,
    author: `${firstName} ${lastName}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    content,
    timestamp: date.toISOString(),
    media: { type: mediaType, urls },
    likes: Math.floor(rng() * 5000),
    comments: Math.floor(rng() * 500),
    shares: Math.floor(rng() * 200),
  };
}

interface ApiResponse {
  data: Post[];
  nextCursor: number | null;
}

interface LastApiRequest {
  type: 'fetch-next' | 'fetch-previous';
  cursor: number | null;
  limit: number;
}

let lastApiRequest: LastApiRequest | null = null;

export function getLastApiRequest() {
  return lastApiRequest;
}

export async function fetchPosts(limit = 20, cursor?: number): Promise<ApiResponse> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 150 + Math.random() * 200));

  let startId: number;
  let direction: 'forward' | 'backward';

  if (cursor === undefined || cursor === null) {
    // Initial load - start from middle
    startId = Math.floor(TOTAL_POSTS / 2);
    direction = 'forward';
    lastApiRequest = { type: 'fetch-next', cursor: null, limit };
  } else if (cursor < 0) {
    // Scrolling up - fetch older (lower ID) posts
    startId = Math.abs(cursor) - 1;
    direction = 'backward';
    lastApiRequest = { type: 'fetch-previous', cursor, limit };
  } else {
    // Scrolling down - fetch newer (higher ID) posts
    startId = cursor;
    direction = 'forward';
    lastApiRequest = { type: 'fetch-next', cursor, limit };
  }

  const posts: Post[] = [];

  if (direction === 'forward') {
    for (let i = 0; i < limit && startId + i < TOTAL_POSTS; i++) {
      posts.push(generatePost(startId + i));
    }
    const lastId = posts.length > 0 ? posts[posts.length - 1].id + 1 : null;
    const nextCursor = lastId !== null && lastId < TOTAL_POSTS ? lastId : null;
    return { data: posts, nextCursor };
  } else {
    for (let i = 0; i < limit && startId - i >= 0; i++) {
      posts.push(generatePost(startId - i));
    }
    posts.reverse();
    const firstId = posts.length > 0 ? posts[0].id : null;
    const nextCursor = firstId !== null && firstId > 0 ? -(firstId) : null;
    return { data: posts, nextCursor };
  }
}

// Expose on window for testing
if (typeof window !== 'undefined') {
  (window as any).getLastApiRequest = getLastApiRequest;
}
