import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ElvantoIntegration = () => {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);

    // Base API URL from environment variables
    const API_BASE = import.meta.env.VITE_API_BASE_URL+'/api/v1' || 'https://pcnc.tail30380e.ts.net/api/v1';

    // Main function to fetch Elvanto people
    const fetchElvantoPeople = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(`${API_BASE}/elvanto/init`, {
                withCredentials: true // Required for session cookies
            });

            setPeople(response.data.people);
        } catch (err) {
            if (err.response?.status === 401) {
                // Redirect to Elvanto auth if unauthenticated
                window.location.href = err.response.data.authUrl;
            } else {
                setError(err.response?.data?.error || 'Failed to fetch Elvanto data');
            }
        } finally {
            setLoading(false);
        }
    };

    // Check authentication status on mount
    // useEffect(() => {
    //     const checkAuth = async () => {
    //         try {
    //             await axios.get(`${API_BASE}/elvanto/check-auth`, {
    //                 withCredentials: true
    //             });
    //             setAuthChecked(true);
    //         } catch (err) {
    //             setAuthChecked(true);
    //             if (err.response?.status === 401) {
    //                 fetchElvantoPeople(); // Trigger auth flow
    //             }
    //         }
    //     };
    //
    //     // Handle OAuth callback success
    //     const urlParams = new URLSearchParams(window.location.search);
    //     if (urlParams.get('authSuccess')) {
    //         window.history.replaceState({}, document.title, window.location.pathname);
    //         fetchElvantoPeople();
    //     } else {
    //         checkAuth();
    //     }
    // }, []);

    return (
        <div className="elvanto-integration">
            <h2>Elvanto People Management</h2>

            <button
                onClick={fetchElvantoPeople}
                disabled={loading}
            >
                {loading ? 'Loading...' : 'Get Elvanto People'}
            </button>

            {error && (
                <div className="error">
                    Error: {error}
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}

            {people.length > 0 ? (
                <div className="people-list">
                    <h3>People ({people.length})</h3>
                    <ul>
                        {people.map(person => (
                            <li key={person.id}>
                                {person.firstname} {person.lastname} - {person.email}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : authChecked && !loading && !error && (
                <p>No people data available. Click the button to load.</p>
            )}
        </div>
    );
};

export default ElvantoIntegration;
