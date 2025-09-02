# School Management System API

Simple, multi-school backend to manage schools, staff, students, classes, attendance, exams, grades, fees, and library.

## Roles and Permissions (Simple)
- Super Admin (owner):
  - Can create schools and their first admin
  - Can view schools list/details
  - Cannot see or manage any internal school data
- School Admin:
  - Manages everything inside their school
  - Adds staff (teachers, accountants, librarians, etc.)
  - Creates subjects, classes, sections
  - Manages students, fees, attendance, exams, grades
- Teacher:
  - Marks attendance for assigned classes/sections
  - Enters grades for assigned subjects/classes
  - Views class/subject data
- Student/Parent:
  - Views own attendance, grades, fee summary

## Quick Start
1) Install & run
- Node 18+ and MongoDB running locally
- Copy .env (example below), then:
```
cd server
npm install
npm start
```

2) .env example (important)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school-mgmt
JWT_SECRET=super_secret_change_me
JWT_EXPIRE=30d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=200

# Super Admin auto-seed on server start
SUPER_ADMIN_EMAIL=owner@org.com
SUPER_ADMIN_PASSWORD=StrongPassword123
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin
```
- On first start, if the Super Admin email does not exist, it is created automatically.

3) Postman collection
- Import `School-Management-API.postman_collection.json`
- Use provided requests to login and call endpoints

## End-to-End Flow (Recommended Order)
This is the typical order to set up a new school and start using the system.

A) Super Admin
1. Login (POST /api/auth/login)
2. Create School + first Admin (POST /api/schools/register)
3. List/Check Schools (GET /api/schools)

B) School Admin
1. Login (POST /api/auth/login)
2. Create Teacher (POST /api/teachers) → save `teacherId`
3. Create Subject (POST /api/library/subjects) → save `subjectId`
4. Create Class (POST /api/classes)
   - Include `classTeacher: teacherId`
   - Include `subjects: [subjectId, ...]`
   - Save `classId`
5. Create Section for Class (POST /api/classes/:classId/sections) → save `sectionId`
6. Create Student (POST /api/students)
   - Include `class: classId` and optionally `section: sectionId`
   - Save `studentId`
7. Mark Attendance (POST /api/attendance/mark)
   - Provide `classId`, `sectionId` (or `section`), `date`, `academicYear`
   - Add `attendanceData[{ studentId, status, ... }]`
8. Create Exam (POST /api/exams)
   - Provide `classes: [classId, ...]`
   - Provide `subjects: [{ subject: subjectId, examiner: teacherId, date, ... }]`
   - Save `examId`
9. Create/Update Grades (POST /api/grades/batch)
   - Provide `examId`, `subjectId`, `classId`, `sectionId`
   - Provide `grades[{ studentId, marks, remarks }]`
10. Fees
    - Create Fee record for a student (POST /api/fees)
    - Record Fee payment (POST /api/fees/:feeId/pay)

Notes
- Many endpoints auto-scope to the Admin’s `school` from the token.
- ID references are validated; friendly messages are returned (e.g., "User already exists with this email", "Invalid class id").

## Project Structure (Simple Words)
```
server/
  server.js               # App bootstrap, DB connect, routes, Super Admin seed
  middleware/
    auth.js               # JWT protect + role authorize helpers
    errorHandler.js       # Returns simple error messages
    notFound.js           # 404 handler
  models/                 # Mongoose schemas (data shapes)
    School.js             # School info, subscription
    User.js               # Users (super_admin, admin, teacher, student, ...)
    Class.js              # Class with subjects, sections, class teacher
    Section.js            # Section inside a class
    Subject.js            # Subject catalog (by school)
    Student.js            # Student profile linked to User and School
    Teacher.js            # Teacher profile linked to User and School
    Attendance.js         # Attendance records (month/year auto-filled)
    Exam.js               # Exams per classes with subject entries
    Grade.js              # Marks per student/subject/exam
    Fee.js                # Fees and payments per student
    Library.js            # Books and inventory
    ... others as needed
  routes/                 # Express routes (REST endpoints)
    auth.js               # Login, me, update profile, (admin-only) register user
    schools.js            # Super Admin: register school, list/get schools
    students.js           # CRUD students, summaries
    teachers.js           # CRUD teachers
    classes.js            # CRUD classes + sections endpoints
    attendance.js         # Mark/list/summary attendance
    exams.js              # CRUD exams, results
    grades.js             # List/report grades, batch insert/update
    fees.js               # Fees CRUD and payments, summaries
    library.js            # Books + Subjects minimal CRUD/list
```

## Validations and Friendly Errors
- ObjectId pre-checks for references (class, section, subject, teacher, student, exam, etc.).
- Same-school checks for referenced entities.
- Clear messages:
  - Duplicate email → "User already exists with this email"
  - Invalid ObjectId → "Invalid <ref> id"
  - Missing required → "Please select class", "Please add academic year"
  - Not found → "<Entity> not found"
- JWT errors → "Not authorized, token invalid or expired"

## Authentication & Authorization
- JWT sent via `Authorization: Bearer <token>`
- `protect` middleware checks token
- `authorize('role1','role2')` restricts access
- School scoping: most queries filter by `school: req.user.school`

## Super Admin Seeding
- On server start, if `SUPER_ADMIN_EMAIL` doesn’t exist, an account is created automatically.
- Login as Super Admin to create schools.

## Postman Tips
- Use variables in the collection: `{{baseUrl}}`, `{{authToken}}`, `{{classId}}`, `{{sectionId}}`, `{{teacherId}}`, `{{subjectId}}`, `{{studentId}}`, `{{examId}}`, `{{feeId}}`.
- After each create, capture the ID from the response into a variable for the next steps.

## Common Troubleshooting
- CastError (Invalid ID): pass a real MongoDB ObjectId; use list endpoints to fetch valid IDs.
- Duplicate errors: try different email/employeeId/code.
- Transactions error on local MongoDB: routes fall back safely when replica set is not available.

---
This README describes the minimal, student-friendly flow and structure. You can extend endpoints and validations as your project grows.
