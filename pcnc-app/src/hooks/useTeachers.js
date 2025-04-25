import { useState, useEffect } from 'react';

const useTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users?roles=teacher`)
            .then(res => res.json())
            .then(data => {
                console.log('data.users result:', data.data); // <-- Log here
                setTeachers(data.data || []);
            })
            .finally(() => setLoading(false));
    }, []);

    return { teachers, loading };
};

export default useTeachers;
