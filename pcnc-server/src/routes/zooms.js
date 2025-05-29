import { Router } from 'express';
import AttendanceService from '../services/AttendanceService.js';
import ZoomAuth from '../config/ZoomAuth.js';

const router = Router();
const attendanceService = new AttendanceService();

// Test endpoint to verify Zoom credentials
router.get('/test-credentials', async (req, res) => {
    try {
        const zoomAuth = new ZoomAuth();

        if (!zoomAuth.isConfigured()) {
            return res.status(400).json({
                success: false,
                error: 'Zoom credentials not configured',
                details: {
                    hasClientId: !!process.env.ZOOM_API_KEY,
                    hasClientSecret: !!process.env.ZOOM_API_SECRET,
                    hasAccountId: !!process.env.ZOOM_ACCOUNT_ID
                }
            });
        }

        console.log('🔍 Testing Zoom credentials from API endpoint...');
        const success = await zoomAuth.testCredentials();

        if (success) {
            const tokenInfo = zoomAuth.getTokenInfo();
            res.json({
                success: true,
                message: 'Zoom Server-to-Server OAuth credentials are valid',
                configured: true,
                tokenInfo,
                curlCommand: zoomAuth.generateCurlCommand()
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid Zoom credentials',
                configured: true,
                curlCommand: zoomAuth.generateCurlCommand()
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Debug endpoint to show current token info
router.get('/token-info', async (req, res) => {
    try {
        const zoomAuth = new ZoomAuth();
        const tokenInfo = zoomAuth.getTokenInfo();

        res.json({
            success: true,
            tokenInfo,
            configured: zoomAuth.isConfigured()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all meetings for the authenticated user
router.get('/meetings', async (req, res) => {
    try {
        const { type = 'scheduled', userId = 'me' } = req.query;
        const meetings = await attendanceService.getUserMeetings(userId, type);
        res.json({
            success: true,
            data: meetings,
            count: meetings.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get past meetings
router.get('/meetings/past', async (req, res) => {
    try {
        const { userId = 'me', from, to } = req.query;
        const meetings = await attendanceService.getPastMeetings(userId, from, to);
        res.json({
            success: true,
            data: meetings,
            count: meetings.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get attendance for a specific meeting
router.get('/meeting/:meetingId/attendance', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const report = await attendanceService.getMeetingAttendanceReport(meetingId);
        const summary = attendanceService.generateAttendanceSummary(report.attendance);

        res.json({
            success: true,
            data: {
                meeting: report.meeting,
                attendance: report.attendance,
                summary
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get participants for a specific meeting
router.get('/meeting/:meetingId/participants', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const participants = await attendanceService.getMeetingParticipants(meetingId);

        res.json({
            success: true,
            data: participants,
            count: participants.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get bulk attendance report for multiple meetings
router.post('/meetings/bulk-attendance', async (req, res) => {
    try {
        const { meetingIds } = req.body;

        if (!meetingIds || !Array.isArray(meetingIds)) {
            return res.status(400).json({
                success: false,
                error: 'meetingIds array is required'
            });
        }

        const reports = await attendanceService.getBulkAttendanceReport(meetingIds);

        res.json({
            success: true,
            data: reports,
            count: reports.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
