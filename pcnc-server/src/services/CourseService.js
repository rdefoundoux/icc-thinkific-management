import { franc } from 'franc';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import ThinkificService from './ThinkificService.js';

const COURSE_CODE_PREFIXES = ['001', '101', '201'];
const CODE_TO_ENUM = { '001': 'C001', '101': 'C101', '201': 'C201' };
const LANGUAGE_MAP = { eng: 'english', fra: 'french', deu: 'german' };

export default class CourseService {
    static async syncCourses() {
        const thinkificCourses = await ThinkificService.getCourses();
        const filteredCourses = await this.filterCourses(thinkificCourses);
        logger.info({ count: filteredCourses.length }, 'syncing courses');

        for (const tCourse of filteredCourses) {
            const language = this.detectLanguage(tCourse.name);
            await this.processCourse(tCourse, language);
        }

        return { success: true, processed: filteredCourses.length };
    }

    static async filterCourses(courses) {
        const filtered = await Promise.all(
            courses.map(async (course) => {
                try {
                    if (!course?.name) return null;
                    const product = await ThinkificService.getProductByCourseId(course.id);
                    const startsWithKnownCode = COURSE_CODE_PREFIXES.some((p) =>
                        course.name.startsWith(p),
                    );
                    const isValid =
                        product?.status === 'published' &&
                        startsWithKnownCode &&
                        !course.name.startsWith('PlaceHolder') &&
                        !course.name.endsWith('archive');
                    return isValid ? course : null;
                } catch (err) {
                    logger.warn({ err: err.message, courseId: course?.id }, 'filterCourses error');
                    return null;
                }
            }),
        );
        return filtered.filter(Boolean);
    }

    static async processCourse(tCourse, language) {
        if (!tCourse?.name) {
            logger.warn({ tCourse }, 'invalid course data');
            return;
        }

        const codeStr = this.extractCourseCode(tCourse.name);
        const enumCode = CODE_TO_ENUM[codeStr];
        if (!enumCode) {
            logger.warn({ codeStr, title: tCourse.name }, 'unknown course code, skipping');
            return;
        }

        try {
            await prisma.course.upsert({
                where: { code_language: { code: enumCode, language } },
                update: {
                    title: tCourse.name,
                    thinkificId: String(tCourse.id),
                    status: 'active',
                },
                create: {
                    code: enumCode,
                    title: tCourse.name,
                    thinkificId: String(tCourse.id),
                    language,
                    status: 'active',
                },
            });
        } catch (err) {
            logger.error({ err: err.message, course: tCourse.name }, 'processCourse failed');
        }
    }

    static extractCourseCode(title = 'N/A') {
        const codeMatch = String(title).match(/\b(\d{3})\b/);
        return codeMatch ? codeMatch[1] : '001';
    }

    static detectLanguage(text) {
        const langCode = franc(text);
        if (langCode === 'und') return 'english';
        return LANGUAGE_MAP[langCode] || 'english';
    }
}
