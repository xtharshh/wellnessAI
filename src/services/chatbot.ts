export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface MusicSuggestion {
  title: string;
  creator: string;
  description: string;
  linkUrl: string;
}

// ─── System Prompt (used only for complex OpenAI calls) ──────────────
const SYSTEM_PROMPT = `You are MindTrace AI, a compassionate, professional mental wellness companion embedded inside a mobile wellness app called "WellnessAI". You passively observe digital wellness signals (screen time, typing dynamics, sleep patterns, activity levels) to support users' mental wellbeing.

Your personality:
- Warm, empathetic, and non-judgmental
- Professional but approachable — like a supportive therapist friend
- You give concise, actionable advice (keep responses under 150 words)
- You reference the app's features when relevant: Breathwork Timer, Journal, Activity tracking, Sleep tracking
- You use gentle encouragement and validate feelings before offering suggestions
- Always suggest a specific exercise or wellness activity the user can do right now

Important rules:
1. You are NOT a licensed medical professional. Always include a brief disclaimer when discussing serious mental health topics.
2. If someone mentions suicide, self-harm, or severe crisis, immediately provide crisis resources (988 Lifeline, Crisis Text Line 741741) and encourage them to seek professional help.
3. Never diagnose conditions. Use language like "it sounds like" or "you might be experiencing".
4. Keep responses concise and mobile-friendly — use short paragraphs and bullet points.
5. When suggesting actions, reference specific app features (e.g., "Try the Breathwork Timer on your dashboard" or "Log this in your Journal tab").
6. Be culturally sensitive and inclusive.
7. Always include at least one exercise or activity suggestion, even when the user feels good.`;

// ─── OpenAI API Call (only for complex messages) ─────────────────────
async function callOpenAI(
  userMessage: string,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey =
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  if (!apiKey) {
    console.warn('[Chatbot] No OPENAI_API_KEY found. Using local fallback.');
    return null;
  }

  // Build conversation history for context (last 10 messages max)
  const recentHistory = history.slice(-10);
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  for (const msg of recentHistory) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`[Chatbot] OpenAI API error ${response.status} — using fallback response`);
      return null;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return null;
    }

    return reply.trim();
  } catch (error) {
    return null;
  }
}

// ─── Music Suggestions Pool ────────────────────────────────────
const MUSIC_SUGGESTIONS: MusicSuggestion[] = [
  {
    title: 'Weightless',
    creator: 'Marconi Union',
    description: 'An ambient track scientifically shown to reduce anxiety levels by 65%.',
    linkUrl: 'https://www.youtube.com/watch?v=UfcAVejslrU',
  },
  {
    title: 'Strawberry Swing',
    creator: 'Coldplay',
    description: 'A relaxing song with a steady, calming tempo perfect for an active break.',
    linkUrl: 'https://www.youtube.com/watch?v=h3pJZSTQqIg',
  },
  {
    title: 'Lovely Day',
    creator: 'Bill Withers',
    description: 'An upbeat, soul-warming classic designed to lift your emotional wellness.',
    linkUrl: 'https://www.youtube.com/watch?v=sYi7uEvEEmk',
  },
  {
    title: 'Sunrise',
    creator: 'Coastal Sounds',
    description: 'Gentle ocean waves with soft instrumental layers for meditation and focus.',
    linkUrl: 'https://www.youtube.com/watch?v=jEf4KPjHVvg',
  },
  {
    title: 'Breathe',
    creator: 'The Score',
    description: 'Cinematic, uplifting instrumental music to inspire motivation and creativity.',
    linkUrl: 'https://www.youtube.com/watch?v=8e7r1eZkxRY',
  },
];

// ─── Predefined Keyword Dictionary ──────────────────────────────────
// Both POSITIVE and NEGATIVE emotions are handled locally to save tokens.

const KEYWORDS: Record<string, string[]> = {
  // ── Positive emotions ──
  feeling_good: [
    'feeling good', 'feel good', 'i am good', "i'm good", 'doing good', 'doing great',
    'feeling great', 'feel great', 'feeling fine', 'feel fine', 'feeling okay', 'feeling well',
    'i am fine', "i'm fine", 'i am well', 'all good', 'pretty good', 'really good',
    'feeling better', 'feel better', 'much better', 'i am better', "i'm better",
  ],
  happy: [
    'happy', 'joyful', 'excited', 'thrilled', 'ecstatic', 'cheerful', 'delighted',
    'wonderful', 'amazing day', 'great day', 'fantastic', 'awesome', 'blessed', 'smile',
    'laughing', 'love life', 'feeling alive', 'on top of the world',
  ],
  energetic: [
    'energetic', 'energized', 'pumped', 'motivated', 'productive', 'focused',
    'full of energy', 'ready to go', 'fired up', 'charged up', 'power mode',
    'on fire', 'in the zone', 'hyped', 'feeling strong',
  ],
  grateful: [
    'grateful', 'thankful', 'appreciate', 'blessed', 'gratitude', 'thank you',
    'thanks', 'lucky', 'fortunate', 'content', 'at peace', 'peaceful',
  ],
  relaxed: [
    'relaxed', 'calm', 'chill', 'serene', 'rested', 'recharged', 'refreshed',
    'tranquil', 'peaceful', 'zen', 'mindful', 'meditated', 'slept well',
    'good sleep', 'well rested', 'woke up fresh',
  ],
  accomplished: [
    'accomplished', 'achieved', 'completed', 'finished', 'succeeded', 'proud',
    'did it', 'nailed it', 'crushed it', 'made progress', 'milestone', 'breakthrough',
    'leveled up', 'workout done', 'exercised today',
  ],

  // ── Negative emotions ──
  sadness: [
    'sad', 'unhappy', 'cry', 'depressed', 'down', 'gloomy', 'heartbroken',
    'miserable', 'not feeling good', 'bad day', 'feel bad', 'feeling bad',
    'feeling low', 'feel low', 'not okay', 'not great', 'terrible',
  ],
  stress: [
    'stressed', 'pressure', 'exhausted', 'tired', 'heavy', 'overwhelmed',
    'burnout', 'mentally exhausted', 'drained', 'busy', 'overworked',
    'cant take it', 'too much',
  ],
  anxiety: [
    'anxious', 'panic', 'worry', 'afraid', 'nervous', 'scared', 'shaking',
    'uneasy', 'fear', 'tension', 'panic attack', 'heart racing',
  ],
  anger: [
    'angry', 'hate', 'mad', 'pissed', 'annoyed', 'frustrated', 'irritated',
    'hate everything', 'rage', 'furious',
  ],
  loneliness: [
    'lonely', 'alone', 'isolated', 'nobody', 'ignored', 'forgotten', 'no one',
    'no friends', 'left out',
  ],
  negative_thinking: [
    'fail', 'useless', 'pointless', 'give up', 'nothing works', 'hopeless',
    'stuck', 'worthless', 'cant do anything', 'not good enough',
  ],
  low_motivation: [
    'lazy', 'bored', 'unmotivated', 'no drive', 'cant focus', 'slump',
    'procrastinating', 'no energy', 'dont feel like',
  ],

  // ── Health / physical ──
  sleep_issues: [
    'cant sleep', 'insomnia', 'sleep problem', 'not sleeping', 'sleep badly',
    'waking up tired', 'restless', 'nightmares', 'tossing and turning',
    'sleep deprived', 'no sleep',
  ],
  headache: [
    'headache', 'migraine', 'head hurts', 'head pain', 'head is pounding',
    'throbbing head',
  ],
  healthy_habits: [
    'healthy habits', 'wellness tips', 'stay healthy', 'be healthier',
    'improve health', 'self care', 'self-care', 'healthy routine',
    'morning routine', 'evening routine', 'daily routine',
  ],
  music_request: [
    'suggest music', 'suggest a song', 'recommend music', 'recommend a song',
    'play something', 'music suggestion', 'something to listen to',
    'suggest a playlist', 'what should i listen to',
  ],
};

// ─── Predefined Response Library ────────────────────────────────────
interface ResponseCategory {
  openers: string[];
  insights: string[];
  exercises: string[];
  closings: string[];
}

const RESPONSES: Record<string, ResponseCategory> = {
  // ════════════════════ POSITIVE CATEGORIES ════════════════════

  feeling_good: {
    openers: [
      "That's wonderful to hear! 🌟 It's great that you're feeling good today. Let's channel that positive energy!",
      "I love hearing that! Feeling good is a sign your wellness habits are paying off. Let's build on that momentum!",
      "Awesome! 💪 Your body and mind are in sync today. Here's how you can make the most of this great energy.",
    ],
    insights: [
      "When we feel good, it's the perfect time to build healthy habits — positive states make new routines stick 3x faster.",
      "Good moods are a great foundation for growth. Research shows that exercising when you feel positive creates stronger habit loops.",
      "Your brain is most receptive to new wellness habits when you're in a positive state — let's use this window!",
    ],
    exercises: [
      "🧘 Gratitude Stretch (5 min):\n• Stand tall, arms overhead — inhale deeply\n• Fold forward slowly — exhale and name one thing you're grateful for\n• Roll up vertebra by vertebra\n• Repeat 5 times, naming a different gratitude each time\n•This pairs physical movement with positive mental framing",
      "🏃 Energy Boost Walk (10 min):\n• Step outside for a brisk 10-minute walk\n• For the first 3 minutes, walk at a comfortable pace\n• Next 4 minutes, increase to a power walk\n• Last 3 minutes, slow down and practice deep breathing\n•Boosts endorphins and locks in your good mood for hours",
      "💪 Desk Power Routine (3 min):\n• 10 desk push-ups (hands on desk edge)\n• 15-second wall sit\n• 10 shoulder blade squeezes\n• 10 standing calf raises\n•Quick burst of movement that amplifies your positive state",
      "🌬️ Energizing Breath (2 min):\n• Try the Breathwork Timer on your dashboard\n• Inhale sharply through nose for 1s, then another quick inhale\n• Slow exhale through mouth for 4s\n• Repeat for 2 minutes\n•This \"physiological sigh\" boosts alertness while maintaining calm",
    ],
    closings: [
      "Log this positive moment in your Journal tab — tracking good days helps you see patterns! What activity would you like to try?",
      "Consider setting a screen break reminder to keep this energy flowing. Would you like to try one of these exercises now?",
      "Your Activity score will thank you! Want me to suggest more exercises tailored to your energy level?",
    ],
  },

  happy: {
    openers: [
      "Your happiness is shining through! 😊 Let's celebrate and channel that joy into something amazing.",
      "What a beautiful state of mind! Happiness is contagious — let's amplify it with some feel-good activities.",
      "I can feel the positivity! 🎉 Let's ride this wave and build some healthy momentum.",
    ],
    insights: [
      "Studies show that pairing exercise with happy moments creates powerful positive associations that last.",
      "Happy moments are when your body produces the most endorphins naturally — adding movement multiplies this effect!",
    ],
    exercises: [
      "🎵 Dance Break (5 min):\n• Put on your favorite upbeat song\n• Dance freely — no rules, just movement\n• Let your body express your joy\n• End with 3 deep, happy breaths\n•Dancing releases serotonin and strengthens the mind-body connection",
      "🌳 Joyful Nature Walk (15 min):\n• Walk to the nearest green space or park\n• Notice 5 beautiful things along the way\n• Take a photo of something that makes you smile\n• Sit for 2 minutes and just absorb the environment\n•Nature exposure when happy creates lasting stress resilience",
      "✍️ Happiness Journaling (5 min):\n• Open your Journal tab and write down:\n  - What made you happy today\n  - One person you're grateful for\n  - One thing you'd like to do more of\n•Writing during positive states reinforces neural pathways for wellbeing",
    ],
    closings: [
      "This is a great day to start a new healthy streak! Check your Activity stats on the dashboard.",
      "Would you like to share this good energy with a breathing session? Try the Breathwork Timer!",
    ],
  },

  energetic: {
    openers: [
      "You're radiating energy! ⚡ That's the perfect state for a productive wellness session.",
      "Love that energy! When you're feeling this fired up, your body can handle more and recover faster.",
      "You're in the zone! 🔥 Let's put that energy to incredible use.",
    ],
    insights: [
      "High energy states are ideal for challenging exercises — your body performs 20-30% better when you're mentally pumped.",
      "Channeling high energy into structured movement prevents it from turning into restlessness later.",
    ],
    exercises: [
      "🔥 HIIT Power Circuit (7 min):\n• 30s jumping jacks → 10s rest\n• 30s high knees → 10s rest\n• 30s burpees → 10s rest\n• 30s mountain climbers → 10s rest\n• 30s squat jumps → 10s rest\n• Repeat once\n•Burns energy productively and builds cardiovascular endurance",
      "💪 Bodyweight Strength (10 min):\n• 15 push-ups (modify as needed)\n• 20 squats\n• 30-second plank\n• 10 lunges per leg\n• 15 tricep dips (using a chair)\n• Rest 30s, repeat 2x\n•Builds strength and converts energy into lasting physical gains",
      "🏃‍♂️ Power Run/Walk (15 min):\n• 2 min warm-up walk\n• 1 min sprint / fast run\n• 1 min recovery walk\n• Repeat sprint-walk 5 times\n• 2 min cool-down walk\n•Interval training maximizes your energy window for peak calorie burn",
    ],
    closings: [
      "Track this workout in your Activity tab — your streak is building! 💪",
      "After your workout, try a cool-down with the Breathwork Timer. Want me to suggest a recovery stretch?",
    ],
  },

  grateful: {
    openers: [
      "Gratitude is one of the most powerful wellness tools. 🙏 Thank you for sharing that feeling.",
      "A grateful heart is a healthy heart! Research shows gratitude literally changes brain chemistry for the better.",
      "What a beautiful mindset. Gratitude practice is linked to better sleep, lower stress, and stronger immunity.",
    ],
    insights: [
      "Gratitude journaling for just 5 minutes a day has been shown to increase happiness by 25% over 10 weeks.",
      "When we practice gratitude, our brain releases dopamine and serotonin — the same chemicals triggered by exercise.",
    ],
    exercises: [
      "📝 Gratitude Body Scan (5 min):\n• Sit comfortably, close your eyes\n• Starting from your toes, slowly scan up your body\n• At each body part, silently thank it for what it does\n• \"Thank you, feet, for carrying me today\"\n• End at the crown of your head with 3 deep breaths\n•Combines mindfulness with gratitude for deep relaxation",
      "🌅 Gratitude Walk (10 min):\n• Walk slowly, indoors or outdoors\n• With each step, name one thing you're grateful for\n• Alternate between big things (health, family) and small things (coffee, sunshine)\n• End by standing still and taking 5 deep breaths\n•Movement + gratitude creates a powerful neurochemical reset",
      "✨ Three Good Things (3 min):\n• Open your Journal tab\n• Write three good things that happened today\n• For each one, write why it happened\n•This exercise rewires your brain to scan for positives instead of threats",
    ],
    closings: [
      "Log your gratitude in the Journal tab — reviewing them later will re-trigger these positive feelings!",
      "Consider making this a daily habit. Would you like me to set a reminder for gratitude journaling?",
    ],
  },

  relaxed: {
    openers: [
      "How lovely that you're feeling relaxed! 🧘 That's your body telling you it's in a healthy recovery state.",
      "Relaxation is underrated! Your nervous system is in 'rest and digest' mode — the perfect state for healing.",
      "That calm feeling is pure gold. ✨ Let's deepen it with some gentle wellness activities.",
    ],
    insights: [
      "A relaxed state is when your body does its best healing — muscles repair, cortisol drops, and creativity peaks.",
      "Gentle movement during relaxed states enhances flexibility and prevents the relaxation from turning into sluggishness.",
    ],
    exercises: [
      "🧘 Gentle Yoga Flow (10 min):\n• Cat-Cow stretches — 5 cycles\n• Child's pose — hold 30s\n• Gentle seated twist — 20s each side\n• Legs up the wall — 2 minutes\n• Savasana (lying down) — 3 minutes\n•Deepens relaxation while maintaining body awareness",
      "🌊 Progressive Muscle Relaxation (5 min):\n• Lie down or sit comfortably\n• Tense your feet for 5s → release and notice the relaxation\n• Move up: calves → thighs → stomach → chest → hands → shoulders → face\n• End with 3 deep breaths\n•Systematically releases tension you didn't know you had",
      "🎧 Mindful Listening (5 min):\n• Put on calming music or nature sounds\n• Close your eyes and focus only on the sounds\n• Notice each instrument, each layer\n• Let thoughts pass without following them\n•Trains attention and deepens your current state of calm",
    ],
    closings: [
      "This is a perfect time to use the Breathwork Timer for a short meditation. Your mind is already primed for it!",
      "Log this peaceful moment in your Journal — you'll want to remember what led to this feeling.",
    ],
  },

  accomplished: {
    openers: [
      "Congratulations! 🏆 That sense of accomplishment is well-deserved. You should be proud!",
      "You did it! 🎉 Celebrating your wins, no matter how small, is crucial for long-term motivation.",
      "Amazing! That feeling of achievement is your brain rewarding you with a dopamine boost. Let's lock it in!",
    ],
    insights: [
      "Celebrating accomplishments activates your brain's reward system, making you more likely to repeat the positive behavior.",
      "Pairing achievement with a reward activity creates powerful motivation loops for future goals.",
    ],
    exercises: [
      "🎯 Victory Stretch (3 min):\n• Stand tall, arms raised in a V shape (power pose)\n• Hold for 30 seconds — smile wide\n• Roll your shoulders back 10 times\n• Side stretch — 15s each side\n• Forward fold — hang for 20s\n•Power posing after wins reinforces confidence and reduces cortisol",
      "📊 Progress Review (5 min):\n• Open your Dashboard and review your wellness scores\n• Note any improvements in Mood, Sleep, Activity, or Stress\n• Write a brief \"win log\" in your Journal tab\n• Set one small goal for tomorrow\n•Tracking progress reinforces the habit loop and builds momentum",
      "🧘 Reward Meditation (5 min):\n• Sit comfortably, close your eyes\n• Replay your accomplishment in your mind with vivid detail\n• Notice how your body feels — the pride, the satisfaction\n• Take 5 deep breaths, savoring the moment\n•Mindful replay strengthens neural pathways associated with success",
    ],
    closings: [
      "Update your Activity tracker and watch your streak grow! What's your next goal?",
      "You're on a roll! Would you like me to suggest a recovery exercise to complement today's win?",
    ],
  },

  // ════════════════════ NEGATIVE CATEGORIES ════════════════════

  sadness: {
    openers: [
      "I'm really sorry to hear you're feeling down. Please remember it's completely okay to not be okay today.",
      "I hear you. Feeling low or sad can feel so heavy to carry. Thank you for sharing this with me.",
      "It sounds like you're going through a rough patch. Let's take a gentle moment to sit with those feelings.",
    ],
    insights: [
      "When we feel down, screen time can sometimes become a passive distraction that drains our remaining energy.",
      "Low mood is often a signal that our mind needs soft, low-stimulation environments to heal and recover.",
    ],
    exercises: [
      "🌸 Gentle Mood Lift Stretch (5 min):\n• Sit or stand comfortably\n• Roll your shoulders slowly — 5 forward, 5 backward\n• Gently tilt your head side to side\n• Place both hands on your heart — breathe deeply 5 times\n• Open your arms wide — hold 10s, then hug yourself\n•Physical self-compassion releases oxytocin and eases emotional pain",
      "✍️ Emotion Release Journal (5 min):\n• Open your Journal tab\n• Write honestly: \"Right now I feel...\" and keep going\n• Don't judge, just let the words flow\n• End by writing one small comfort you can give yourself today\n•Expressive writing reduces the intensity of negative emotions by 40%",
    ],
    closings: [
      "You're not alone in this. Would you like to try the Breathwork Timer for some calming breaths?",
      "Take all the time you need. I'm right here if you want to keep talking. 💜",
    ],
  },

  stress: {
    openers: [
      "I hear you. Dealing with burnout and feeling mentally exhausted is incredibly draining.",
      "It sounds like your mind is running on empty. Stress is a sign that your body is asking for a pause.",
      "Exhaustion can feel overwhelming. Let's take a slow deep breath together and focus on quiet spaces.",
    ],
    insights: [
      "Mental exhaustion happens when our cognitive inputs exceed our resting windows. Screen glare can amplify this.",
      "High stress levels directly impact our focus and physical comfort. Stepping away is actually highly productive.",
    ],
    exercises: [
      "🌬️ Stress Reset Breathing (3 min):\n• Go to the Breathwork Timer on your dashboard\n• Physiological sigh: double inhale through nose, long exhale through mouth\n• Repeat for 3 minutes\n•This is the fastest scientifically-proven way to calm your nervous system",
      "🧊 Cold Reset (2 min):\n• Splash cold water on your face and wrists\n• Hold a cold object (ice cube, cold glass) for 30s\n• Take 5 slow breaths while feeling the cold\n•Cold exposure activates the vagus nerve and instantly reduces stress hormones",
    ],
    closings: [
      "Your body is asking for rest. Consider setting a screen break reminder in settings.",
      "Would you like me to guide you through a quick breathing exercise right now?",
    ],
  },

  anxiety: {
    openers: [
      "I can tell you're feeling anxious right now, and I want you to know you are safe in this present moment.",
      "Anxiety can feel so physical and intense. Let's take a step back together and help ground your body.",
      "It's okay to feel overwhelmed. Your mind is trying to protect you, but we can quiet the alarm.",
    ],
    insights: [
      "Anxiety activates our fight-or-flight response. Physical grounding helps redirect your nervous system back to calm.",
      "The 5-4-3-2-1 technique is one of the most effective grounding tools for acute anxiety.",
    ],
    exercises: [
      "🌍 5-4-3-2-1 Grounding (3 min):\n• Name 5 things you can see\n• Touch 4 things around you\n• Listen for 3 sounds\n• Notice 2 things you can smell\n• Acknowledge 1 thing you can taste\n•Engages all senses to pull your mind back to the present moment",
      "📦 Box Breathing (4 min):\n• Try the Breathwork Timer — select Box Breathing\n• Inhale 4 seconds → Hold 4 seconds → Exhale 4 seconds → Hold 4 seconds\n• Repeat for 4 minutes\n•Used by Navy SEALs to manage high-pressure situations",
    ],
    closings: [
      "You're doing great by reaching out. Want to try the Breathwork Timer together?",
      "Remember: this feeling is temporary. Your body knows how to return to calm. 💙",
    ],
  },

  anger: {
    openers: [
      "I understand that you're feeling frustrated or angry. It is completely valid to feel this way.",
      "It sounds like you're dealing with a lot right now. Let's try to release some of that pressure safely.",
    ],
    insights: [
      "Frustration often builds up when we feel out of control. Physical release helps channel it constructively.",
      "Allowing ourselves to feel anger without judgment is healthy, but structured release prevents it from escalating.",
    ],
    exercises: [
      "💥 Tension Release (3 min):\n• Stand up and shake your whole body vigorously for 30s\n• Punch the air 20 times (alternate fists)\n• Stomp your feet 10 times\n• Then freeze — stand perfectly still for 30s\n• Take 5 slow, deep breaths\n•Physical release followed by stillness teaches your body to transition from activation to calm",
      "🧊 Cool Down Technique (2 min):\n• Splash cold water on your face\n• Hold ice or a cold object in each hand\n• Breathe deeply while counting backward from 20\n•Cold sensations interrupt the anger circuit in your brain",
    ],
    closings: [
      "Log your thoughts in the Journal — writing it out can help release the pressure.",
      "Step away from your screen for a few minutes. Your body will thank you. 🌿",
    ],
  },

  loneliness: {
    openers: [
      "Feeling lonely can make the world feel very distant, but I want you to know you aren't completely alone.",
      "I'm sorry you're feeling lonely. Even in a connected world, isolation can feel very real and heavy.",
    ],
    insights: [
      "Passive scrolling through social media can often exaggerate feelings of isolation or comparison.",
      "Connecting with physical hobbies or stepping into nature can help ground us back in the world.",
    ],
    exercises: [
      "🌳 Connection Walk (10 min):\n• Go for a walk in a public space (park, café area, neighborhood)\n• Make eye contact and smile at 3 people\n• Sit on a bench for 2 minutes and observe life around you\n•Even small social signals reduce loneliness hormones significantly",
      "💌 Reach Out Exercise (5 min):\n• Think of someone you haven't spoken to in a while\n• Send them a simple message: \"Hey, I was thinking of you. How are you?\"\n• While waiting, write in your Journal about what you appreciate about them\n•Taking action against loneliness is the most effective antidote",
    ],
    closings: [
      "I'm here anytime you want to talk. Write your feelings in the Journal tab — it truly helps. 💜",
      "You matter more than you know. Would you like to try a guided breathing session?",
    ],
  },

  negative_thinking: {
    openers: [
      "It's easy to fall into negative thinking loops when we are tired, but your thoughts aren't always facts.",
      "I hear that critical voice speaking, but please try to be gentle with yourself today.",
    ],
    insights: [
      "Negative cognitive distortion is a common response to burnout. It skews how we perceive our daily progress.",
      "Cognitive reframing — actively challenging negative thoughts — can reduce their power within minutes.",
    ],
    exercises: [
      "🔄 Thought Reframe (5 min):\n• Write the negative thought in your Journal\n• Ask: \"Is this 100% true? What evidence contradicts it?\"\n• Write an alternative, balanced thought\n• Read it aloud to yourself\n•This CBT technique physically rewires negative neural pathways",
      "🌟 Micro-Achievement (3 min):\n• Pick the smallest possible task (make your bed, wash a cup, organize one thing)\n• Complete it mindfully and fully\n• Acknowledge: \"I did something. I am capable.\"\n•Completing tiny tasks breaks the cycle of learned helplessness",
    ],
    closings: [
      "One thing that went well today — even tiny. Write it in your Journal. You'll be surprised how it adds up.",
      "Remember: feelings are temporary visitors, not permanent residents. 🌱",
    ],
  },

  low_motivation: {
    openers: [
      "It's completely normal to feel stuck or unmotivated. You don't have to be productive every single day.",
      "When focus is hard to find, it helps to start with the smallest possible step.",
    ],
    insights: [
      "Lacking motivation is often our brain's way of demanding a break from constant digital stimulation.",
      "The '2-minute rule' is powerful: if you can do it in 2 minutes, just start — momentum follows.",
    ],
    exercises: [
      "⏱️ Two-Minute Spark (2 min):\n• Set a timer for exactly 2 minutes\n• Do ONE thing: stretch, tidy your desk, drink water, or just stand up\n• When the timer ends, decide if you want to continue (you usually will!)\n•Starting is always the hardest part — this removes the barrier entirely",
      "🌬️ Energizing Breathwork (3 min):\n• Open the Breathwork Timer on your dashboard\n• Rapid inhale-exhale cycle for 30s\n• Hold breath for 15s\n• Release and breathe normally for 30s\n• Repeat 3 times\n•Controlled hyperventilation safely boosts adrenaline and clears brain fog",
    ],
    closings: [
      "Start with the Breathwork Timer — just one cycle. That's all it takes to shift your state.",
      "Even reading this counts as a step forward! You're doing more than you think. 💪",
    ],
  },

  sleep_issues: {
    openers: [
      "Sleep struggles are tough. When we can't rest properly, everything else feels harder.",
      "I'm sorry you're dealing with sleep issues. Quality sleep is foundational to everything — let's work on it.",
    ],
    insights: [
      "Blue light from screens suppresses melatonin production for up to 2 hours. A digital sunset routine helps enormously.",
      "Your body's sleep drive builds throughout the day — irregular patterns confuse this natural rhythm.",
    ],
    exercises: [
      "🌙 Sleep Prep Routine (10 min before bed):\n• Dim all lights and enable night mode on devices\n• Gentle neck rolls — 5 each direction\n• Legs-up-the-wall pose for 3 minutes\n• 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s (repeat 4x)\n• Put your phone face-down in another room\n•This routine signals your nervous system to begin sleep preparation",
      "📵 Digital Sunset (30 min before bed):\n• Set a screen break reminder for 30 min before bedtime\n• Switch to a paper book, gentle stretching, or quiet music\n• Write tomorrow's to-do list to \"close open loops\" in your mind\n•Reducing cognitive load before bed reduces time to fall asleep by 50%",
    ],
    closings: [
      "Check your Sleep score on the dashboard and try the sleep prep routine tonight.",
      "Would you like me to help you set a bedtime reminder in the app?",
    ],
  },

  headache: {
    openers: [
      "I'm sorry you're dealing with headaches. Persistent headaches can be really draining.",
      "Head pain is often connected to screen time, dehydration, or tension. Let's address those gently.",
    ],
    insights: [
      "Screen-related headaches are often caused by eye strain, poor posture, and dehydration — all fixable factors.",
      "Tension headaches respond well to gentle neck stretches and hydration within 15-20 minutes.",
    ],
    exercises: [
      "💆 Headache Relief (5 min):\n• Drink a full glass of water slowly\n• Close your eyes and gently massage your temples in circles for 30s\n• Press the space between your thumb and index finger firmly for 30s each hand\n• Gently tilt your head side to side, holding 15s each\n• Dim your screen brightness to minimum\n•Hydration + pressure points + neck release addresses the 3 most common headache triggers",
    ],
    closings: [
      "If headaches persist for more than a few days, please consult a healthcare professional.",
      "Set a hydration reminder to drink water regularly — it can prevent future headaches.",
    ],
  },

  healthy_habits: {
    openers: [
      "Great question! Building healthy habits is one of the best things you can do for your long-term wellbeing. 🌱",
      "Love that you're thinking about healthy habits! Here are some science-backed recommendations.",
    ],
    insights: [
      "The most effective healthy habits are small, consistent, and tied to existing routines (habit stacking).",
      "Research shows it takes 21-66 days to form a habit — starting tiny and being consistent matters more than intensity.",
    ],
    exercises: [
      "📋 Daily Wellness Stack:\n• Morning: 1 glass of water + 5 min stretching + log mood in Journal\n• Midday: 10 min walk + screen break + healthy snack\n• Evening: 3 min Breathwork + gratitude journal + digital sunset 30 min before bed\n•Stack these onto existing habits (e.g., stretch right after brushing teeth)",
      "🎯 Micro-Habit Challenge (this week):\n• Day 1-2: Drink 8 glasses of water\n• Day 3-4: Add a 5-min morning stretch\n• Day 5-6: Add a 3-min evening breathwork session\n• Day 7: Review your week in the Journal\n•Gradual layering prevents overwhelm and builds lasting change",
    ],
    closings: [
      "Start with just ONE habit this week. Check your Dashboard to track progress!",
      "Would you like me to help you create a personalized daily wellness routine?",
    ],
  },

  default: {
    openers: [
      "I'm here to support you! Let me know how you're feeling, or try one of these wellness activities.",
      "Tell me more about what's on your mind. I'm here to help with your wellness journey.",
      "I'm right here with you. Whether you're feeling great or struggling, I've got suggestions for you!",
    ],
    insights: [
      "Regular check-ins with your mental wellness — even when you feel fine — build long-term resilience.",
      "Mental wellness is a daily journey of small, consistent habits like hydration, breathing, and rest.",
    ],
    exercises: [
      "🌬️ Quick Breathwork (2 min):\n• Try the Breathwork Timer on your dashboard\n• Just 2 minutes of deep breathing can reset your nervous system",
      "✍️ Quick Journal Check-in:\n• Open your Journal tab\n• Rate your mood 1-10 and write one sentence about why\n•Takes 30 seconds and builds valuable self-awareness over time",
    ],
    closings: [
      "What would you like to explore? I can suggest exercises, breathing techniques, or just chat!",
      "Try asking me things like \"I feel stressed\", \"suggest an exercise\", or \"help me sleep better\".",
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const WELLNESS_DISCLAIMER =
  "\n\nI'm an AI wellness companion, not a medical professional. For serious concerns, please consult a healthcare provider.";

// ─── Crisis Detection ───────────────────────────────────────────────
function isCrisis(query: string): boolean {
  return (
    query.includes('suicide') ||
    query.includes('kill myself') ||
    query.includes('die') ||
    query.includes('self harm') ||
    query.includes('hurt myself') ||
    query.includes('end my life') ||
    (query.includes('depression') && query.includes('severe'))
  );
}

function crisisResponse(): string {
  return (
    "I hear you, and I want you to know this is a safe space. However, what you're describing sounds serious, and I want to make sure you get the right support.\n\n" +
    "Please reach out now — free & confidential:\n" +
    "• 📞 Call or Text 988 (US/Canada Suicide & Crisis Lifeline)\n" +
    "• 💬 Text HOME to 741741 (Crisis Text Line)\n" +
    "• 🌐 Visit findahelpline.com for international resources\n\n" +
    "You are not alone. There are trained professionals ready to help you right now. 💙"
  );
}

// ─── Smart Keyword Matching ─────────────────────────────────────────
function detectCategory(query: string): string | null {
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => query.includes(kw))) {
      return category;
    }
  }
  return null;
}

// ─── Build Local Response ───────────────────────────────────────────
function buildLocalResponse(category: string): string {
  const data = RESPONSES[category] || RESPONSES.default;
  const opener = randomItem(data.openers);
  const insight = randomItem(data.insights);
  const exercise = randomItem(data.exercises);
  const closing = randomItem(data.closings);

  return `${opener}\n\n${insight}\n\n${exercise}\n\n${closing}${WELLNESS_DISCLAIMER}`;
}

// ─── Main Export ─────────────────────────────────────────────────────
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  userId?: string
): Promise<string> {
  const query = message.toLowerCase().trim();

  // 1. Crisis — always handle immediately (no API needed)
  if (isCrisis(query)) {
    await new Promise((r) => setTimeout(r, 300));
    return crisisResponse();
  }

  // 2. Check for music request — save suggestion and reply
  const musicKeywords = KEYWORDS.music_request || [];
  const isMusicRequest = musicKeywords.some((kw) => {
    const kwWords = kw.toLowerCase().split(' ');
    return kwWords.every((word) => query.includes(word));
  });

  if (isMusicRequest) {
    console.log('[Chatbot] Matched music request — picking suggestion and persisting.');
    const song = randomItem(MUSIC_SUGGESTIONS);

      if (userId) {
        try {
          const { saveAISuggestedLifestyleItems } = await import('./recommendations');
          await saveAISuggestedLifestyleItems(userId, [
            {
              id: `song-${Date.now()}`,
              title: song.title,
              creator: song.creator,
              category: 'songs',
              description: song.description,
              reason: 'Music suggestion from chat',
              linkUrl: song.linkUrl,
            },
          ]);
        } catch (err) {
          console.error('[Chatbot] Failed to save music suggestion:', err);
        }
      }

    const reply = `🎵 Here's something for you: "${song.title}" by ${song.creator}\n\n${song.description}\n\nI've added it to your Recommended → Music section:\n${song.linkUrl}`;
    await new Promise((r) => setTimeout(r, 500 + Math.random() *400));
    return `${reply}${WELLNESS_DISCLAIMER}`;
  }

  // 3. Check if message matches a predefined category → use local response (saves tokens!)
  const matchedCategory = detectCategory(query);
  if (matchedCategory) {
    console.log(`[Chatbot] Matched predefined category: "${matchedCategory}" — using local response to save tokens.`);
    await new Promise((r) => setTimeout(r, 500 + Math.random() *400)); // Natural typing delay
    return buildLocalResponse(matchedCategory);
  }

  // 3. Complex/ambiguous message → use OpenAI API
  console.log('[Chatbot] No predefined match — routing to OpenAI API.');
  const aiReply = await callOpenAI(message, history);
  if (aiReply) {
    return aiReply;
  }

  // 4. Final fallback if OpenAI fails
  console.log('[Chatbot] OpenAI failed — using default local response.');
  await new Promise((r) => setTimeout(r, 600));
  return buildLocalResponse('default');
}
