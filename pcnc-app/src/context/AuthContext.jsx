// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const checkSession = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) throw new Error('No token')

            const { data } = await axios.get('/api/auth/session', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUser(data)
        } catch (error) {
            localStorage.removeItem('token')
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (credentials) => {
        try {
            const { data } = await axios.post('/api/v1/auth/login', credentials)
            localStorage.setItem('token', data.token)
            setUser(data.user)
            // Use relative navigation
            navigate(data.user.role === 'student' ? 'student' : '/', { replace: true })
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed')
        }
    }

    const logout = async () => {
        localStorage.removeItem('token')
        setUser(null)
        navigate('/login', { replace: true })
    }

    useEffect(() => {
        checkSession()
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
