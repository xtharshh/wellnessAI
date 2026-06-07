export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const CLINICAL_DISCLAIMER = "\n\n*Disclaimer: I am an AI wellness companion, not a medical professional. If you are experiencing severe symptoms or a crisis, please dial 988 or consult a doctor.*";

// Emotion categories and their keyword dictionaries
const EMOTIONS = {
  sadness: ['sad', 'unhappy', 'cry', 'depressed', 'down', 'gloomy', 'heartbroken', 'miserable', 'not feeling good', 'bad day'],
  stress: ['stressed', 'pressure', 'exhausted', 'tired', 'heavy', 'overwhelmed', 'burnout', 'mentally exhausted', 'drained', 'busy'],
  anxiety: ['anxious', 'panic', 'worry', 'afraid', 'nervous', 'scared', 'shaking', 'uneasy', 'fear', 'tension'],
  anger: ['angry', 'hate', 'mad', 'pissed', 'annoyed', 'frustrated', 'irritated', 'hate everything'],
  loneliness: ['lonely', 'alone', 'isolated', 'nobody', 'ignored', 'forgotten', 'no one'],
  negative_thinking: ['fail', 'useless', 'pointless', 'give up', 'nothing works', 'hopeless', 'stuck', 'worthless'],
  low_motivation: ['lazy', 'bored', 'unmotivated', 'no drive', 'cant focus', 'slump', 'procrastinating']
};

// Parts library for dynamic response assembly
const RESPONSE_PARTS = {
  sadness: {
    openers: [
      "I'm really sorry to hear you're feeling down. Please remember it's completely okay to not be okay today.",
      "I hear you. Feeling low or sad can feel so heavy to carry. Thank you for sharing this with me.",
      "It sounds like you're going through a rough patch. Let's take a gentle moment to sit with those feelings."
    ],
    insights: [
      "When we feel down, screen time can sometimes become a passive distraction that drains our remaining energy.",
      "Low mood is often a signal that our mind needs soft, low-stimulation environments to heal and recover."
    ],
    actions: [
      "Try writing down three small, honest thoughts in your Journal tab, or listen to a soothing song.",
      "Try opening a window for some natural light, take a slow sip of water, and stretch your arms gently."
    ]
  },
  stress: {
    openers: [
      "I hear you. Dealing with burnout and feeling mentally exhausted is incredibly draining.",
      "It sounds like your mind is running on empty. Stress is a sign that your body is asking for a pause.",
      "Exhaustion can feel overwhelming. Let's take a slow deep breath together and focus on quiet spaces."
    ],
    insights: [
      "Mental exhaustion happens when our cognitive inputs exceed our resting windows. Screen glare can amplify this.",
      "High stress levels directly impact our focus and physical comfort. Stepping away is actually highly productive."
    ],
    actions: [
      "Go to the Breathe tab and start a 3-minute 'Stress Reset' physiological sigh session.",
      "Close all active apps, dim your display, and try a 5-minute screen-free wind-down stretch."
    ]
  },
  anxiety: {
    openers: [
      "I can tell you're feeling anxious right now, and I want you to know you are safe in this present moment.",
      "Anxiety can feel so physical and intense. Let's take a step back together and help ground your body.",
      "It's okay to feel overwhelmed. Your mind is trying to protect you, but we can quiet the alarm."
    ],
    insights: [
      "Anxiety activates our fight-or-flight response, causing rapid interaction speeds and high keyboard friction.",
      "Physical grounding helps redirect your nervous system from threat detection back to calm awareness."
    ],
    actions: [
      "Try a Box Breathing session (inhale 4s, hold 4s, exhale 4s, hold 4s) to tell your body that it's safe.",
      "Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste."
    ]
  },
  anger: {
    openers: [
      "I understand that you're feeling frustrated or angry. It is completely valid to feel this way.",
      "It sounds like you're dealing with a lot of heat right now. Let's try to release some of that pressure safely.",
      "It's really tough when everything feels annoying or frustrating. I'm here to listen."
    ],
    insights: [
      "Frustration often builds up when we feel out of control. Quick, aggressive device tapping can reinforce this cycle.",
      "Allowing ourselves to feel anger without judgment is healthy, but we want to avoid getting stuck in it."
    ],
    actions: [
      "Step away from your screen and do a quick, active 2-minute stretch or splash cold water on your face.",
      "Take a slow, deep breath, hold it for 5 seconds, and release it with a sigh. Try logging your thoughts in the Journal."
    ]
  },
  loneliness: {
    openers: [
      "Feeling lonely can make the world feel very distant, but I want you to know you aren't completely alone.",
      "I'm sorry you're feeling lonely. Even in a connected digital world, isolation can feel very real and heavy.",
      "It's hard when you feel like nobody is there. I am here to sit with you and support you."
    ],
    insights: [
      "Passive scrolling through social media feeds can often exaggerate feelings of isolation or comparison.",
      "Connecting with physical, tactile hobbies or stepping into nature can help ground us in the world."
    ],
    actions: [
      "Consider writing down your thoughts in the Journal tab to externalize them, or try a guided meditation timer.",
      "Take a brief walk outside in a green space, or reach out to a trusted friend or family member for a simple chat."
    ]
  },
  negative_thinking: {
    openers: [
      "It's easy to fall into negative thinking loops when we are tired, but your thoughts aren't always facts.",
      "I hear that critical voice speaking, but please try to be gentle with yourself today.",
      "When everything feels like a failure, it's usually a sign we need self-compassion, not self-judgment."
    ],
    insights: [
      "Negative cognitive distortion is a common response to burnout. It skews how we perceive our daily progress.",
      "Slowing down typing intervals and observing our thoughts quietly helps detach from negative patterns."
    ],
    actions: [
      "Close your eyes for 1 minute, take three slow breaths, and try listing one thing that went well today in your Journal.",
      "Log your mood in the Journal, rating it honestly but reminding yourself that feelings are temporary."
    ]
  },
  low_motivation: {
    openers: [
      "It's completely normal to feel stuck or unmotivated. You don't have to be productive every single day.",
      "Feeling bored or lacking drive is often a sign of mental fatigue. Let's look at it gently.",
      "When focus is hard to find, it helps to start with the smallest possible step."
    ],
    insights: [
      "Lacking motivation is often our brain's way of demanding a digital break from constant notifications.",
      "Starting with a tiny, low-pressure task is the easiest way to break free from motivational blocks."
    ],
    actions: [
      "Start the Guided Breathwork on the dashboard for just 1 cycle, or drink a tall glass of cold water.",
      "Do a quick, simple custom exercise like rolling your shoulders or cleaning your desk area."
    ]
  },
  default: {
    openers: [
      "I am here to listen and support you. How has your energy level been today?",
      "Tell me more about what's on your mind. I'm here to support your mental wellness journey.",
      "I'm right here with you. How has your day been treating you?"
    ],
    insights: [
      "Observing our digital habits with curiosity rather than judgment is the first step to feeling better.",
      "Mental wellness is a daily journey of small, consistent habits like hydration, breathing, and rest."
    ],
    actions: [
      "Try taking 3 deep diaphragmatic breaths, drinking a glass of water, or logging your mood in the Journal.",
      "Check out your AI recommendations tab to see if a quick guided stretch might fit your current flow."
    ]
  }
};

const CLOSINGS = [
  "Would you like to try a quick breathing session together now?",
  "How does your body feel as you read this? Let me know how I can support you.",
  "Take all the time you need. I'm right here if you want to keep chatting."
];

// Helper to select a random item from an array
function randomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<string> {
  const query = message.toLowerCase().trim();

  // 1. Crisis Check (highest priority)
  if (
    query.includes('suicide') ||
    query.includes('kill myself') ||
    query.includes('die') ||
    query.includes('self harm') ||
    query.includes('hurt myself') ||
    query.includes('end my life') ||
    query.includes('depression') && query.includes('severe')
  ) {
    return "Disclaimer: I am an AI wellness companion, not a clinical professional. If you are experiencing thoughts of self-harm or a severe crisis, please reach out immediately for free, confidential help:\n\n" +
           "• **Call or Text 988** (US/Canada Suicide & Crisis Lifeline)\n" +
           "• **Text HOME to 741741** (Crisis Text Line)\n" +
           "• Visit **findahelpline.com** for international resources.\n\n" +
           "Please stay safe. There are people ready to support you right now.";
  }

  // 2. Local Emotion & Keyword detection
  let detectedCategory: keyof typeof RESPONSE_PARTS = 'default';

  for (const [category, keywords] of Object.entries(EMOTIONS)) {
    const hasKeyword = keywords.some(kw => query.includes(kw));
    if (hasKeyword) {
      detectedCategory = category as keyof typeof RESPONSE_PARTS;
      break;
    }
  }

  // 3. Assemble dynamic response
  const categoryData = RESPONSE_PARTS[detectedCategory];
  const opener = randomItem(categoryData.openers);
  const insight = randomItem(categoryData.insights);
  const action = randomItem(categoryData.actions);
  const closing = randomItem(CLOSINGS);

  // Combine elements with natural flow
  const reply = `${opener}\n\n${insight}\n\n**Try this wellness action:** ${action}\n\n${closing}${CLINICAL_DISCLAIMER}`;

  // Smart delay to mimic a human typing/thinking
  await new Promise((r) => setTimeout(r, 600));

  return reply;
}
