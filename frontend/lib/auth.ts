"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
})

interface AuthContextType {
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for token in localStorage on initial load
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
    }
  }, [token])

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/api/login", {
        username,
        password,
      })
      setToken(response.data.token)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    router.push("/login")
  }

  const value: AuthContextType = {
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isLoading,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}
