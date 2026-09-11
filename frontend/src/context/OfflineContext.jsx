import React, { createContext, useContext, useState, useEffect } from "react";
import { offlineStorage } from "../services/offlineStorage";
import { api } from "../services/api";

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateQueueCount = () => {
    const remQueue = offlineStorage.getReminderQueue();
    const gameQueue = offlineStorage.getGameQueue();
    setQueueCount(remQueue.length + gameQueue.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Sync reminders
      const remQueue = offlineStorage.getReminderQueue();
      if (remQueue.length > 0) {
        await api.syncReminders(remQueue);
        offlineStorage.clearReminderQueue();
      }

      // 2. Sync games
      const gameQueue = offlineStorage.getGameQueue();
      if (gameQueue.length > 0) {
        for (const gameData of gameQueue) {
          try {
            await api.submitGame(gameData);
          } catch (e) {
            console.warn("Failed to sync individual game:", e);
          }
        }
        offlineStorage.clearGameQueue();
      }

      updateQueueCount();
    } catch (e) {
      console.warn("Sync encountered error, will retry later:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, queueCount, isSyncing, triggerSync, updateQueueCount }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
