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
}

export default AttendanceService;
