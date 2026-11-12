// Run: node --test tests/hotfix.test.mjs. No network or production credentials.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)

// Exercise the actual schemas and persistence functions, replacing only external services/UI.
function load(file, names = [], service = null) {
  const path = resolve(file)
  const source = readFileSync(path, 'utf8') + `\nexport { ${names.join(', ')} };`
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const module = { exports: {} }
  const localRequire = (id) => {
    if (id.endsWith('/supabase')) return { supabase: service }
    if (id.endsWith('/contactValidation')) return load(resolve(dirname(path), `${id}.ts`))
    if (id === 'zod' || id === 'react' || id === 'react/jsx-runtime' || id === 'react-hook-form' || id === '@hookform/resolvers/zod') return require(id)
    return {} // Imports unused by the tested persistence functions and schemas.
  }
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
  return module.exports
}

function database() {
  const tables = {
    levels: [{ id: 'level-1', name: 'Preescolar 1' }, { id: 'level-3', name: 'Preescolar 3' }],
    classrooms: [{ id: 'room', name: 'Salón ficticio', level_id: 'level-1' }],
    students: [], guardians: [], student_guardians: [],
  }
  let serial = 0
  return {
    tables,
    from(table) {
      let operation = 'select', payload, single = false, columns = ''
      const filters = []
      const query = {
        select(value) { columns = value; return query },
        insert(value) { operation = 'insert'; payload = value; return query },
        update(value) { operation = 'update'; payload = value; return query },
        eq(key, value) { filters.push([key, value]); return query },
        single() { single = true; return query },
        maybeSingle() { single = true; return query },
        order() { return query },
        range() { return query },
        then(ok, fail) {
          try {
            let rows = tables[table].filter((row) => filters.every(([key, value]) => row[key] === value))
            if (operation === 'insert') {
              const row = { id: `fake-${++serial}`, ...payload }
              tables[table].push(row)
              rows = [row]
            }
            if (operation === 'update') rows.forEach((row) => Object.assign(row, payload))
            if (table === 'students' && operation === 'select') {
              // Fail if read queries forget the new relationship (list or detail).
              assert.match(columns, /student_level:levels!students_level_id_fkey/)
              rows = rows.map((row) => {
                const room = tables.classrooms.find((item) => item.id === row.classroom_id)
                return {
                  ...row,
                  student_level: tables.levels.find((item) => item.id === row.level_id),
                  classrooms: { ...room, levels: tables.levels.find((item) => item.id === room.level_id) },
                  guardians: tables.guardians.find((item) => item.id === row.primary_guardian_id),
                }
              })
            }
            return Promise.resolve({ data: structuredClone(single ? rows[0] ?? null : rows), error: null }).then(ok, fail)
          } catch (error) { return Promise.reject(error).then(ok, fail) }
        },
      }
      return query
    },
  }
}

const guardianValues = {
  fullName: 'Persona Ficticia', document: 'V-99999999', phone: '04121234567',
  email: '', address: 'Dirección ficticia', isActive: true,
}
const studentValues = {
  firstName: 'Alumno', lastName: 'Ficticio', document: '', birthDate: '2022-01-01',
  levelId: 'level-1', classroomId: 'room', monthlyFee: 10, currency: 'USD',
  enrollmentDate: '2026-11-12',
}

test('both forms accept optional email, validate provided email and Venezuelan phones', () => {
  const { guardianSchema } = load('src/features/guardians/components/GuardianForm.tsx', ['guardianSchema'])
  const { studentSchema } = load('src/features/students/components/StudentForm.tsx', ['studentSchema'])
  for (const phone of ['04121234567', '+584121234567', '0412-1234567', '+58 (412) 123-45-67', '0212 123 4567']) {
    for (const email of ['', '   ', 'prueba@example.test']) {
      assert.equal(guardianSchema.safeParse({ ...guardianValues, phone, email, isActive: 'true' }).success, true)
      assert.equal(studentSchema.safeParse({
        ...studentValues, representativeMode: 'new', newGuardianName: guardianValues.fullName,
        newGuardianDocument: guardianValues.document, newGuardianAddress: guardianValues.address,
        newGuardianPhone: phone, newGuardianEmail: email,
      }).success, true)
    }
  }
  for (const phone of ['0412123', '+58412123', '041212345678', 'abc04121234567', '00000000000', '4121234567']) {
    const result = guardianSchema.safeParse({ ...guardianValues, phone, isActive: 'true' })
    assert.equal(result.success, false)
    assert.match(result.error.issues.find((issue) => issue.path[0] === 'phone').message, /venezolano completo/)
    assert.equal(studentSchema.safeParse({ ...studentValues, representativeMode: 'new',
      newGuardianName: guardianValues.fullName, newGuardianDocument: guardianValues.document,
      newGuardianAddress: guardianValues.address, newGuardianPhone: phone,
    }).success, false)
  }
  assert.equal(guardianSchema.safeParse({ ...guardianValues, email: 'invalido', isActive: 'true' }).success, false)
  assert.equal(studentSchema.safeParse({ ...studentValues, representativeMode: 'new',
    newGuardianName: guardianValues.fullName, newGuardianDocument: guardianValues.document,
    newGuardianAddress: guardianValues.address, newGuardianPhone: guardianValues.phone,
    newGuardianEmail: 'invalido',
  }).success, false)
})

test('guardian create/edit and subsequent reads preserve empty/valid email and reject bad contacts', async () => {
  const db = database()
  const api = load('src/features/guardians/hooks/useGuardians.ts', ['createGuardian', 'updateGuardian', 'fetchGuardianDetail'], db)
  await api.createGuardian(guardianValues)
  const id = db.tables.guardians[0].id
  assert.equal(db.tables.guardians[0].email, null)
  assert.equal((await api.fetchGuardianDetail(id)).email, 'Sin email')
  await api.createGuardian({ ...guardianValues, email: 'prueba@example.test', phone: '+584121234567' })
  assert.equal((await api.fetchGuardianDetail(db.tables.guardians[1].id)).email, 'prueba@example.test')
  await api.updateGuardian({ id, values: { ...guardianValues, email: 'editado@example.test' } })
  assert.equal((await api.fetchGuardianDetail(id)).email, 'editado@example.test')
  await api.updateGuardian({ id, values: guardianValues })
  assert.equal(db.tables.guardians[0].email, null)
  await assert.rejects(api.createGuardian({ ...guardianValues, phone: '0412' }))
  await assert.rejects(api.updateGuardian({ id, values: { ...guardianValues, email: 'invalido' } }))
  assert.equal(db.tables.guardians.length, 2)
})

test('Preescolar 1 and 3 share one classroom, retain independent levels after reload/edit and preserve legacy records', async () => {
  const db = database()
  const api = load('src/features/students/hooks/useStudents.ts', ['createStudent', 'updateStudent', 'fetchStudents', 'mapStudentRecord'], db)
  await api.createStudent({ ...studentValues, newGuardian: guardianValues })
  const guardianId = db.tables.guardians[0].id
  assert.equal(db.tables.guardians[0].email, null)
  await api.createStudent({ ...studentValues, levelId: 'level-3', guardianId })
  let students = await api.fetchStudents()
  assert.deepEqual(students.map((item) => [item.level, item.classroomId]), [
    ['Preescolar 1', 'room'], ['Preescolar 3', 'room'],
  ])
  await api.updateStudent({ id: students[0].id, values: { ...studentValues, levelId: 'level-3', guardianId } })
  students = await api.fetchStudents()
  assert.equal(students[0].level, 'Preescolar 3')
  assert.equal(students[1].level, 'Preescolar 3')
  const legacy = api.mapStudentRecord({ ...db.tables.students[0], level_id: null,
    classrooms: { ...db.tables.classrooms[0], levels: db.tables.levels[0] },
  })
  assert.equal(legacy.level, 'Preescolar 1')
  assert.equal(legacy.levelId, 'level-1')
  await assert.rejects(api.createStudent({ ...studentValues, newGuardian: { ...guardianValues, phone: '0412' } }))
  assert.equal(db.tables.students.length, 2)
})
