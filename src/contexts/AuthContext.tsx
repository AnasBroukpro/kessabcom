import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const profileData = await firestoreService.getUserProfile(firebaseUser.uid);
          setProfile(profileData);
        } catch (error) {
          console.warn("Profile fetch issue:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Centralized Notification Listener
  useEffect(() => {
    if (!user) return;

    console.log("🔔 Subscribing to notifications in AuthContext for:", user.uid);
    const unsubscribeNotifications = firestoreService.subscribeToUserNotifications(
      user.uid, 
      (newNotifications) => {
        setNotifications(newNotifications);
      }
    );

    return () => {
      console.log("🔕 Unsubscribing from notifications in AuthContext");
      unsubscribeNotifications();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const signOut = () => auth.signOut();

  const refreshProfile = async () => {
    if (user) {
      try {
        const profileData = await firestoreService.getUserProfile(user.uid);
        setProfile(profileData);
      } catch (error) {
        console.warn("Error refreshing profile:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      notifications, 
      unreadCount, 
      loading, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
