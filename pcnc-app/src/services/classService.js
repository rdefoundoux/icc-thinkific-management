// services/classService.js
export const assignTeacherToClass = async (teacherId, classId) => {
    // Vérifier les assignations existantes
    const existingAssignment = await api.get(`/users/${teacherId}/current-class`);
    if (existingAssignment) {
        await removeTeacherFromClass(teacherId, existingAssignment.classId);
    }

    // Mettre à jour Thinkific
    await axios.post(
        `https://api.thinkific.com/api/public/v1/group_analysts/${teacherId}/groups`,
        { group_ids: [classId] },
        API_CONFIG
    );

    // Mettre à jour la base locale
    await api.patch(`/users/${teacherId}`, { assignedClass: classId });
};
