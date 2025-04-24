import { useState, useEffect } from 'react';

const PAGE_SIZE = 10;

const useClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchClasses = async (newPage = page) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes?page=${newPage}&limit=${PAGE_SIZE}`
            );
            const { data, total } = await res.json();
            setClasses(data);
            setTotal(total);
            setPage(newPage);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses(1);
        // eslint-disable-next-line
    }, []);

    return { classes, loading, error, page, total, fetchClasses };
};

export default useClasses;
