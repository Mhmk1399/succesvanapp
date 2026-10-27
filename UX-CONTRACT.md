# Customer Journey Interaction Contract

- Booking and editing use the shared schedule, price calculation, validation, and authenticated reservation services.
- Dashboard journey details use collapsible sections and the existing booking sheet. User actions show pending, success, and error states, and refresh booking data on success.
- File uploads require an authenticated session. Documents and evidence remain associated with the customer booking.
- Customer images open in the shared full-screen image viewer, scoped to the active native modal; PDFs retain their document-opening flow.
- Booking estimates follow the website pricing rules; cancellation previews and reservation status come from the server. Display money to two decimal places and dates in UK time.
- Signature actions return through the configured DocuSign callback and refresh the agreement status; leaving the signing page is not proof of completion.
