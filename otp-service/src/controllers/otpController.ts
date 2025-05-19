import Otp from '../models/otpModel';
import generateOTP from '../utils/generateOTP';
import logger from '../utils/logger';
import { Types } from 'mongoose';

const validityPeriodMs = parseInt(process.env.OTP_VALIDITY_PERIOD_MINUTES || '5') * 60 * 1000;
const OTP_SIZE = parseInt(process.env.OTP_SIZE || '6');
const MAX_ATTEMPTS = 3;

class OtpController {
  async generateOtp(email: string, type: string): Promise<string> {
    try {
      const emailNorm = email.trim().toLowerCase();
      const now = Date.now();

      // Delete all existing OTPs for this email
      await Otp.deleteMany({
        email: emailNorm,
        createdAt: { $gte: new Date(now - validityPeriodMs) }
      });

      // Generate and save new OTP
      const otp = generateOTP(OTP_SIZE, type);
      await Otp.create({
        id: new Types.ObjectId(),
        email: emailNorm,
        otp: otp.trim()
      });

      return otp;
    } catch (error: any) {
      logger.error('OTP generation failed:', error.message);
      throw new Error(error.message);
    }
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    try {

      const emailNorm = email.trim().toLowerCase();
      const otpNorm = otp.toString().trim();

      if (!otpNorm || otpNorm.length !== OTP_SIZE) {
        throw new Error('Invalid OTP');
      }

      const otpDocument = await Otp.findOneAndDelete({
        email: emailNorm,
        otp: otpNorm,
        createdAt: { $gte: new Date(Date.now() - validityPeriodMs) }
      }).select('_id').lean();

      console.log('otpDocument',otpDocument);

      if (!otpDocument) {
        throw new Error('Invalid OTP');
      }
      console.log('leaving otpController');
      return true;
    } catch (error: any) {
      console.log('error',error);
      logger.error('OTP verification failed:', error.message);
      throw new Error(error.message);
    }
  }
}

export default OtpController;
