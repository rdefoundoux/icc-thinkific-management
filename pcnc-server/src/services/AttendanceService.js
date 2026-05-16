import axios from 'axios';
import moment from 'moment';
import ZoomAuth from '../config/ZoomAuth.js';

class AttendanceService {
    constructor() {
        this.zoom = new ZoomAuth();
        this.baseURL = 'https://api.zoom.us/v2';

        if (!this.zoom.isConfigured()) {
            console.warn('⚠️ Zoom API credentials not properly configured. Please check your environment variables.');
        } else {
            console.log('✅ Zoom API credentials loaded successfully');
        }
    }

    // Validate meeting ID format
    validateMeetingId(meetingId) {
        if (!meetingId) throw new Error('Meeting ID is required');
        const cleanId = meetingId.toString().replace(/\s/g, '');
        if (!/^\d{9,11}$/.test(cleanId)) throw new Error('Invalid meeting ID format. Must be 9-11 digits');
        return cleanId;
    }

    // Enhanced error handling for API calls
    async makeZoomAPICall(url, options = {}) {
        try {
            const headers = await this.zoom.getAuthHeaders();
            const response = await axios({
                url,
                headers,
                ...options
            });
            return response;
        } catch (error) {
            if (error.response?.status === 401) {
                // Token might be expired, clear cache and try once more
                console.log('🔄 Access token expired, refreshing...');
                this.zoom.clearToken();
                const headers = await this.zoom.getAuthHeaders();
                const response = await axios({
                    url,
                    headers,
                    ...options
                });
                return response;
            }
            throw error;
        }
    }

    // Get meeting participants/attendance (handles both live and past meetings)
    async getMeetingParticipants(meetingId) {
        const validMeetingId = this.validateMeetingId(meetingId);

        try {
            // Try live meeting endpoint first
            try {
                const response = await this.makeZoomAPICall(
                    `${this.baseURL}/meetings/${validMeetingId}/participants`,
                    {
                        method: 'GET',
                        params: { page_size: 300 }
                    }
                );
                return response.data.participants || [];
            } catch (error) {
                // If endpoint not recognized, try past meeting endpoint
                if (error.response?.data?.code === 2300 || error.response?.data?.message?.includes('not recognized')) {
                    const response = await this.makeZoomAPICall(
                        `${this.baseURL}/past_meetings/${validMeetingId}/participants`,
                        {
                            method: 'GET',
                            params: { page_size: 300 }
                        }
                    );
                    return response.data.participants || [];
                }
                throw error;
            }
        } catch (error) {
            console.error('Error fetching participants:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get detailed meeting report with attendance
    async getMeetingAttendanceReport(meetingId) {
        const validMeetingId = this.validateMeetingId(meetingId);

        try {
            // Get meeting details (live or past)
            let meetingResponse;
            try {
                meetingResponse = await this.makeZoomAPICall(
                    `${this.baseURL}/meetings/${validMeetingId}`,
                    { method: 'GET' }
                );
            } catch (error) {
                if (error.response?.data?.code === 2300 || error.response?.data?.message?.includes('not recognized')) {
                    meetingResponse = await this.makeZoomAPICall(
                        `${this.baseURL}/past_meetings/${validMeetingId}`,
                        { method: 'GET' }
                    );
                } else {
                    throw error;
                }
            }

            // Get participants
            const participants = await this.getMeetingParticipants(validMeetingId);

            return {
                meeting: meetingResponse.data,
                attendance: participants.map(participant => ({
                    id: participant.id,
                    user_id: participant.user_id,
                    name: participant.name,
                    user_email: participant.user_email,
                    join_time: participant.join_time,
                    leave_time: participant.leave_time,
                    duration: participant.duration,
                    status: participant.status,
                    registrant_id: participant.registrant_id
                }))
            };
        } catch (error) {
            console.error('Error generating attendance report:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get list of meetings for a user
    async getUserMeetings(userId = 'me', type = 'scheduled') {
        try {
            const response = await this.makeZoomAPICall(
                `${this.baseURL}/users/${userId}/meetings`,
                {
                    method: 'GET',
                    params: {
                        type,
                        page_size: 300
                    }
                }
            );
            return response.data.meetings;
        } catch (error) {
            console.error('Error fetching meetings:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get past meetings (completed meetings)
    async getPastMeetings(userId = 'me', from, to) {
        try {
            const params = {
                page_size: 300,
                type: 'previous_meetings'
            };
            if (from) params.from = from;
            if (to) params.to = to;

            const response = await this.makeZoomAPICall(
                `${this.baseURL}/users/${userId}/meetings`,
                {
                    method: 'GET',
                    params
                }
            );
            return response.data.meetings;
        } catch (error) {
            console.error('Error fetching past meetings:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get attendance summary statistics
    generateAttendanceSummary(attendanceData) {
        const summary = {
            totalParticipants: attendanceData.length,
            averageDuration: 0,
            participantList: [],
            joinTimes: [],
            leaveTimes: []
        };

        if (attendanceData.length === 0) return summary;

        let totalDuration = 0;
        attendanceData.forEach(participant => {
            totalDuration += participant.duration || 0;
            summary.participantList.push({
                name: participant.name,
                email: participant.user_email,
                duration: participant.duration,
                joinTime: participant.join_time,
                leaveTime: participant.leave_time
            });

            if (participant.join_time) summary.joinTimes.push(participant.join_time);
            if (participant.leave_time) summary.leaveTimes.push(participant.leave_time);
        });

        summary.averageDuration = Math.round(totalDuration / attendanceData.length);

        return summary;
    }

    // Bulk attendance for multiple meetings
    async getBulkAttendanceReport(meetingIds) {
        const reports = [];
        for (const meetingId of meetingIds) {
            try {
                const report = await this.getMeetingAttendanceReport(meetingId);
                reports.push(report);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Avoid rate limiting
            } catch (error) {
                console.error(`Failed to get attendance for meeting ${meetingId}:`, error.message);
                reports.push({
                    meetingId,
                    error: error.message
                });
            }
        }
        return reports;
    }


    // Create a single meeting
    async createMeeting(userId, meetingParams) {
        const headers = await this.zoom.getAuthHeaders();
        try {
            const response = await axios.post(
                `${this.baseURL}/users/${userId}/meetings`,
                meetingParams,
                { headers }
            );
            return {
                success: true,
                meetingId: response.data.id,
                joinUrl: response.data.join_url,
                userId
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                userId
            };
        }
    }
// Add to AttendanceService.js
    async createAutoAssignedMeeting(meetingParams, userIds, concurrencyLimit = 1) {
        const startMoment = moment(meetingParams.start_time);
        const endMoment = startMoment.clone().add(meetingParams.duration, 'minutes');

        // Get current meetings for all users
        const userMeetings = new Map();
        for (const userId of userIds) {
            try {
                const meetings = await this.getUserMeetings(userId, 'scheduled');
                userMeetings.set(userId, meetings.map(m => ({
                    start: moment(m.start_time),
                    end: moment(m.start_time).add(m.duration, 'minutes')
                })));
            } catch (error) {
                console.error(`Failed to get meetings for ${userId}:`, error.message);
                userMeetings.set(userId, []);
            }
        }

        // Find first available user
        for (const [userId, meetings] of userMeetings) {
            const concurrentCount = meetings.filter(existing =>
                startMoment.isBefore(existing.end) &&
                endMoment.isAfter(existing.start)
            ).length;

            if (concurrentCount < concurrencyLimit) {
                const result = await this.createMeeting(userId, meetingParams);
                return {
                    ...result,
                    autoAssigned: true,
                    userId
                };
            }
        }

        return {
            success: false,
            error: "No available users for this time slot"
        };
    }


    async scheduleMeetings(meetings, userIds, concurrencyLimit = 2) {
        const scheduled = [];
        const failed = [];
        const userSchedules = new Map();

        // Initialize user schedules
        userIds.forEach(userId => {
            userSchedules.set(userId, {
                currentMeetings: [],
                concurrencyLimit: concurrencyLimit
            });
        });

        for (const meeting of meetings) {
            let assignedUser = null;

            // Calculate end time from duration
            const startMoment = moment(meeting.start_time);
            const endMoment = startMoment.clone().add(meeting.duration, 'minutes');

            // Find first available user
            for (const [userId, schedule] of userSchedules) {
                const overlappingMeetings = schedule.currentMeetings.filter(existing => {
                    const existingStart = moment(existing.start_time);
                    const existingEnd = existingStart.clone().add(existing.duration, 'minutes');
                    return startMoment.isBefore(existingEnd) && endMoment.isAfter(existingStart);
                });

                if (overlappingMeetings.length < schedule.concurrencyLimit) {
                    assignedUser = userId;
                    break;
                }
            }

            if (!assignedUser) {
                failed.push({
                    ...meeting,
                    error: "No available users for this time slot"
                });
                continue;
            }

            try {
                const result = await this.createMeeting(assignedUser, meeting);
                if (result.success) {
                    scheduled.push({
                        ...meeting,
                        userId: assignedUser,
                        meetingId: result.meetingId,
                        joinUrl: result.joinUrl
                    });
                    userSchedules.get(assignedUser).currentMeetings.push(meeting);
                } else {
                    failed.push({
                        ...meeting,
                        error: result.error
                    });
                }
                // Add delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failed.push({
                    ...meeting,
                    error: error.message
                });
            }
        }

        return { scheduled, failed };
    }

}

export default AttendanceService;
