import mongoose from 'mongoose';
import Class from '../models/Class.js'; // Adjust path as needed
import User from '../models/User.js';
import ThinkificService from '../services/ThinkificService.js'; // Adjust path as needed
import 'dotenv/config';


// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const syncStudentsToThinkificGroups = async () => {
    try {
        // Get all classes with students and Thinkific group ID
        const classes = await Class.find({
            thinkificGroupId: { $exists: true, $ne: null }
        }).populate({
            path: 'students',
            select: 'thinkificId'
        });

        console.log(`Found ${classes.length} classes with Thinkific groups`);

        for (const cls of classes) {
            console.log(`\nProcessing class: ${cls.name} (Group ID: ${cls.thinkificGroupId})`);

            try {
                // Get current group members from Thinkific
                const groupUsers = await ThinkificService.getGroupUsers(cls.thinkificGroupId);
                const groupUserIds = groupUsers.map(user => user.id);
                console.log(`Found ${groupUserIds.length} users in Thinkific group`);

                let addedCount = 0;
                let errorCount = 0;

                // Process each student
                for (const student of cls.students) {
                    if (!student.thinkificId) {
                        console.log(`Skipping student ${student._id} - no Thinkific ID`);
                        continue;
                    }

                    if (!groupUserIds.includes(student.thinkificId)) {
                        try {
                            console.log(`Adding student ${student._id} to Thinkific group...`);
                            await ThinkificService.addUserToGroup(student.thinkificId, cls.thinkificGroupId);
                            addedCount++;
                        } catch (error) {
                            console.error(`Error adding student ${student._id}:`, error.message);
                            errorCount++;
                        }
                    }
                }

                console.log(`Class ${cls.name} sync complete:`);
                console.log(`- Students processed: ${cls.students.length}`);
                console.log(`- New additions: ${addedCount}`);
                console.log(`- Errors: ${errorCount}`);

            } catch (error) {
                console.error(`Error processing class ${cls.name}:`, error.message);
            }
        }

        console.log('\nSync process completed');
        process.exit(0);

    } catch (error) {
        console.error('Global error:', error);
        process.exit(1);
    }
};

// Run the script
(async () => {
    await connectDB();
    await syncStudentsToThinkificGroups();
})();
