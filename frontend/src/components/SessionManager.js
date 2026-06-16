import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'];
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function SessionManager() {
  const navigate = useNavigate();

  const handleActivity = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    if (!localStorage.getItem('lastActivity')) {
      handleActivity();
    }
    
    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [handleActivity]);

  useEffect(() => {
    let isRefreshing = false;

    const checkSession = async () => {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const decoded = parseJwt(token);
      if (!decoded || !decoded.exp) return;

      const now = Date.now();
      const expiresAt = decoded.exp * 1000;
      const timeRemaining = expiresAt - now;
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      const isIdle = now - lastActivity > IDLE_TIMEOUT_MS;

      if (timeRemaining <= 0) {
        sessionStorage.clear();
        navigate('/login');
        return;
      }

      if (timeRemaining < REFRESH_THRESHOLD_MS && !isIdle && !isRefreshing) {
        isRefreshing = true;
        try {
          const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          
          if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('authToken', data.token);
          } else {
            sessionStorage.clear();
            navigate('/login');
          }
        } catch (error) {
          console.error("Failed to refresh token", error);
        } finally {
          isRefreshing = false;
        }
      }
    };

    const intervalId = setInterval(checkSession, 60 * 1000);
    checkSession();

    return () => clearInterval(intervalId);
  }, [navigate]);

  return null;
}
