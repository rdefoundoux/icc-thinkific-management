// src/hooks/useAdmin.js
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    getAdminClasses, getPendingStudents, validateStudents,
    syncThinkificUsers, getCoordinators, getSFs, assignStudentsToClasses
} from "../api/admin";



// After (v5 syntax)
export const useAdminClasses = () => useQuery({
    queryKey: ['adminClasses'],
    queryFn: getAdminClasses
});

// Update all other hooks similarly:
export const usePendingStudents = () => useQuery({
    queryKey: ['pendingStudents'],
    queryFn: getPendingStudents
});

export const useCoordinators = () => useQuery({
    queryKey: ['coordinators'],
    queryFn: getCoordinators
});

export const useSFs = () => useQuery({
    queryKey: ['sfs'],
    queryFn: getSFs
});

export const useValidateStudents = () => useMutation({
    mutationFn: validateStudents
});

export const useSyncThinkific = () => useMutation({
    mutationFn: syncThinkificUsers
});

export const useAssignStudentsToClasses = () => useMutation({
    mutationFn: assignStudentsToClasses
});
