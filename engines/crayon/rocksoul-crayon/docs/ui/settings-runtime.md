# Settings runtime

Profile, Account, API Keys, and Appearance use authoritative application boundaries. Appearance persists through the existing local ThemeProvider. Notifications use the persistent backend feed, AEP `notifications.watch` events, cross-tab unread synchronization, grouping/deduplication, severity filtering, and persisted filter preferences. Account also exposes server-authoritative logout-all-devices; password recovery and OAuth remain unavailable because no backend contract exists.
