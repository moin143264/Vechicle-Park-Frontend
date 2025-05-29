// Basic logging
logger.info('Server started');
logger.error('Connection failed');

// With metadata
logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });

// Notification specific
logger.notificationSent('BOOKING_CONFIRMED', userId, {
    bookingId: '123',
    location: 'Parking A'
});

// Error logging
logger.notificationError(error, userId, {
    notificationType: 'BOOKING_CONFIRMED',
    bookingId: '123'
});

// Status change
logger.bookingStatusChange('123', 'pending', 'confirmed', {
    userId: 'user123',
    location: 'Parking A'
});