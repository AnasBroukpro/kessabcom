import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';

export function useSellerDashboardData(user: any) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [nextCursorRequests, setNextCursorRequests] = useState<string | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingMoreRequests, setIsLoadingMoreRequests] = useState(false);
  const [dailyLeadsCount, setDailyLeadsCount] = useState(0);
  const [dailyLeadsLimit, setDailyLeadsLimit] = useState(6);
  const [dailyOffersCount, setDailyOffersCount] = useState(0);
  const [dailyOffersLimit, setDailyOffersLimit] = useState(6);

  const fetchRequests = async (isLoadMore = false) => {
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
        
        // Store daily limits info
        if (response.dailyLeadsCount !== undefined) setDailyLeadsCount(response.dailyLeadsCount);
        if (response.dailyLeadsLimit !== undefined) setDailyLeadsLimit(response.dailyLeadsLimit);
        if (response.dailyOffersCount !== undefined) setDailyOffersCount(response.dailyOffersCount);
        if (response.dailyOffersLimit !== undefined) setDailyOffersLimit(response.dailyOffersLimit);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoadingRequests(false);
      setIsLoadingMoreRequests(false);
    }
  };

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'announcements'), where('sellerId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  return {
    announcements,
    requests,
    nextCursorRequests,
    isLoadingRequests,
    isLoadingMoreRequests,
    dailyLeadsCount,
    dailyLeadsLimit,
    dailyOffersCount,
    dailyOffersLimit,
    fetchRequests
  };
}
