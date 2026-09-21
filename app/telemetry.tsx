import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CalmCard, CalmHeader, CalmScreen, EmptyArt, MoodCurve, Serif, useCalm } from '@/src/components/calm/kit';
import { getLiveMetrics } from '@/src/services/realAnalytics';
import { fonts } from '@/src/theme/typography';

export default function TelemetryScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const mountRef = React.useRef(Date.now());
  const [moodHistory, setMoodHistory] = useState<number[]>([]);
  const [stressHistory, setStressHistory] = useState<number[]>([]);
  const [activityHistory, setActivityHistory] = useState<number[]>([]);

  useEffect(() => {
    const t = setInterval(() => setSessionTime(Math.floor((Date.now() - mountRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      const metrics = await getLiveMetrics();
      if (!active) return;
      setTelemetry(metrics);
      if (typeof metrics.moodScore === 'number') {
        const v: number = metrics.moodScore;
        setMoodHistory((p) => [...p.slice(-9), v]);
      }
      if (typeof metrics.stressIndex === 'number') {
        const v: number = metrics.stressIndex;
        setStressHistory((p) => [...p.slice(-9), v]);
      }
      if (typeof metrics.activityLevel === 'number') {
        const v: number = metrics.activityLevel;
        setActivityHistory((p) => [...p.slice(-9), v]);
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const hasSignal = telemetry?.hasSufficientData === true;
  const mins = Math.floor(sessionTime / 60);
  const secs = String(sessionTime % 60).padStart(2, '0');

  const rows: { label: string; value: string; pct: number }[] = [
    {
      label: 'Typing Cadence',
      value: telemetry?.rawSignals?.avgKeyInterval != null ? `${telemetry.rawSignals.avgKeyInterval} ms avg` : '—',
      pct: telemetry?.rawSignals?.avgKeyInterval != null ? Math.min(100, (telemetry.rawSignals.avgKeyInterval / 600) * 100) : 0,
    },
    {
      label: 'Backspace Ratio',
      value: telemetry?.rawSignals?.backspaceRatio != null ? `${telemetry.rawSignals.backspaceRatio}% corrections` : '—',
      pct: telemetry?.rawSignals?.backspaceRatio != null ? Math.min(100, (telemetry.rawSignals.backspaceRatio / 30) * 100) : 0,
    },
    {
      label: 'Accel. G-Force',
      value: telemetry?.rawSignals?.motionMagnitude != null ? `${telemetry.rawSignals.motionMagnitude} g` : '—',
      pct: telemetry?.rawSignals?.motionMagnitude != null ? Math.min(100, (telemetry.rawSignals.motionMagnitude / 2) * 100) : 0,
    },
    {
      label: 'Sleep Gap Est.',
      value: telemetry?.sleepHours != null ? `${Number(telemetry.sleepHours).toFixed(1)} hours` : '—',
      pct: telemetry?.sleepHours != null ? Math.min(100, (telemetry.sleepHours / 12) * 100) : 0,
    },
  ];

  const live = (arr: number[]) => (arr.length ? arr : [0, 0]);

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <View style={styles.head}>
        <Serif style={[styles.title, { color: c.ink }]}>Live Telemetry</Serif>
        <View style={[styles.session, { backgroundColor: c.limeSoft }]}>
          <Text style={[styles.sessionText, { color: c.limeInk }]}>
            {mins}:{secs}
          </Text>
        </View>
      </View>
      <Text style={[styles.polling, { color: c.muted }]}>Live • 1s polling • real signals only</Text>

      {!hasSignal ? (
        <CalmCard tint="sage">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <EmptyArt kind="moon" size={100} />
            <Text style={[styles.waiting, { color: c.muted, textAlign: 'center' }]}>
              Waiting for real signal. Type, scroll, or move your device — values appear only from live interaction or Android UsageStats.
            </Text>
          </View>
        </CalmCard>
      ) : null}

      <View style={styles.trio}>
        {[
          { label: 'MOOD', data: live(moodHistory), val: telemetry?.moodScore },
          { label: 'STRESS', data: live(stressHistory), val: telemetry?.stressIndex },
          { label: 'ACTIVITY', data: live(activityHistory), val: telemetry?.activityLevel },
        ].map((w) => (
          <CalmCard key={w.label} style={{ flex: 1 }}>
            <Text style={[styles.miniLabel, { color: c.muted }]}>{w.label}</Text>
            <Text style={[styles.miniVal, { color: c.ink }]}>{w.val ?? '—'}</Text>
            <MoodCurve data={w.data} width={86} height={30} />
          </CalmCard>
        ))}
      </View>

      <CalmCard>
        <Text style={[styles.sectionLabel, { color: c.muted }]}>RAW SIGNAL FEED</Text>
        <View style={{ gap: 12, marginTop: 8 }}>
          {rows.map((r) => (
            <View key={r.label} style={{ gap: 6 }}>
              <View style={styles.feedRow}>
                <Text style={[styles.feedLabel, { color: c.ink }]}>{r.label}</Text>
                <Text style={[styles.feedVal, { color: c.ink }]}>{r.value}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: c.bg }]}>
                <View style={[styles.fill, { width: `${r.pct}%`, backgroundColor: c.ink }]} />
              </View>
            </View>
          ))}
        </View>
      </CalmCard>

      <CalmCard tint="lavender">
        <Text style={[styles.sectionLabel, { color: c.muted }]}>STRESS FORMULA (REAL)</Text>
        <Text style={[styles.formula, { color: c.ink }]}>
          {`stress = 30\n+ speed(avg<250ms ? +25 : avg>600ms ? +15 : 0)\n+ errors(backspace_ratio × 250, cap 45)\n+ unlocks(>25 ? +0…20 : 0)`}
        </Text>
      </CalmCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <Feather name="cpu" size={13} color={c.muted} />
        <Text style={[styles.polling, { color: c.muted }]}>Formula shown for transparency — tap values update live.</Text>
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28 },
  session: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  sessionText: { fontFamily: fonts.bold, fontSize: 12 },
  polling: { fontFamily: fonts.semiBold, fontSize: 11, marginTop: -8 },
  waiting: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  trio: { flexDirection: 'row', gap: 10 },
  miniLabel: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.8 },
  miniVal: { fontSize: 24, lineHeight: 28, fontWeight: '800' },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  feedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedLabel: { fontFamily: fonts.semiBold, fontSize: 13 },
  feedVal: { fontFamily: fonts.bold, fontSize: 13 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  formula: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
