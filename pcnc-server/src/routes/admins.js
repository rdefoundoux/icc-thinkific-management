import express from 'express';
import {
    getAdminClasses, getPendingStudents, validateStudents,
    syncThinkificUsers, getCoordinators, getSFs
} from '../controllers/adminController.js';


const router = express.Router();



router.get('/classes', getAdminClasses);
router.get('/pending-students', getPendingStudents);
router.get('/coordinators', getCoordinators);
router.get('/sfs', getSFs);
router.post('/validate-students', validateStudents);
router.post('/sync-thinkific', syncThinkificUsers);


export default router;
