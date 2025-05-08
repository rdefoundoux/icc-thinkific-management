import express from 'express';
import {
    getClasses,
    getClassDetails,
    getGroups,
    getCourses,
    createClass,
    assignRoles,
    assignCourse,
    updateClass,
    getGroupUsers,
    getClassStudents,
    getClassesBySF,
    updateStudentResults,
    syncEnrollment,
    getClassesByCoordinator,
    getClassesForRegistration
} from '../controllers/classController.js';
import { assignStudents ,getClassesByTeacher} from '../controllers/classController.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Retrieves a paginated list of classes.
 * GET /api/v1/classes
 */
router.get('/', getClasses);

router.get('/registration', getClassesForRegistration);

/**
 * Retrieves a list of Thinkific groups.
 * GET /api/v1/classes/groups
 */
router.get('/groups', getGroups);

/**
 * Retrieves a list of available courses from Thinkific.
 * GET /api/v1/classes/courses
 */
router.get('/courses', getCourses);

/**
 * Fetches users belonging to a specific Thinkific group by groupId.
 * GET /api/v1/classes/groups/:groupId/users
 */
router.get('/groups/:groupId/users', getGroupUsers);

// Get classes by teacher
router.get('/teacher/:teacherId', getClassesByTeacher);

/**
 * Retrieves detailed information about a single class by ID.
 * GET /api/v1/classes/:id
 */
router.get('/:id', getClassDetails);

router.get('/:classId/students', getClassStudents);

router.get('/sf/:sfId', getClassesBySF);


router.get('/coordinator/:coordinatorId', getClassesByCoordinator);


/**
 * Creates a new class (and corresponding Thinkific group).
 * POST /api/v1/classes
 */
router.post('/', createClass);

/**
 * Assigns a role (teacher, coordinator, RSF, SF) to a user or list of users.
 * POST /api/v1/classes/:classId/roles
 */
router.post('/:classId/roles', assignRoles);

/**
 * Assigns a Thinkific course to a class, enrolling its users in that course.
 * POST /api/v1/classes/:classId/courses
 */
router.post('/:classId/courses', assignCourse);

/**
 * Assigns students to a class (protected by isAdmin middleware).
 * POST /api/v1/classes/:classId/students
 */
router.post('/:classId/students',  assignStudents);


router.post('/sync-enrollment', syncEnrollment);



/**
 * Updates an existing class by ID.
 * PUT /api/v1/classes/:id
 */
router.put('/:id', updateClass);


router.patch('/students/:studentId/results', updateStudentResults);

export default router;
