import { useMemo, useState } from 'react';

/**
 * Derives notifications from booking data and tracks read/cleared state in localStorage.
 *
 * @param {Array}  bookings  - live booking list (CustomerBookingDTO or ProviderBookingDTO)
 * @param {'customer'|'provider'} role
 * @param {number|string} userId
 */
export function useNotifications(bookings, role, userId) {
  const seenKey    = `notifications-seen:${role}:${userId}`;
  const clearedKey = `notifications-cleared:${role}:${userId}`;

  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey) || '[]')); }
    catch { return new Set(); }
  });

  const [clearedIds, setClearedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(clearedKey) || '[]')); }
    catch { return new Set(); }
  });

  // All possible notifications derived from bookings
  const allNotifications = useMemo(() => {
    if (!Array.isArray(bookings)) return [];

    if (role === 'provider') {
      return bookings
        .filter((b) => b.status === 'PENDING')
        .map((b) => ({
          id: `pending-${b.id}`,
          title: 'New booking request',
          body: `${b.customerName || 'A customer'} requested service on ${b.bookingDate || 'a date TBD'}.`,
          type: 'pending',
          bookingId: b.id,
        }));
    }

    return bookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'CANCELLED')
      .map((b) => ({
        id: `status-${b.id}-${b.status}`,
        title: b.status === 'CONFIRMED' ? 'Booking confirmed' : 'Booking cancelled',
        body:
          b.status === 'CONFIRMED'
            ? `${b.providerName || 'Your provider'} confirmed your booking for ${b.bookingDate || 'your requested date'}.`
            : `Your booking${b.providerName ? ` with ${b.providerName}` : ''} was cancelled.`,
        type: b.status === 'CONFIRMED' ? 'confirmed' : 'cancelled',
        bookingId: b.id,
      }));
  }, [bookings, role]);

  // Visible = not cleared
  const notifications = useMemo(
    () => allNotifications.filter((n) => !clearedIds.has(n.id)),
    [allNotifications, clearedIds],
  );

  // Unread = visible and not seen
  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !seenIds.has(n.id) && !clearedIds.has(n.id)).length,
    [allNotifications, seenIds, clearedIds],
  );

  // Mark all visible as seen (clears badge)
  const markAllRead = () => {
    const ids = allNotifications.map((n) => n.id);
    const next = new Set([...seenIds, ...ids]);
    setSeenIds(next);
    localStorage.setItem(seenKey, JSON.stringify([...next]));
  };

  // Clear all — removes from visible list
  const clearAll = () => {
    const ids = allNotifications.map((n) => n.id);
    const next = new Set([...clearedIds, ...ids]);
    setClearedIds(next);
    localStorage.setItem(clearedKey, JSON.stringify([...next]));
    // also mark as seen so badge goes away
    const nextSeen = new Set([...seenIds, ...ids]);
    setSeenIds(nextSeen);
    localStorage.setItem(seenKey, JSON.stringify([...nextSeen]));
  };

  return { notifications, unreadCount, markAllRead, clearAll };
}
