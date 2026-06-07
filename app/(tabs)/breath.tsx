import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Vibration, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

// ─── Types ────────────────────────────────────────────────────────────────────

type PhaseType = 'inhale' | 'hold' | 'exhale' | 'hold2';

interface Phase {
  phase: PhaseType;
  duration: number;
  label: string;
  instruction: string;
  segmentColor: string;
  accentColor: string;
  iconBg: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

interface BreathTechnique {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  phases: Phase[];
  benefit: string;
  bestFor: string;
  idleLabel: string;
}

// ─── Techniques ───────────────────────────────────────────────────────────────

const TECHNIQUES: Record<string, BreathTechnique> = {
  relax478: {
    id: 'relax478',
    name: '4-7-8 Relax',
    tag: 'Sleep & Anxiety',
    tagColor: '#a2cbfd',
    icon: 'moon',
    idleLabel: '4 · 7 · 8',
    phases: [
      { phase: 'inhale', duration: 4, label: 'Inhale', instruction: 'Breathe in through your nose', segmentColor: '#a2cbfd', accentColor: '#3b82f6', iconBg: 'rgba(162,203,253,0.18)', icon: 'arrow-down' },
      { phase: 'hold',   duration: 7, label: 'Hold',   instruction: 'Suspend the breath gently',    segmentColor: '#ffdc62', accentColor: '#d97706', iconBg: 'rgba(255,220,98,0.18)',  icon: 'pause' },
      { phase: 'exhale', duration: 8, label: 'Exhale', instruction: 'Whoosh slowly out your mouth', segmentColor: '#f7bee9', accentColor: '#db2777', iconBg: 'rgba(247,190,233,0.18)', icon: 'arrow-up' },
    ],
    benefit:
      'The 4-7-8 technique acts as a natural tranquilizer for the nervous system. By regulating oxygen-to-CO₂ ratios it decreases heart rate, lowers blood pressure, and quiets an overactive mind. Ideal for pre-sleep routines and desk-related tension relief.',
    bestFor: 'Sleep · Anxiety · Screen fatigue',
  },

  box: {
    id: 'box',
    name: 'Box Breathing',
    tag: 'Focus & Stress',
    tagColor: '#c4b5fd',
    icon: 'square',
    idleLabel: '4 · 4 · 4 · 4',
    phases: [
      { phase: 'inhale', duration: 4, label: 'Inhale',   instruction: 'Breathe in through your nose', segmentColor: '#a2cbfd', accentColor: '#3b82f6', iconBg: 'rgba(162,203,253,0.18)', icon: 'arrow-down' },
      { phase: 'hold',   duration: 4, label: 'Hold In',  instruction: 'Keep lungs full and steady',   segmentColor: '#ffdc62', accentColor: '#d97706', iconBg: 'rgba(255,220,98,0.18)',  icon: 'pause' },
      { phase: 'exhale', duration: 4, label: 'Exhale',   instruction: 'Release steadily through mouth', segmentColor: '#f7bee9', accentColor: '#db2777', iconBg: 'rgba(247,190,233,0.18)', icon: 'arrow-up' },
      { phase: 'hold2',  duration: 4, label: 'Hold Out', instruction: 'Rest with empty lungs',         segmentColor: '#c4b5fd', accentColor: '#7c3aed', iconBg: 'rgba(196,181,253,0.18)', icon: 'circle' },
    ],
    benefit:
      'Box Breathing (4-4-4-4) is used by Navy SEALs and elite athletes to rapidly regain composure. It synchronizes the autonomic nervous system, engaging the prefrontal cortex while suppressing the amygdala fear response — producing calm, deliberate focus under pressure.',
    bestFor: 'Focus · Stress relief · High-stakes tasks',
  },

  running: {
    id: 'running',
    name: 'Running Rhythm',
    tag: 'Cardio & Energy',
    tagColor: '#6ee7b7',
    icon: 'activity',
    idleLabel: '3 · 3',
    phases: [
      { phase: 'inhale', duration: 3, label: 'Inhale', instruction: 'Deep belly breath in through nose', segmentColor: '#6ee7b7', accentColor: '#10b981', iconBg: 'rgba(110,231,183,0.18)', icon: 'arrow-down' },
      { phase: 'exhale', duration: 3, label: 'Exhale', instruction: 'Controlled steady release out',    segmentColor: '#a2cbfd', accentColor: '#3b82f6', iconBg: 'rgba(162,203,253,0.18)', icon: 'arrow-up'   },
    ],
    benefit:
      'Rhythmic diaphragmatic breathing at a 3-3 cadence optimises oxygen delivery during aerobic activity. It trains your lungs to maximise capacity, maintain steady CO₂ balance, and prevents the dreaded side stitch. Use as a warm-up or cooling-down exercise around cardio.',
    bestFor: 'Running · Cycling · Workout warm-up',
  },

  stress: {
    id: 'stress',
    name: 'Stress Reset',
    tag: 'Instant Calm',
    tagColor: '#fca5a5',
    icon: 'zap',
    idleLabel: '2 · 1 · 8',
    phases: [
      { phase: 'inhale', duration: 2, label: 'Quick Inhale', instruction: 'Short sharp breath through nose', segmentColor: '#a2cbfd', accentColor: '#3b82f6', iconBg: 'rgba(162,203,253,0.18)', icon: 'arrow-down' },
      { phase: 'hold',   duration: 1, label: 'Sip',         instruction: 'Second micro-sip of air',          segmentColor: '#ffdc62', accentColor: '#d97706', iconBg: 'rgba(255,220,98,0.18)',  icon: 'plus'       },
      { phase: 'exhale', duration: 8, label: 'Long Exhale', instruction: 'Slow extended release through mouth', segmentColor: '#fca5a5', accentColor: '#ef4444', iconBg: 'rgba(252,165,165,0.18)', icon: 'arrow-up'  },
    ],
    benefit:
      'The Physiological Sigh (double-inhale + long exhale) is the fastest-known stress relief technique. The extended exhale activates the vagus nerve and parasympathetic response within a single breath — validated by Stanford neuroscientists as the single most effective real-time stress reduction tool.',
    bestFor: 'Panic · Instant reset · Before speaking',
  },
};

const TECHNIQUE_ORDER = ['relax478', 'box', 'running', 'stress'];

// ─── Ring Constants (module-level so helpers can use them) ─────────────────────

const RING   = 240;
const SVG_SW = 22;
const SVG_R  = (RING - SVG_SW) / 2;
const SVG_C  = 2 * Math.PI * SVG_R;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns 0–1 scale of breathing circle for smooth visual */
function getCircleScale(phase: PhaseType | 'idle', phaseProgress: number): number {
  if (phase === 'idle')   return 0.62;
  if (phase === 'inhale') return 0.55 + 0.45 * phaseProgress;
  if (phase === 'hold')   return 1.0;
  if (phase === 'exhale') return 1.0 - 0.45 * phaseProgress;
  if (phase === 'hold2')  return 0.55;
  return 0.62;
}

/** Format seconds as mm:ss */
function formatElapsed(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/** Compute each phase's SVG arc dasharray / dashoffset values */
function buildSegments(phases: Phase[]) {
  const total = phases.reduce((s, p) => s + p.duration, 0);
  let offset  = 0;
  return phases.map((p) => {
    const len  = (p.duration / total) * SVG_C;
    const dash = Math.max(0, len - 8); // 8px gap between segments
    const seg  = { ...p, dashLen: dash, dashOffset: -offset };
    offset += len;
    return seg;
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BreathScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ start?: string; technique?: string; referrer?: string; sessionDuration?: string; name?: string }>();

  const [techniqueId, setTechniqueId] = useState(() => {
    if (searchParams.technique && TECHNIQUES[searchParams.technique]) {
      return searchParams.technique;
    }
    return 'relax478';
  });
  const [referrer, setReferrer] = useState<string | null>(searchParams.referrer || null);
  const [isRunning, setIsRunning]           = useState(true);
  const [totalSessionDuration, setTotalSessionDuration] = useState(() => {
    if (searchParams.sessionDuration) {
      const parsedSecs = parseInt(searchParams.sessionDuration, 10);
      if (!isNaN(parsedSecs) && parsedSecs > 0) {
        return parsedSecs;
      }
    }
    return 180;
  });
  const [progress, setProgress]             = useState(0);   // actual cycle progress 0–1
  const [knotDisplayProgress, setKnotDisplayProgress] = useState(0); // knot display (pauses at boundaries)
  const [activePhaseName, setActivePhaseName] = useState<PhaseType | 'idle'>('idle');
  const [phaseProgress, setPhaseProgress]     = useState(0);
  const [secondsLeft, setSecondsLeft]         = useState(0);
  const [cycle, setCycle]                     = useState(0);
  const [elapsedSeconds, setElapsedSeconds]   = useState(0);

  const chimeSoundRef = useRef<Audio.Sound | null>(null);
  const lastVibrationSecondRef = useRef<number>(-1);

  // Audio setup
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    }).catch(() => {});

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/buttons/sounds/button-10.mp3' },
          { shouldPlay: false }
        );
        chimeSoundRef.current = sound;
      } catch (error) {
        console.log('Failed to load chime sound:', error);
      }
    };
    loadSound();

    return () => {
      if (chimeSoundRef.current) {
        chimeSoundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playChime = async () => {
    try {
      if (chimeSoundRef.current) {
        await chimeSoundRef.current.stopAsync();
        await chimeSoundRef.current.playAsync();
      }
    } catch (error) {
      console.log('Error playing chime:', error);
    }
  };

  // Trigger auto-start from navigation parameters
  useEffect(() => {
    if (searchParams.start === 'true' && searchParams.technique && TECHNIQUES[searchParams.technique]) {
      setTechniqueId(searchParams.technique);
      if (searchParams.sessionDuration) {
        const parsedSecs = parseInt(searchParams.sessionDuration, 10);
        if (!isNaN(parsedSecs) && parsedSecs > 0) {
          setTotalSessionDuration(parsedSecs);
        }
      }
      setTimeout(() => {
        startSession();
      }, 100);
      router.setParams({ start: undefined, technique: undefined, sessionDuration: undefined });
    }
  }, [searchParams.start, searchParams.technique, searchParams.sessionDuration]);

  useEffect(() => {
    if (searchParams.referrer) {
      setReferrer(searchParams.referrer);
    }
  }, [searchParams.referrer]);

  const startTimeRef        = useRef<number>(Date.now());
  const lastPhaseRef        = useRef<string>('idle');
  const cycleCountRef       = useRef<number>(0);
  const knotPausedUntilRef  = useRef<number>(0); // timestamp until knot is frozen at boundary

  const technique     = TECHNIQUES[techniqueId];
  const totalDuration = technique.phases.reduce((s, p) => s + p.duration, 0);
  const segments      = buildSegments(technique.phases);

  // ── Interval driver: updates every 50 ms (~20 fps, no Animated needed) ──
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const elapsed       = (Date.now() - startTimeRef.current) / 1000;
      const cycleElapsed  = elapsed % totalDuration;
      const newCycle      = Math.floor(elapsed / totalDuration);

      // Which phase are we in?
      let cumulative = 0;
      let activePhase = technique.phases[0];
      let phaseElapsed = 0;
      for (const p of technique.phases) {
        if (cycleElapsed < cumulative + p.duration) {
          activePhase  = p;
          phaseElapsed = cycleElapsed - cumulative;
          break;
        }
        cumulative += p.duration;
      }

      const currentElapsed = Math.floor(elapsed);
      setElapsedSeconds(currentElapsed);

      // Metronome tick every second (subtle haptic)
      if (currentElapsed !== lastVibrationSecondRef.current) {
        lastVibrationSecondRef.current = currentElapsed;
        if (activePhase.phase === lastPhaseRef.current) {
          try { Haptics.selectionAsync(); } catch {}
        }
      }

      // Haptic + sound + knot pause on phase transition
      if (activePhase.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = activePhase.phase;
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        playChime();
        knotPausedUntilRef.current = Date.now() + 380; // freeze knot at boundary for 380 ms
      }

      const fullProgress = cycleElapsed / totalDuration;
      setActivePhaseName(activePhase.phase);
      setPhaseProgress(phaseElapsed / activePhase.duration);
      setProgress(fullProgress);
      setSecondsLeft(Math.ceil(activePhase.duration - phaseElapsed));

      // Only advance the knot when the pause window has elapsed
      if (Date.now() >= knotPausedUntilRef.current) {
        setKnotDisplayProgress(fullProgress);
      }

      if (newCycle > cycleCountRef.current) {
        cycleCountRef.current = newCycle;
        setCycle(newCycle);
      }

      // Check if session has run for target duration
      if (currentElapsed >= totalSessionDuration) {
        clearInterval(id);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
        Alert.alert('Session Complete!', 'Well done completing your breathing session.', [
          {
            text: 'OK',
            onPress: () => stopSession()
          }
        ]);
      }
    }, 50);

    return () => clearInterval(id);
  }, [isRunning, techniqueId, totalSessionDuration]);

  const startSession = () => {
    startTimeRef.current  = Date.now();
    lastPhaseRef.current  = 'idle';
    lastVibrationSecondRef.current = -1;
    cycleCountRef.current = 0;
    setCycle(0);
    setPhaseProgress(0);
    setActivePhaseName('idle');
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  const stopSession = () => {
    if (referrer) {
      router.replace(referrer as any);
    } else {
      router.replace('/(tabs)/exercises');
    }
  };

  const activePhaseData =
    activePhaseName !== 'idle'
      ? technique.phases.find((p) => p.phase === activePhaseName) ?? technique.phases[0]
      : null;

  const circleScale = getCircleScale(activePhaseName, phaseProgress);
  const circleColor = activePhaseData?.segmentColor ?? (isDark ? 'rgba(162,203,253,0.15)' : 'rgba(162,203,253,0.25)');

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MT';

  // Styles/Colors helpers
  const displayName = searchParams.name || technique.name;

  // FULLSCREEN DISTRACTION-FREE ACTIVE SESSION LAYOUT
  return (
    <View style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.sessionHeader}>
        <View style={styles.sessionHeaderLeft}>
          <Pressable
            onPress={stopSession}
            style={[
              styles.backBtn,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.outline,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 58, 237, 0.05)',
              }
            ]}
          >
            <Feather name="chevron-left" size={20} color={isDark ? '#ffffff' : colors.primary} />
          </Pressable>
          <Text style={[styles.sessionHeaderTitle, { color: colors.onSurface }]}>{displayName}</Text>
        </View>
        
        <View
          style={[
            styles.sessionStopwatch,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.outline,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 58, 237, 0.05)',
            }
          ]}
        >
          <Feather name="clock" size={12} color={colors.onSurface} style={{ marginRight: 4 }} />
          <Text style={[styles.stopwatchText, { color: colors.onSurface }]}>
            {formatElapsed(Math.max(0, totalSessionDuration - elapsedSeconds))}
          </Text>
        </View>
      </View>

      {/* Concentric Breathing Circle Container */}
      <View style={styles.sessionRingArea}>
        {/* Outer Ring boundary */}
        <View style={[styles.outerRingBoundary, { borderColor: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.outline }]} />
        
        {/* Concentric Halo background */}
        <View
          style={[
            styles.sessionHalo,
            {
              backgroundColor: circleColor,
              opacity: 0.08,
              transform: [{ scale: circleScale * 1.4 }],
            },
          ]}
        />

        <View
          style={[
            styles.sessionHalo,
            {
              backgroundColor: circleColor,
              opacity: 0.15,
              transform: [{ scale: circleScale * 1.2 }],
            },
          ]}
        />

        {/* Inner breathing circle */}
        <View
          style={[
            styles.sessionBreathCircle,
            {
              backgroundColor: circleColor,
              transform: [{ scale: circleScale }],
            },
          ]}
        />

        {/* Inside Circle Texts */}
        <View style={styles.sessionTextOverlay} pointerEvents="none">
          <Text style={[styles.sessionPhaseLabel, { color: activePhaseData?.accentColor ?? colors.primary }]}>
            {activePhaseName.toUpperCase()}
          </Text>
          <Text style={[styles.sessionSecondsText, { color: colors.onSurface }]}>
            {secondsLeft}
          </Text>
          <Text style={[styles.sessionSecondsSub, { color: colors.onSurfaceVariant }]}>
            seconds
          </Text>
        </View>
      </View>

      {/* Bottom indicators and controls */}
      <View style={styles.sessionBottomControls}>
        {/* Phase Pill Indicators */}
        <View style={styles.sessionPillsContainer}>
          {technique.phases.map((p, idx) => {
            const isPhaseActive = activePhaseName === p.phase;
            return (
              <View
                key={idx}
                style={[
                  styles.sessionPill,
                  {
                    backgroundColor: isPhaseActive ? colors.primary : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 58, 237, 0.05)'),
                    borderColor: isPhaseActive ? colors.primary : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 58, 237, 0.1)'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sessionPillText,
                    {
                      color: isPhaseActive
                        ? '#ffffff'
                        : (isDark ? 'rgba(255, 255, 255, 0.5)' : colors.onSurfaceVariant),
                    }
                  ]}
                >
                  {p.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sessionRoundText, { color: colors.onSurfaceVariant }]}>
          Round {cycle + 1} of 4 • Stay relaxed
        </Text>

        <Pressable
          onPress={stopSession}
          style={[
            styles.sessionEndButton,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.outline,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.08)',
            }
          ]}
        >
          <Text style={[styles.sessionEndButtonText, { color: isDark ? '#ffffff' : colors.primary }]}>✕ End Session</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 120,
    gap: 0,
  },
  fullscreenContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sessionStopwatch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  stopwatchText: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  sessionRingArea: {
    width: 320,
    height: 320,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRingBoundary: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1.5,
  },
  sessionHalo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  sessionBreathCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.85,
  },
  sessionTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sessionPhaseLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  sessionSecondsText: {
    fontSize: 72,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 78,
  },
  sessionSecondsSub: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionBottomControls: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  sessionPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sessionPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionRoundText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  sessionEndButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionEndButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Standard Header
  headerBanner: {
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderBottomWidth: 1,
    marginBottom: 18,
  },
  profileRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarCol:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText:  { fontSize: 18, fontWeight: '700' },
  eyebrow:     { ...typography.labelCaps, textTransform: 'none', fontSize: 11 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  iconBadge:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  // Pills
  pillScroll: { marginBottom: 0 },
  pillRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5 },
  pillLabel: { fontSize: 12, fontWeight: '700' },

  // Tag
  tagBadge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, marginTop: 14, marginBottom: 4 },
  tagText:  { fontSize: 11, fontWeight: '600' },

  // Ring
  ringArea: {
    width: RING,
    height: RING,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  halo: {
    position: 'absolute',
    width: RING - SVG_SW * 2 - 10,
    height: RING - SVG_SW * 2 - 10,
    borderRadius: (RING - SVG_SW * 2 - 10) / 2,
  },
  breathCircle: {
    position: 'absolute',
    width: RING - SVG_SW * 2 - 18,
    height: RING - SVG_SW * 2 - 18,
    borderRadius: (RING - SVG_SW * 2 - 18) / 2,
    opacity: 0.85,
  },
  ringTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 20,
  },
  phaseLabel:      { fontSize: 12, fontWeight: '800', letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase' },
  secondsText:     { fontSize: 36, fontWeight: '800', textAlign: 'center', lineHeight: 40 },
  instructionText: { fontSize: 10, textAlign: 'center', lineHeight: 14, marginTop: 2 },

  // Control
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    height: 52,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 6,
  },
  controlBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cycleCounter: { ...typography.dataMono, fontSize: 12, textAlign: 'center', marginBottom: 10 },

  // Phase Cards
  breakdownRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20, gap: 8, marginVertical: 4 },
  breakdownCard: { flex: 1, borderRadius: radius.md, padding: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardIconCircle:{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  cardLabel:     { fontSize: 10, fontWeight: '600', marginBottom: 1, textAlign: 'center' },
  cardVal:       { fontSize: 15, fontWeight: '800' },

  // Benefit
  benefitCard:   { marginHorizontal: 20, marginTop: 8, marginBottom: 12, padding: spacing.md, gap: 10 },
  benefitHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIcon:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  benefitTitle:  { ...typography.titleMd, fontSize: 14, fontWeight: '700' },
  benefitText:   { ...typography.bodyMd, fontSize: 13, lineHeight: 20 },
});
