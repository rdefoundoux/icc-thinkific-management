import axios from 'axios';
import moment from 'moment';
import ZoomAuth from '../config/ZoomAuth.js';

class AttendanceService {
    constructor() {
        this.zoom = new ZoomAuth();
        this.baseURL = 'https://api.zoom.us/v2';

        // Verify configuration on initialization
        if (!this.zoom.isConfigured()) {
            console.warn('⚠️ Zoom API credentials not properly configured. Please check your environment variables.');
        } else {
            console.log('✅ Zoom API credentials loaded successfully');
        }
    }

    // Validate meeting ID format
    validateMeetingId(meetingId) {
        if (!meetingId) {
            throw new Error('Meeting ID is required');
        }

        // Remove any spaces or special characters except numbers
        const cleanId = meetingId.toString().replace(/\s/g, '');

        // Validate it's numeric and has reasonable length (Zoom meeting IDs are typically 9-11 digits)
        if (!/^\d{9,11}$/.test(cleanId)) {
            throw new Error('Invalid meeting ID format. Must be 9-11 digits');
        }

        return cleanId;
    }

    // Enhanced error handling for API calls
    // In AttendanceService.js
    async makeZoomAPICall(url, options = {}) {
        try {
            const headers = await this.zoom.getAuthHeaders(); // ✅ Corrected
            const response = await axios({
                url,
                headers,
                ...options
            });
            return response;
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('🔄 Access token expired, refreshing...');
                this.zoom.clearToken();

                const headers = await this.zoom.getAuthHeaders(); // ✅ Corrected
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

    // Get meeting participants/attendance
    async getMeetingParticipants(meetingId) {
        const validMeetingId = this.validateMeetingId(meetingId);

        try {
            const response = await this.makeZoomAPICall(
                `${this.baseURL}/meetings/${validMeetingId}/participants`,
                {
                    method: 'GET',
                    params: {
                        page_size: 300
                    }
                }
            );
            return response.data.participants || [];
        } catch (error) {
            console.error('Error fetching participants:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get detailed meeting report with attendance
    async getMeetingAttendanceReport(meetingId) {
        const validMeetingId = this.validateMeetingId(meetingId);

        try {
            // Get meeting details
            const meetingResponse = await this.makeZoomAPICall(
                `${this.baseURL}/meetings/${validMeetingId}`,
                { method: 'GET' }
            );

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

    // Get attendance for the default meeting
    async getDefaultMeetingAttendance() {
        if (!this.defaultMeetingId) {
            throw new Error('No default meeting ID configured. Please set DEFAULT_MEETING_ID in your .env file');
        }
        return await this.getMeetingAttendanceReport(this.defaultMeetingId);
    }

    // Get participants for the default meeting
    async getDefaultMeetingParticipants() {
        if (!this.defaultMeetingId) {
            throw new Error('No default meeting ID configured. Please set DEFAULT_MEETING_ID in your .env file');
        }
        return await this.getMeetingParticipants(this.defaultMeetingId);
    }

    // Get meeting details for the default meeting
    async getDefaultMeetingDetails() {
        if (!this.defaultMeetingId) {
            throw new Error('No default meeting ID configured. Please set DEFAULT_MEETING_ID in your .env file');
        }

        try {
            const response = await this.makeZoomAPICall(
                `${this.baseURL}/meetings/${this.defaultMeetingId}`,
                { method: 'GET' }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching default meeting details:', error.response?.data || error.message);
            throw error;
        }
    }

    // Monitor default meeting attendance (for recurring meetings)
    async monitorDefaultMeetingAttendance(intervalMinutes = 5) {
        if (!this.defaultMeetingId) {
            throw new Error('No default meeting ID configured. Please set DEFAULT_MEETING_ID in your .env file');
        }

        console.log(`🔍 Starting attendance monitoring for meeting ${this.defaultMeetingId}`);
        console.log(`📊 Checking every ${intervalMinutes} minutes`);

        const checkAttendance = async () => {
            try {
                const report = await this.getMeetingAttendanceReport(this.defaultMeetingId);
                const summary = this.generateAttendanceSummary(report.attendance);

                console.log(`\n📋 Attendance Update - ${new Date().toLocaleString()}`);
                console.log(`👥 Total Participants: ${summary.totalParticipants}`);
                console.log(`⏱️  Average Duration: ${summary.averageDuration} minutes`);

                if (summary.participantList.length > 0) {
                    console.log(`📝 Recent Participants:`);
                    summary.participantList.slice(0, 5).forEach(p => {
                        console.log(`   - ${p.name} (${p.duration} min)`);
                    });
                }

                return { timestamp: new Date(), ...summary };
            } catch (error) {
                console.error('❌ Error checking attendance:', error.message);
                return { timestamp: new Date(), error: error.message };
            }
        };

        // Initial check
        await checkAttendance();

        // Set up interval monitoring
        const interval = setInterval(checkAttendance, intervalMinutes * 60 * 1000);

        return {
            stop: () => {
                clearInterval(interval);
                console.log('🛑 Stopped attendance monitoring');
            }
        };
    }

    async getBulkAttendanceReport(meetingIds) {
        const reports = [];

        for (const meetingId of meetingIds) {
            try {
                const report = await this.getMeetingAttendanceReport(meetingId);
                reports.push(report);
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
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

            if (participant.join_time) {
                summary.joinTimes.push(participant.join_time);
            }
            if (participant.leave_time) {
                summary.leaveTimes.push(participant.leave_time);
            }
        });

        summary.averageDuration = Math.round(totalDuration / attendanceData.length);

        return summary;
    }
}

export default AttendanceService;
