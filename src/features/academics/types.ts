export interface LevelRecord {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  studentsCount: number
  classroomsCount: number
}

export interface ClassroomRecord {
  id: string
  name: string
  levelId?: string | null
  levelName?: string | null
  turn: string
  teacherId?: string | null
  teacherName?: string | null
  isActive: boolean
  studentsCount: number
}

export interface LevelFormValues {
  name: string
  description?: string
  isActive: boolean
}

export interface ClassroomFormValues {
  name: string
  levelId?: string
  turn: string
  teacherId?: string
  isActive: boolean
}

export interface TeacherOption {
  id: string
  fullName: string
}


