# Success Van Hire App Design

The app serves UK van-hire customers on mobile. Booking and account screens use compact, practical layouts, dark surfaces, clear white text, orange action accents, and green or red status feedback. Prices use GBP and dates use Europe/London.

Runtime colours and typography are owned by `constants/appTheme.ts` and the existing shared screen styles. Reuse `AppToast`, `BookingCalendarChrome`, and existing dashboard disclosure patterns. New journey actions should remain reachable by touch, preserve entered values after errors, and display loading, disabled, and server-result states.
