// updateGroupNames.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Class from '../models/Class.js'; // Adjust path as necessary
import ThinkificService from '../services/ThinkificService.js'; // Adjust path as necessary

dotenv.config(); // If you're using environment variables from a .env file

(async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Retrieve all classes
        const classes = await Class.find({});

        for (const cls of classes) {
            if (!cls.thinkificGroupId) continue; // skip if no group ID

            try {
                const thinkificGroup = await ThinkificService.getGroup(cls.thinkificGroupId);
                console.log('thinkificGroup' + thinkificGroup.group);
                const groupName = thinkificGroup?.group?.name || 'N/A';

                // Update the class with the retrieved name
                cls.thinkificGroupName = groupName;
                await cls.save();

                console.log(`Updated class ${cls._id} with group name "${groupName}"`);
            } catch (error) {
                console.error(`Error updating class ${cls._id}:`, error.message);
            }
        }

        console.log('Done updating group names.');
        process.exit(0);
    } catch (err) {
        console.error('Script error:', err);
        process.exit(1);
    }
})();
