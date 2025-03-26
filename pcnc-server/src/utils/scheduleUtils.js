// utils/scheduleUtils.js
exports.generateTimeSlots = (startDate, daysOfWeek, durationWeeks) => {
    const slots = [];
    const currentDate = new Date(startDate);

    for (let week = 0; week < durationWeeks; week++) {
        daysOfWeek.forEach(day => {
            const slotDate = new Date(currentDate);
            slotDate.setDate(currentDate.getDate() + (day - currentDate.getDay()));
            slots.push(slotDate);
        });
        currentDate.setDate(currentDate.getDate() + 7);
    }

    return slots;
};
