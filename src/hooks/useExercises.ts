import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from '@/src/services/exercises';
import { useAuthStore } from '@/src/stores/authStore';
import { Exercise } from '@/src/types/wellness';

export function useExercises() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['exercises', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return getExercises(user.id);
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'custom'> & { custom?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      return createExercise(user.id, exercise);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', user?.id] });
    },
  });

  const edit = useMutation({
    mutationFn: async ({ id, exercise }: { id: string; exercise: Partial<Omit<Exercise, 'id' | 'createdAt'>> }) => {
      if (!user) throw new Error('Not authenticated');
      return updateExercise(user.id, id, exercise);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', user?.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteExercise(user.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', user?.id] });
    },
  });

  return { ...query, add, edit, remove };
}
