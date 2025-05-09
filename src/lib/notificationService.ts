
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  recipientId: string;
  title: string;
  body: string;
  type?: NotificationType;
  notificationType?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  senderId?: string;
}

export async function createNotification({
  recipientId,
  title,
  body,
  type = 'info',
  notificationType = 'system',
  relatedEntityId,
  relatedEntityType,
  senderId
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        title,
        body,
        notification_type: notificationType,
        related_entity_id: relatedEntityId,
        related_entity_type: relatedEntityType,
        sender_id: senderId,
        is_read: false,
        created_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Helper function to send a notification for a beat sale
export async function notifyBeatSold(
  producerId: string, 
  beatId: string, 
  beatTitle: string,
  buyerName: string
) {
  return createNotification({
    recipientId: producerId,
    title: 'Beat Sold!',
    body: `${buyerName} purchased your beat "${beatTitle}"`,
    type: 'success',
    notificationType: 'sale',
    relatedEntityId: beatId,
    relatedEntityType: 'beat'
  }).catch(err => {
    console.error('Failed to send beat sold notification:', err);
    // Don't throw, this is non-critical functionality
    return null;
  });
}

// Helper function to notify a user about a successful payment
export async function notifyPaymentSuccess(
  userId: string,
  orderId: string,
  amount: number,
  currency: string
) {
  return createNotification({
    recipientId: userId,
    title: 'Payment Successful',
    body: `Your payment of ${currency === 'NGN' ? '₦' : '$'}${amount} has been processed successfully.`,
    type: 'success',
    notificationType: 'payment',
    relatedEntityId: orderId,
    relatedEntityType: 'order'
  }).catch(err => {
    console.error('Failed to send payment success notification:', err);
    // Don't throw, this is non-critical functionality
    return null;
  });
}

// Helper function to notify a user about a beat being favorited
export async function notifyBeatFavorited(
  producerId: string,
  beatId: string,
  beatTitle: string
) {
  return createNotification({
    recipientId: producerId,
    title: 'New Favorite',
    body: `Someone added your beat "${beatTitle}" to their favorites`,
    type: 'info',
    notificationType: 'favorite',
    relatedEntityId: beatId,
    relatedEntityType: 'beat'
  }).catch(err => {
    console.error('Failed to send beat favorited notification:', err);
    // Don't throw, this is non-critical functionality
    return null;
  });
}

// Helper function to notify a user about a featured beat
export async function notifyBeatFeatured(
  producerId: string,
  beatId: string,
  beatTitle: string
) {
  return createNotification({
    recipientId: producerId,
    title: 'Beat Featured',
    body: `Your beat "${beatTitle}" has been featured on the platform!`,
    type: 'success',
    notificationType: 'feature',
    relatedEntityId: beatId,
    relatedEntityType: 'beat'
  }).catch(err => {
    console.error('Failed to send beat featured notification:', err);
    // Don't throw, this is non-critical functionality
    return null;
  });
}

// Modified helper function to send a system message to all users or a specific role
// Now using batched requests to reduce DB load
export async function sendSystemNotification(
  userIds: string[],
  title: string,
  body: string,
  type: NotificationType = 'info'
) {
  try {
    // Batch notifications in groups of 50 to avoid large payload issues
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batchUserIds = userIds.slice(i, i + batchSize);
      const notifications = batchUserIds.map(userId => ({
        recipient_id: userId,
        title,
        body,
        notification_type: 'system',
        is_read: false,
        created_date: new Date().toISOString()
      }));
      
      batches.push(notifications);
    }
    
    // Process batches sequentially to not overwhelm the database
    for (const batch of batches) {
      const { error } = await supabase
        .from('notifications')
        .insert(batch);
      
      if (error) {
        console.error('Error in batch notification:', error);
        // Continue with other batches even if one fails
        continue;
      }
      
      // Add a small delay between batches to reduce load
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending system notifications:', error);
    // Don't throw, just log and return false
    return false;
  }
}
