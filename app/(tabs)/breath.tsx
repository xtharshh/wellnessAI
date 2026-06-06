import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Vibration } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

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

  const [techniqueId, setTechniqueId] = useState('relax478');
  const [isRunning, setIsRunning]           = useState(false);
  const [progress, setProgress]             = useState(0);   // actual cycle progress 0–1
  const [knotDisplayProgress, setKnotDisplayProgress] = useState(0); // knot display (pauses at boundaries)
  const [activePhaseName, setActivePhaseName] = useState<PhaseType | 'idle'>('idle');
  const [phaseProgress, setPhaseProgress]     = useState(0);
  const [secondsLeft, setSecondsLeft]         = useState(0);
  const [cycle, setCycle]                     = useState(0);

  const startTimeRef        = useRef<number>(0);
  const lastPhaseRef        = useRef<string>('idle');
  const cycleCountRef       = useRef<number>(0);
  const knotPausedUntilRef  = useRef<number>(0); // timestamp until knot is frozen at boundary

  const technique     = TECHNIQUES[techniqueId];
  const totalDuration = technique.phases.reduce((s, p) => s + p.duration, 0);
  const segments      = buildSegments(technique.phases);

  // Stop when technique changes mid-session
  useEffect(() => { if (isRunning) stopSession(); }, [techniqueId]);

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

      // Haptic + knot pause on phase transition
      if (activePhase.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = activePhase.phase;
        try { Vibration.vibrate(100); } catch {}
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
    }, 50);

    return () => clearInterval(id);
  }, [isRunning, techniqueId]);

  const startSession = () => {
    startTimeRef.current  = Date.now();
    lastPhaseRef.current  = 'idle';
    cycleCountRef.current = 0;
    setCycle(0);
    setPhaseProgress(0);
    setActivePhaseName('idle');
    setIsRunning(true);
  };

  const stopSession = () => {
    setIsRunning(false);
    setProgress(0);
    setKnotDisplayProgress(0);
    setActivePhaseName('idle');
    setPhaseProgress(0);
    setSecondsLeft(0);
    setCycle(0);
    cycleCountRef.current      = 0;
    lastPhaseRef.current       = 'idle';
    knotPausedUntilRef.current = 0;
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

  return (
    <ScreenContainer contentStyle={styles.container}>

      {/* ── Header Banner ── */}
      <LinearGradient
        colors={isDark ? ['#1a1030', '#0a0b10'] : ['#a2cbfd', '#f7bee9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBanner, { borderBottomColor: colors.outline }]}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCol}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Text style={[styles.avatarText, { color: isDark ? colors.primary : '#0f172a' }]}>{initials}</Text>
            </View>
            <View>
              <Text style={[styles.eyebrow, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.55)' }]}>
                Breathe & Rest
              </Text>
              <Text style={[styles.headerTitle, { color: isDark ? colors.onSurface : '#0f172a' }]}>
                Breathwork Coach
              </Text>
            </View>
          </View>
          <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
            <Feather name="wind" size={18} color={isDark ? colors.primary : '#3b82f6'} />
          </View>
        </View>
      </LinearGradient>

      {/* ── Technique Pill Selector ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillRow}>
        {TECHNIQUE_ORDER.map((id) => {
          const t = TECHNIQUES[id];
          const active = id === techniqueId;
          return (
            <Pressable
              key={id}
              onPress={() => setTechniqueId(id)}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? t.tagColor : colors.surface,
                  borderColor: active ? t.tagColor : colors.outline,
                },
              ]}>
              <Feather name={t.icon} size={12} color={active ? '#0f172a' : colors.onSurfaceVariant} style={{ marginRight: 5 }} />
              <Text style={[styles.pillLabel, { color: active ? '#0f172a' : colors.onSurfaceVariant }]}>
                {t.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── "Best for" Tag ── */}
      <View style={[styles.tagBadge, { backgroundColor: technique.tagColor + '22' }]}>
        <Text style={[styles.tagText, { color: technique.tagColor === '#ffdc62' ? '#a16207' : technique.tagColor }]}>
          Best for: {technique.bestFor}
        </Text>
      </View>

      {/* ── SVG Donut Ring + Knot (no Animated.createAnimatedComponent — web-safe) ── */}
      <View style={styles.ringArea}>
        {/* SVG layer: track + colored segments + circular knot */}
        <Svg
          width={RING}
          height={RING}
          style={StyleSheet.absoluteFill}>

          {/* Background track */}
          <Circle
            cx={RING / 2} cy={RING / 2} r={SVG_R}
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
            strokeWidth={SVG_SW}
            fill="transparent"
          />

          {/* Colored phase segments — strokeLinecap round gives natural end-caps */}
          {segments.map((seg) => (
            <Circle
              key={seg.phase}
              cx={RING / 2} cy={RING / 2} r={SVG_R}
              stroke={seg.segmentColor}
              strokeWidth={SVG_SW}
              fill="transparent"
              strokeDasharray={`${seg.dashLen} ${SVG_C}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          ))}

          {/* Circle knot: a 2-unit dash with strokeLinecap="round" becomes a perfect circle
              positioned at the current progress point on the ring */}
          <Circle
            cx={RING / 2} cy={RING / 2} r={SVG_R}
            stroke={isRunning ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)')}
            strokeWidth={SVG_SW + 6}
            fill="transparent"
            strokeDasharray={`2 ${SVG_C}`}
            strokeDashoffset={-(knotDisplayProgress * SVG_C - 1)}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </Svg>

        {/* Inner breathing circle — View-based scale, no SVG needed */}
        <View
          style={[
            styles.breathCircle,
            {
              backgroundColor: circleColor,
              transform: [{ scale: circleScale }],
            },
          ]}
        />

        {/* Glow halo behind inner circle */}
        <View
          style={[
            styles.halo,
            {
              backgroundColor: circleColor,
              opacity: isRunning ? 0.18 : 0.06,
              transform: [{ scale: circleScale * 1.3 }],
            },
          ]}
        />

        {/* Text overlay */}
        <View style={styles.ringTextOverlay} pointerEvents="none">
          <Text style={[styles.phaseLabel, { color: activePhaseData?.accentColor ?? colors.primary }]}>
            {(activePhaseName === 'idle' ? technique.idleLabel : (activePhaseData?.label ?? '')).toUpperCase()}
          </Text>
          <Text style={[styles.secondsText, { color: colors.onSurface }]}>
            {isRunning ? `${secondsLeft}s` : '—'}
          </Text>
          <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
            {activePhaseName === 'idle' ? 'Tap start to begin' : (activePhaseData?.instruction ?? '')}
          </Text>
        </View>
      </View>



      {/* ── Start / Stop ── */}
      <Pressable
        style={[styles.controlBtn, { backgroundColor: isRunning ? '#ef4444' : '#0f172a' }]}
        onPress={isRunning ? stopSession : startSession}>
        <Feather name={isRunning ? 'square' : 'play'} size={15} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.controlBtnText}>
          {isRunning ? 'Stop Session' : 'Start Breathwork'}
        </Text>
      </Pressable>

      {cycle > 0 && (
        <Text style={[styles.cycleCounter, { color: colors.primary }]}>
          {cycle} {cycle === 1 ? 'cycle' : 'cycles'} completed ✓
        </Text>
      )}

      {/* ── Phase Breakdown Cards ── */}
      <View style={styles.breakdownRow}>
        {technique.phases.map((p) => (
          <View
            key={p.phase}
            style={[
              styles.breakdownCard,
              {
                backgroundColor: colors.surface,
                borderColor: activePhaseName === p.phase ? p.segmentColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                borderWidth: activePhaseName === p.phase ? 2 : 1,
              },
            ]}>
            <View style={[styles.cardIconCircle, { backgroundColor: p.iconBg }]}>
              <Feather name={p.icon} size={13} color={p.accentColor} />
            </View>
            <Text style={[styles.cardLabel, { color: colors.onSurface }]}>{p.label}</Text>
            <Text style={[styles.cardVal,   { color: p.accentColor  }]}>{p.duration}s</Text>
          </View>
        ))}
      </View>

      {/* ── Benefit Card ── */}
      <GlassCard accent="primary" style={styles.benefitCard}>
        <View style={styles.benefitHeader}>
          <View style={[styles.benefitIcon, { backgroundColor: technique.tagColor + '22' }]}>
            <Feather name="info" size={13} color={technique.tagColor === '#ffdc62' ? '#a16207' : technique.tagColor} />
          </View>
          <Text style={[styles.benefitTitle, { color: colors.onSurface }]}>Physiology & Benefits</Text>
        </View>
        <Text style={[styles.benefitText, { color: colors.onSurfaceVariant }]}>
          {technique.benefit}
        </Text>
      </GlassCard>

    </ScreenContainer>
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

  // Header
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
