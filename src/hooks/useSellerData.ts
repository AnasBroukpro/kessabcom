import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

export function useSellerData(activeTab: string) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [nextCursorRequests, setNextCursorRequests] = useState<string | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingMoreRequests, setIsLoadingMoreRequests] = useState(false);

  const fetchRequests = async (isLoadMore = false) => {
    if (!user) return;
    if (isLoadMore) {
      if (!nextCursorRequests || isLoadingMoreRequests) return;
      setIsLoadingMoreRequests(true);
    } else {
      setIsLoadingRequests(true);
    }

    try {
      const response = await firestoreService.getOfferRequests(
        isLoadMore ? nextCursorRequests! : undefined,
        12
      );
      
      if (response && response.data) {
        if (isLoadMore) {
          setRequests(prev => [...prev, ...response.data]);
        } else {
          setRequests(response.data);
        }
        setNextCursorRequests(response.nextCursor);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoadingRequests(false);
      setIsLoadingMoreRequests(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'buyer-requests' && requests.length === 0) {
      fetchRequests();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'announcements'),
        where('sellerId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveAnns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(liveAnns as any[]);
      }, (error) => {
        console.warn('onSnapshot announcements error:', error);
      });
      
      return () => unsubscribe();
    }
  }, [user]);

  const activeCount = Array.isArray(announcements) ? announcements.filter(a => a.status === 'active').length : 0;
  const totalViews = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.views || 0), 0) : 0;
  const totalCalls = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.calls || 0), 0) : 0;
  const totalMessages = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.messages || 0), 0) : 0;
  const totalLocationRequests = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.locationRequests || 0), 0) : 0;

  return {
    announcements,
    requests,
    nextCursorRequests,
    isLoadingRequests,
    isLoadingMoreRequests,
    fetchRequests,
    stats: {
      activeCount,
      totalViews,
      totalCalls,
      totalMessages,
      totalLocationRequests
    }
  };
}
