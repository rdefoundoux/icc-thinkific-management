import CourseService from '../services/CourseService.js';
import { asyncHandler } from '../middleware/requestContext.js';

export const syncCourses = asyncHandler(async (_req, res) => {
    const result = await CourseService.syncCourses();
    res.json({
        success: true,
        message: `Synced ${result.processed} courses`,
    });
});
