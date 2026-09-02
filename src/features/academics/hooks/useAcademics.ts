import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { ClassroomFormValues, ClassroomRecord, LevelFormValues, LevelRecord, TeacherOption } from '../types'

const academicsKeys = {
  all: ['academics'] as const,
  levels: () => [...academicsKeys.all, 'levels'] as const,
  classrooms: () => [...academicsKeys.all, 'classrooms'] as const,
  teachers: () => [...academicsKeys.all, 'teachers'] as const,
}

type ClassroomQueryRecord = {
  id: string
  name: string
  level_id?: string | null
  turn: string
  teacher_id?: string | null
  is_active: boolean
  levels?: { id: string; name: string } | { id: string; name: string }[] | null
  profiles?: { id: string; full_name: string } | { id: string; full_name: string }[] | null
  students?: Array<{ id: string }> | null
}

const fetchLevels = async (): Promise<LevelRecord[]> => {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('levels')
    .select('id, name, is_active')
    .order('name')

  if (error) throw new Error('No se pudieron cargar los niveles.')

  return (data ?? []).map((level) => ({
    id: level.id,
    name: level.name,
    isActive: level.is_active,
    studentsCount: 0,
    classroomsCount: 0,
  }))
}
const fetchClassrooms = async (): Promise<ClassroomRecord[]> => {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('classrooms')
    .select(`
      id,
      name,
      level_id,
      turn,
      teacher_id,
      is_active,
      levels ( id, name ),
      profiles ( id, full_name ),
      students ( id )
    `)
    .order('name')

  if (error) {
    throw new Error('No se pudieron cargar los salones.')
  }

  return ((data ?? []) as ClassroomQueryRecord[]).map((classroom) => {
    const level = Array.isArray(classroom.levels) ? classroom.levels[0] : classroom.levels
    const teacher = Array.isArray(classroom.profiles) ? classroom.profiles[0] : classroom.profiles

    return {
      id: classroom.id,
      name: classroom.name,
      levelId: classroom.level_id,
      levelName: level?.name ?? null,
      turn: classroom.turn,
      teacherId: classroom.teacher_id,
      teacherName: teacher?.full_name ?? null,
      isActive: classroom.is_active,
      studentsCount: classroom.students?.length ?? 0,
    }
  })
}

const fetchTeachers = async (): Promise<TeacherOption[]> => {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    throw new Error('No se pudieron cargar los docentes.')
  }

  return (data ?? []).map((teacher) => ({ id: teacher.id, fullName: teacher.full_name }))
}

const createLevel = async (values: LevelFormValues) => {
  if (!supabase) throw new Error('El servicio no está disponible en este momento. Intenta nuevamente más tarde.')

  const { error } = await supabase.from('levels').insert({
    name: values.name.trim(),
    is_active: values.isActive,
  })

  if (error) throw new Error('No se pudo registrar el nivel.')
}

const updateLevel = async ({ id, values }: { id: string; values: LevelFormValues }) => {
  if (!supabase) throw new Error('El servicio no está disponible en este momento. Intenta nuevamente más tarde.')

  const { error } = await supabase.from('levels').update({
    name: values.name.trim(),
    is_active: values.isActive,
  }).eq('id', id)

  if (error) throw new Error('No se pudo actualizar el nivel.')
}

const toggleLevelStatus = async ({ id, isActive }: { id: string; isActive: boolean }) => {
  if (!supabase) throw new Error('El servicio no está disponible en este momento. Intenta nuevamente más tarde.')

  const { error } = await supabase.from('levels').update({ is_active: isActive }).eq('id', id)
  if (error) throw new Error(isActive ? 'No se pudo activar el nivel.' : 'No se pudo desactivar el nivel.')
}

const createClassroom = async (values: ClassroomFormValues) => {
  if (!supabase) throw new Error('El servicio no está disponible en este momento. Intenta nuevamente más tarde.')

  const { error } = await supabase.from('classrooms').insert({
    name: values.name.trim(),
    level_id: values.levelId || null,
    turn: values.turn,
    teacher_id: values.teacherId || null,
    is_active: values.isActive,
  })

  if (error) throw new Error('No se pudo registrar el salón.')
}

const updateClassroom = async ({ id, values }: { id: string; values: ClassroomFormValues }) => {
  if (!supabase) throw new Error('El servicio no está disponible en este momento. Intenta nuevamente más tarde.')

  const { error } = await supabase.from('classrooms').update({
    name: values.name.trim(),
    level_id: values.levelId || null,
    turn: values.turn,
    teacher_id: values.teacherId || null,
    is_active: values.isActive,
  }).eq('id', id)

  if (error) throw new Error('No se pudo actualizar el salón.')
}

const toggleClassroomStatus = async ({ id, isActive }: { id: string; isActive: boolean }) => {
  if (!supabase) throw new Error('El servicio no está disponible en este momento. Intenta nuevamente más tarde.')

  const { error } = await supabase.from('classrooms').update({ is_active: isActive }).eq('id', id)
  if (error) throw new Error(isActive ? 'No se pudo activar el salón.' : 'No se pudo desactivar el salón.')
}

export const useAcademics = () => {
  const queryClient = useQueryClient()

  const levelsQuery = useQuery({ queryKey: academicsKeys.levels(), queryFn: fetchLevels })
  const classroomsQuery = useQuery({ queryKey: academicsKeys.classrooms(), queryFn: fetchClassrooms })
  const teachersQuery = useQuery({ queryKey: academicsKeys.teachers(), queryFn: fetchTeachers })

  const invalidateAcademics = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: academicsKeys.levels() }),
      queryClient.invalidateQueries({ queryKey: academicsKeys.classrooms() }),
      queryClient.invalidateQueries({ queryKey: ['students'] }),
    ])
  }

  const createLevelMutation = useMutation({ mutationFn: createLevel, onSuccess: invalidateAcademics })
  const updateLevelMutation = useMutation({ mutationFn: updateLevel, onSuccess: invalidateAcademics })
  const toggleLevelMutation = useMutation({ mutationFn: toggleLevelStatus, onSuccess: invalidateAcademics })
  const createClassroomMutation = useMutation({ mutationFn: createClassroom, onSuccess: invalidateAcademics })
  const updateClassroomMutation = useMutation({ mutationFn: updateClassroom, onSuccess: invalidateAcademics })
  const toggleClassroomMutation = useMutation({ mutationFn: toggleClassroomStatus, onSuccess: invalidateAcademics })

  return {
    levels: levelsQuery.data ?? [],
    classrooms: classroomsQuery.data ?? [],
    teachers: teachersQuery.data ?? [],
    isLoading: levelsQuery.isLoading || classroomsQuery.isLoading || teachersQuery.isLoading,
    error: levelsQuery.error instanceof Error
      ? levelsQuery.error.message
      : classroomsQuery.error instanceof Error
        ? classroomsQuery.error.message
        : teachersQuery.error instanceof Error
          ? teachersQuery.error.message
          : null,
    createLevel: createLevelMutation.mutateAsync,
    updateLevel: updateLevelMutation.mutateAsync,
    toggleLevelStatus: toggleLevelMutation.mutateAsync,
    createClassroom: createClassroomMutation.mutateAsync,
    updateClassroom: updateClassroomMutation.mutateAsync,
    toggleClassroomStatus: toggleClassroomMutation.mutateAsync,
    isSaving:
      createLevelMutation.isPending ||
      updateLevelMutation.isPending ||
      toggleLevelMutation.isPending ||
      createClassroomMutation.isPending ||
      updateClassroomMutation.isPending ||
      toggleClassroomMutation.isPending,
  }
}










