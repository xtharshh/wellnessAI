import { getWellnessSummary } from '@/src/services/wellness';
import { Recommendation } from '@/src/types/wellness';
import { saveAISuggestedExercises } from '@/src/services/exercises';
import { apiFetch } from '@/src/services/apiClient';

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  void userId;
  try {
    const data = await apiFetch<{ recommendations: Recommendation[] }>('/api/recommendations');
    return data.recommendations || [];
  } catch (e) {
    console.error('Failed to fetch recommendations:', e);
    return [];
  }
}

export async function generateRecommendations(userId: string, forceOpenAI: boolean = false): Promise<Recommendation[]> {
  const summary = await getWellnessSummary(userId);
  const existingRecs = await getRecommendations(userId);

  // REAL-ONLY: no history yet -> no fabricated recs. Return existing (likely empty).
  if (!summary) return existingRecs;

  try {
    const data = await apiFetch<{ recommendations: Recommendation[] }>('/api/recommendations/generate', {
      method: 'POST',
      body: { forceOpenAI },
    });
    const recs = data.recommendations || [];

    // Mirror AI exercises into the Exercises Library (server also guards).
    try {
      await saveAISuggestedExercises(userId, recs);
    } catch (saveErr) {
      console.error('Failed to save suggested exercises to library:', saveErr);
    }

    return recs;
  } catch (e) {
    console.error('Failed to generate recommendations:', e);
    return existingRecs;
  }
}

export async function dismissRecommendation(userId: string, id: string): Promise<void> {
  void userId;
  try {
    await apiFetch(`/api/recommendations/${id}`, { method: 'PATCH', body: { dismissed: true } });
  } catch (e) {
    console.error('Failed to dismiss recommendation:', e);
  }
}

export async function completeRecommendation(userId: string, id: string): Promise<void> {
  void userId;
  try {
    await apiFetch(`/api/recommendations/${id}`, { method: 'PATCH', body: { completed: true } });
  } catch (e) {
    console.error('Failed to complete recommendation:', e);
  }
}

export interface LifestyleItem {
  id: string;
  title: string;
  creator: string;
  category: 'books' | 'movies' | 'songs' | 'podcasts' | 'meditation' | 'productivity' | 'stress-relief';
  description: string;
  reason: string;
  imageUrl?: string;
  linkUrl?: string;
}

export async function getLifestyleRecommendations(userId: string): Promise<LifestyleItem[]> {
  const summary = await getWellnessSummary(userId);
  if (!summary) {
    try {
      return await getSavedLifestyleItems(userId);
    } catch {
      return [];
    }
  }
  const stress = summary.stressIndex;
  const mood = summary.moodScore;

  let recs: LifestyleItem[] = [];

  // 1. Books
  if (stress > 55) {
    recs.push({
      id: 'book-1',
      title: 'Burnout: The Secret to Unlocking the Stress Cycle',
      creator: 'Emily Nagoski',
      category: 'books',
      description: 'An essential guide explaining how to complete the stress cycle and release biological tension.',
      reason: `Recommended because your Stress Index is elevated (${stress}%)`,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.goodreads.com/book/show/42927286-burnout'
    });
  } else {
    recs.push({
      id: 'book-2',
      title: 'The Power of Now',
      creator: 'Eckhart Tolle',
      category: 'books',
      description: 'A transformative guide to present-moment awareness, helping quiet anxious thoughts.',
      reason: 'Recommended to help maintain your stable mental state.',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.goodreads.com/book/show/6708.The_Power_of_Now'
    });
  }
  recs.push({
    id: 'book-3',
    title: 'Digital Minimalism',
    creator: 'Cal Newport',
    category: 'books',
    description: 'Practical tactics for setting healthy boundaries with screens and online social spaces.',
    reason: 'Recommended for digital wellbeing support.',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.goodreads.com/book/show/40672036-digital-minimalism'
  });

  // 2. Songs
  if (stress > 50) {
    recs.push({
      id: 'song-1',
      title: 'Weightless',
      creator: 'Marconi Union',
      category: 'songs',
      description: 'An ambient track scientifically shown to reduce overall anxiety levels by 65%.',
      reason: `Recommended to soothe stress indicators (${stress}%)`,
      imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.youtube.com/watch?v=UfcAVejslrU'
    });
    recs.push({
      id: 'song-2',
      title: 'Strawberry Swing',
      creator: 'Coldplay',
      category: 'songs',
      description: 'A relaxing song with a steady, calming tempo perfect for an active break.',
      reason: 'Recommended for a peaceful mental interval.',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.youtube.com/watch?v=h3pJZSTQqIg'
    });
  } else {
    recs.push({
      id: 'song-3',
      title: 'Lovely Day',
      creator: 'Bill Withers',
      category: 'songs',
      description: 'An upbeat, soul-warming classic designed to lift your emotional wellness.',
      reason: `Recommended to boost your Mood Score (${mood}%)`,
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.youtube.com/watch?v=sYi7uEvEEmk'
    });
  }

  // 3. Movies
  if (stress > 50) {
    recs.push({
      id: 'movie-1',
      title: 'Amélie',
      creator: 'Jean-Pierre Jeunet',
      category: 'movies',
      description: 'A whimsical, lighthearted journey that instills immediate joy and calm.',
      reason: 'Recommended for light stress relief.',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.imdb.com/title/tt0211915/'
    });
  } else {
    recs.push({
      id: 'movie-2',
      title: 'Soul',
      creator: 'Pixar',
      category: 'movies',
      description: 'A beautiful animated story about finding purpose in the simple, quiet moments of life.',
      reason: 'Recommended to support healthy reflection.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.imdb.com/title/tt2948356/'
    });
  }

  // 4. Podcasts
  recs.push({
    id: 'pod-1',
    title: 'The Mindful Kind',
    creator: 'Rachael Kable',
    category: 'podcasts',
    description: 'Bite-sized episodes sharing practical, realistic advice on incorporating mindfulness into a busy day.',
    reason: 'Recommended for convenient wellness guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://open.spotify.com/show/47n6K0PzV1lK9q3n8J1y3X'
  });
  if (summary.sleepHours < 7) {
    recs.push({
      id: 'pod-2',
      title: 'Sleep With Me',
      creator: 'Drew Ackerman',
      category: 'podcasts',
      description: 'Dull, boring stories designed to quiet an overactive mind and ease you gently into deep rest.',
      reason: `Recommended since your sleep duration is low (${summary.sleepHours} hrs)`,
      imageUrl: 'https://images.unsplash.com/photo-1520206183501-b80af970d040?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://open.spotify.com/show/6asx12fPx4uwyljOLj77Cz'
    });
  }

  // 5. Meditation
  recs.push({
    id: 'med-1',
    title: '5-Minute Box Breathing Session',
    creator: 'MindTrace Coaches',
    category: 'meditation',
    description: 'Autonomic nervous system reset utilizing a 4-4-4-4 breathing cadence to suppress cortisol.',
    reason: `Recommended to balance your Stress Index (${stress}%)`,
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.youtube.com/watch?v=tEmt1FnA59k'
  });
  recs.push({
    id: 'med-2',
    title: 'Deep Body Scan',
    creator: 'MindTrace Coaches',
    category: 'meditation',
    description: 'A guided relaxation practice focusing on releasing localized tension from the forehead to the feet.',
    reason: 'Recommended to release physical tension.',
    imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.youtube.com/watch?v=15q-yMcKu_4'
  });

  // 6. Productivity & Stress Relief Activities
  recs.push({
    id: 'prod-1',
    title: 'Pomodoro Screen-Off Break',
    creator: 'MindTrace Habits',
    category: 'productivity',
    description: 'Close your eyes and turn away from all light-emitting displays for 5 minutes after 25 minutes of focus.',
    reason: 'Recommended to lower eye strain indices.',
    imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://en.wikipedia.org/wiki/Pomodoro_Technique'
  });
  recs.push({
    id: 'stress-1',
    title: 'Vagus Nerve Cold Water Splash',
    creator: 'MindTrace Habits',
    category: 'stress-relief',
    description: 'Splash cold water onto your face or hold an ice pack on your chest for 15 seconds to lower heart rate.',
    reason: `Recommended to decrease active anxiety triggers (${stress}%)`,
    imageUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.psychologytoday.com/us/blog/the-athletes-way/201905/vagus-nerve-stimulation-without-implants'
  });

  // Fetch and merge saved lifestyle items
  try {
    const savedItems = await getSavedLifestyleItems(userId);
    const existingTitles = new Set(recs.map((r) => r.title.toLowerCase().trim()));
    const newSavedItems = savedItems.filter((item) => !existingTitles.has(item.title.toLowerCase().trim()));
    recs = [...newSavedItems, ...recs];
  } catch (err) {
    console.error('Failed to fetch saved lifestyle items:', err);
  }

  return recs;
}

export async function getSavedLifestyleItems(userId: string): Promise<LifestyleItem[]> {
  void userId;
  try {
    const data = await apiFetch<{ items: LifestyleItem[] }>('/api/lifestyle');
    return data.items || [];
  } catch (e) {
    console.error('Failed to fetch saved lifestyle items:', e);
    return [];
  }
}

export async function saveAISuggestedLifestyleItems(userId: string, items: LifestyleItem[]): Promise<void> {
  void userId;
  if (items.length === 0) return;
  try {
    await apiFetch('/api/lifestyle', { method: 'POST', body: { items } });
  } catch (e) {
    console.error('Failed to save AI-suggested lifestyle items:', e);
  }
}
