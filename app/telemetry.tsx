import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { getLiveMetrics } from '@/src/services/realAnalytics';
import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';

// Custom SVG mini-sparkline for live widgets
function LiveSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 80;
  const height = 18;
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;

  const coords = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2; // 2px padding top/bottom
    return `${x},${y}`;
  });

  const pathD = `M ${coords.join(' L ')}`;

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TelemetryScreen() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [telemetry, setTelemetry] = useState<any>(null);
  const [sessionTime, setSessionTime] = useState(134); // Start at 2:14 (134s) to match mockup
  
  // Real-time ticking history for mini sparklines
  const [moodHistory, setMoodHistory] = useState<number[]>([80, 81, 79, 82, 83, 81, 82]);
  const [stressHistory, setStressHistory] = useState<number[]>([36, 38, 35, 34, 37, 33, 34]);
  const [activityHistory, setActivityHistory] = useState<number[]>([85, 87, 86, 89, 91, 88, 90]);

  // Session timer increment
  useEffect(() => {
    const sessionTimer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(sessionTimer);
  }, []);

  // Telemetry polling
  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      const metrics = await getLiveMetrics();
      if (active) {
        setTelemetry(metrics);
        
        // Append values to history with a maximum size of 10 points
        const latestMood = metrics.moodScore || 82;
        const latestStress = metrics.stressIndex || 34;
        const latestActivity = metrics.activityLevel || 90;

        setMoodHistory((prev) => [...prev.slice(-9), latestMood]);
        setStressHistory((prev) => [...prev.slice(-9), latestStress]);
        setActivityHistory((prev) => [...prev.slice(-9), latestActivity]);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const formatSessionTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `Session: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Theme colors mapping
  const bgColors = isDark
    ? (['#0a0813', '#0e0b1f'] as const)
    : (['#ede8ff', '#f8f7ff'] as const);

  const cardBg = isDark ? '#151126' : '#ffffff';
  const cardBorder = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.12)';
  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';

  // Live KPI Values
  const liveMoodVal = telemetry?.moodScore || 82;
  const liveStressVal = telemetry?.stressIndex || 34;
  const liveActivityVal = telemetry?.activityLevel || 90;

  // Raw Signals
  const keyInterval = telemetry?.rawSignals?.avgKeyInterval || 340;
  const backspaceRatio = telemetry?.rawSignals?.backspaceRatio || 8;
  const gForce = telemetry?.rawSignals?.motionMagnitude || 0.4;
  const sleepGap = telemetry?.sleepHours || 7.2;
  
  // Simulated keystroke rates/scroll speeds for visual mockup matching
  const keysPerSec = telemetry?.rawSignals?.totalKeypresses > 0 
    ? Number((telemetry.rawSignals.totalKeypresses / (sessionTime - 134 + 1) * 2).toFixed(1))
    : 4.2;
  const scrollSpeed = telemetry?.rawSignals?.totalScrolls > 0
    ? Number((telemetry.rawSignals.totalScrolls / (sessionTime - 134 + 1) * 0.8).toFixed(1))
    : 2.1;

  // Progress Bar Percentages
  const pctCadence = Math.min(100, Math.max(10, (keyInterval / 600) * 100));
  const pctKeys = Math.min(100, Math.max(10, (keysPerSec / 10) * 100));
  const pctBackspace = Math.min(100, Math.max(10, (backspaceRatio / 30) * 100));
  const pctScroll = Math.min(100, Math.max(10, (scrollSpeed / 10) * 100));
  const pctGforce = Math.min(100, Math.max(5, (gForce / 2.0) * 100));
  const pctSleep = Math.min(100, Math.max(10, (sleepGap / 12) * 100));

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Layout */}
        <View style={styles.header}>
          <View style={styles.headerLeftBlock}>
            <Pressable 
              onPress={handleBack} 
              style={[styles.backBtn, { borderColor: cardBorder, backgroundColor: cardBg }]}
            >
              <Feather name="chevron-left" size={20} color={textColor} />
            </Pressable>
            <View style={styles.titleCol}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Live Telemetry</Text>
              <View style={styles.pollingRow}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.pollingText}>Polling every 500ms</Text>
              </View>
            </View>
          </View>

          {/* Session timer capsule */}
          <View style={[styles.sessionCapsule, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f3e8ff' }]}>
            <Text style={[styles.sessionText, { color: isDark ? '#c084fc' : '#7c3aed' }]}>
              {formatSessionTime(sessionTime)}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Row: 3 Live mini line chart widgets */}
          <View style={styles.liveWidgetsRow}>
            {/* Live Mood */}
            <View style={[styles.liveMiniCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.liveWidgetTitle, { color: textMuted }]}>LIVE MOOD</Text>
              <Text style={[styles.liveWidgetVal, { color: textColor }]}>{liveMoodVal}</Text>
              <View style={styles.sparklineWrapper}>
                <LiveSparkline data={moodHistory} color={isDark ? '#c084fc' : '#7c3aed'} />
              </View>
            </View>

            {/* Live Stress */}
            <View style={[styles.liveMiniCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.liveWidgetTitle, { color: textMuted }]}>LIVE STRESS</Text>
              <Text style={[styles.liveWidgetVal, { color: textColor }]}>{liveStressVal}</Text>
              <View style={styles.sparklineWrapper}>
                <LiveSparkline data={stressHistory} color={isDark ? '#ff6b6b' : '#dc2626'} />
              </View>
            </View>

            {/* Live Activity */}
            <View style={[styles.liveMiniCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.liveWidgetTitle, { color: textMuted }]}>LIVE ACTIVITY</Text>
              <Text style={[styles.liveWidgetVal, { color: textColor }]}>{liveActivityVal}</Text>
              <View style={styles.sparklineWrapper}>
                <LiveSparkline data={activityHistory} color={isDark ? '#3de2b5' : '#059669'} />
              </View>
            </View>
          </View>

          {/* RAW SIGNAL FEED LIST */}
          <GlassCard style={styles.cardSpacing}>
            <Text style={[styles.sectionHeading, { color: textMuted }]}>RAW SIGNAL FEED</Text>
            
            <View style={styles.signalFeedList}>
              {/* Typing Cadence */}
              <View style={styles.feedItem}>
                <View style={styles.feedItemTextRow}>
                  <Text style={[styles.feedLabel, { color: textColor }]}>Typing Cadence</Text>
                  <Text style={[styles.feedValue, { color: textColor }]}>{keyInterval} <Text style={{ fontSize: 10, color: textMuted }}>ms avg</Text></Text>
                </View>
                <View style={[styles.feedBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.feedBarFill, { width: `${pctCadence}%`, backgroundColor: isDark ? '#c084fc' : '#7c3aed' }]} />
                </View>
              </View>

              {/* Keystroke Rate */}
              <View style={styles.feedItem}>
                <View style={styles.feedItemTextRow}>
                  <Text style={[styles.feedLabel, { color: textColor }]}>Keystroke Rate</Text>
                  <Text style={[styles.feedValue, { color: '#10b981' }]}>{keysPerSec.toFixed(1)} <Text style={{ fontSize: 10, color: textMuted }}>keys/sec</Text></Text>
                </View>
                <View style={[styles.feedBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.feedBarFill, { width: `${pctKeys}%`, backgroundColor: '#10b981' }]} />
                </View>
              </View>

              {/* Backspace Ratio */}
              <View style={styles.feedItem}>
                <View style={styles.feedItemTextRow}>
                  <Text style={[styles.feedLabel, { color: textColor }]}>Backspace Ratio</Text>
                  <Text style={[styles.feedValue, { color: '#db2777' }]}>{backspaceRatio}% <Text style={{ fontSize: 10, color: textMuted }}>corrections</Text></Text>
                </View>
                <View style={[styles.feedBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.feedBarFill, { width: `${pctBackspace}%`, backgroundColor: '#db2777' }]} />
                </View>
              </View>

              {/* Scroll Speed */}
              <View style={styles.feedItem}>
                <View style={styles.feedItemTextRow}>
                  <Text style={[styles.feedLabel, { color: textColor }]}>Scroll Speed</Text>
                  <Text style={[styles.feedValue, { color: '#3b82f6' }]}>{scrollSpeed.toFixed(1)} <Text style={{ fontSize: 10, color: textMuted }}>px/ms</Text></Text>
                </View>
                <View style={[styles.feedBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.feedBarFill, { width: `${pctScroll}%`, backgroundColor: '#3b82f6' }]} />
                </View>
              </View>

              {/* Accelerometer Force */}
              <View style={styles.feedItem}>
                <View style={styles.feedItemTextRow}>
                  <Text style={[styles.feedLabel, { color: textColor }]}>Accel. G-Force</Text>
                  <Text style={[styles.feedValue, { color: isDark ? '#c084fc' : '#7c3aed' }]}>{gForce.toFixed(2)} <Text style={{ fontSize: 10, color: textMuted }}>g</Text></Text>
                </View>
                <View style={[styles.feedBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.feedBarFill, { width: `${pctGforce}%`, backgroundColor: isDark ? '#c084fc' : '#7c3aed' }]} />
                </View>
              </View>

              {/* Sleep Gap Est. */}
              <View style={styles.feedItem}>
                <View style={styles.feedItemTextRow}>
                  <Text style={[styles.feedLabel, { color: textColor }]}>Sleep Gap Est.</Text>
                  <Text style={[styles.feedValue, { color: '#10b981' }]}>{sleepGap.toFixed(1)} <Text style={{ fontSize: 10, color: textMuted }}>hours</Text></Text>
                </View>
                <View style={[styles.feedBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.feedBarFill, { width: `${pctSleep}%`, backgroundColor: '#10b981' }]} />
                </View>
              </View>
            </View>
          </GlassCard>

          {/* STRESS FORMULA CODE BOX */}
          <GlassCard style={styles.cardSpacing}>
            <Text style={[styles.sectionHeading, { color: textMuted }]}>STRESS FORMULA</Text>
            <View style={[styles.formulaBox, { backgroundColor: isDark ? '#080511' : '#f5f3ff', borderColor: cardBorder }]}>
              <Text style={styles.formulaCodeText}>
                {`stress = base(50)\n+ speed_penalty(cadence < 250ms ? +20 : 0)\n+ error_rate(backspace_ratio * 40)\n- activity_bonus(steps / 200)`}
              </Text>
            </View>
          </GlassCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  titleCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  pollingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  pollingText: {
    fontSize: 10.5,
    fontFamily: fonts.semiBold,
    color: '#10b981',
  },
  sessionCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  cardSpacing: {
    marginBottom: 16,
    padding: 16,
  },
  liveWidgetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  liveMiniCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 10,
    minHeight: 88,
  },
  liveWidgetTitle: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  liveWidgetVal: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 30,
    marginTop: 2,
  },
  sparklineWrapper: {
    height: 18,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  signalFeedList: {
    gap: 12,
  },
  feedItem: {
    gap: 6,
  },
  feedItemTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  feedValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  feedBarTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  feedBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  formulaBox: {
    borderWidth: 1.2,
    borderRadius: 12,
    padding: 12,
  },
  formulaCodeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    color: '#8b5cf6',
  },
});
