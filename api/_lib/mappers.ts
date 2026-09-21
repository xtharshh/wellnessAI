export function mapRecommendation(row: any) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    priority: row.priority,
    generatedAt: new Date(row.generated_at).toISOString(),
    dismissed: !!row.dismissed,
    completed: !!row.completed,
  };
}

export function mapExercise(row: any) {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration,
    steps: row.steps || [],
    explanation: row.explanation,
    category: row.category,
    custom: !!row.custom,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function mapJournal(row: any) {
  return {
    id: row.id,
    content: row.content,
    moodScore: Number(row.mood_score),
    moodTag: row.mood_tag,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function mapLifestyle(row: any) {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    category: row.category,
    description: row.description,
    reason: row.reason,
    imageUrl: row.image_url ?? undefined,
    linkUrl: row.link_url ?? undefined,
  };
}

export function mapDoctor(row: any) {
  return {
    id: row.id,
    displayName: row.display_name,
    specialty: row.specialty,
    bio: row.bio ?? null,
    avatarUrl: row.avatar_url ?? null,
    isAvailable: !!row.is_available,
    sessionUrl: row.session_url ?? null,
  };
}

export function mapAppointment(row: any) {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    scheduledAt: new Date(row.scheduled_at).toISOString(),
    mode: row.mode,
    status: row.status,
    note: row.note ?? null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
