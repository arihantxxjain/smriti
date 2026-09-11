/**
 * Offline Storage & Synchronization Service
 * Handles cached reads and writes for Reminders and Game Sessions.
 * Strategy: Cache in localStorage, queue mutations, sync upon reconnection (Last-Write-Wins).
 */

const REMINDERS_CACHE_KEY = "smriti_cached_reminders";
const REMINDERS_QUEUE_KEY = "smriti_offline_reminders_queue";
const GAMES_QUEUE_KEY = "smriti_offline_games_queue";

export const offlineStorage = {
  // --- Reminders Cache ---
  saveRemindersCache(patientId, reminders) {
    try {
      localStorage.setItem(`${REMINDERS_CACHE_KEY}_${patientId}`, JSON.stringify(reminders));
    } catch (e) {
      console.warn("Failed to cache reminders:", e);
    }
  },

  getRemindersCache(patientId) {
    try {
      const data = localStorage.getItem(`${REMINDERS_CACHE_KEY}_${patientId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // --- Offline Mutations Queue ---
  queueReminderToggle(reminderId, dateStr, completed) {
    try {
      const queue = this.getReminderQueue();
      // Replace existing pending action for same reminder and date if present (last-write-wins)
      const filtered = queue.filter(item => !(item.reminder_id === reminderId && item.date_str === dateStr));
      filtered.push({
        reminder_id: reminderId,
        date_str: dateStr,
        completed: completed,
        queued_at: new Date().toISOString()
      });
      localStorage.setItem(REMINDERS_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to queue reminder toggle:", e);
    }
  },

  getReminderQueue() {
    try {
      const raw = localStorage.getItem(REMINDERS_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  clearReminderQueue() {
    localStorage.removeItem(REMINDERS_QUEUE_KEY);
  },

  // --- Games Offline Queue ---
  queueGameSubmit(gameData) {
    try {
      const raw = localStorage.getItem(GAMES_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ ...gameData, queued_at: new Date().toISOString() });
      localStorage.setItem(GAMES_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to queue game session:", e);
    }
  },

  getGameQueue() {
    try {
      const raw = localStorage.getItem(GAMES_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  clearGameQueue() {
    localStorage.removeItem(GAMES_QUEUE_KEY);
  }
};
