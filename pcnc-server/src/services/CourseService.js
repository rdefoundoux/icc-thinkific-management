import Course from '../models/Course.js';
import ThinkificService from './ThinkificService.js';
import { franc } from 'franc';

const LANGUAGE_KEYWORDS = {
    french: ['français', 'french'],
    german: ['deutsch', 'german']
};

export default class CourseService {
    static async syncCourses() {
        try {
            const thinkificCourses = await ThinkificService.getCourses();
            const filteredCourses = await this.filterCourses(thinkificCourses);
            console.log('Filtered courses:', filteredCourses.length);

            for (const tCourse of filteredCourses) {
                console.log('Processing course:', tCourse.name);
                const language = this.detectLanguage(tCourse.name);
                await this.processCourse(tCourse, language);
            }

            return { success: true, processed: filteredCourses.length };
        } catch (error) {
            console.error('Course sync error:', error);
            throw error;
        }
    }

    static async filterCourses(courses) {
        console.log(`Filtering courses. Total courses: ${courses.length}`);

        // Process courses asynchronously
        const filtered = await Promise.all(
            courses.map(async (course) => {
                try {
                    if (!course?.name) {
                        console.warn('Skipping course without title:', course.id);
                        return null;
                    }
                    const product = await ThinkificService.getProductByCourseId(course.id);
                   // Validate product publish status and title
                    const isValid = (
                        product?.status === 'published' &&
                        (course.name?.startsWith('001') || course.name?.startsWith('101') || course.name?.startsWith('201')) &&
                        !course.name?.startsWith('PlaceHolder') &&
                        !course.name?.endsWith('archive')
                    );

                    return isValid ? course : null;
                } catch (error) {
                    console.error('Error filtering course:', error);
                    return null;
                }
            })
        );

        // Remove null entries
        return filtered.filter(course => course !== null);
    }

    static async processCourse(tCourse,language) {


        if (!tCourse || !tCourse.name) {
            console.error('Invalid course data:', tCourse);
            return;
        }

        const existing = await Course.findOne({
            thinkificId: tCourse.id,
            language
        });
        if (!existing) {
            console.log('Creating course:', tCourse.name);
            const code = this.extractCourseCode(tCourse.name);
            console.log('Course code:', code);
            const language = this.detectLanguage(tCourse.name);
            console.log('Course language:', language);

            await Course.create({
                code,
                title: tCourse.name,
                thinkificId: tCourse.id,
                language,
                status: 'active'
            });
        }
    }

    static extractCourseCode(title = 'N/A') {
        const codeMatch = String(title).match(/\b(\d{3})\b/);
        return codeMatch ? codeMatch[1] : '001';
    }

    static detectLanguage(text) {
        const langCode = franc(text); // Returns ISO 639-3 code, e.g., 'eng', 'fra', 'deu'
        if (langCode === 'und') return 'unknown';
        // Optionally, map ISO 639-3 to readable language names
        const mapping = { eng: 'english', fra: 'french', deu: 'german' };
        return mapping[langCode] || langCode;
    }
}
