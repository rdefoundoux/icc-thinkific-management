import CourseService from '../services/CourseService.js';

export const syncCourses = async (req, res) => {
    try {
        const result = await CourseService.syncCourses();
        res.json({
            success: true,
            message: `Synced ${result.processed} courses`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
