
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  recipientId: string;
  title: string;
  message: string;
  type?: NotificationType;
  notificationType?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  senderId?: string;
}

export async function createNotification({
  recipientId,
  title,
  message,
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
        message,
        type,
        notification_type: notificationType,
        related_entity_id: relatedEntityId,
        related_entity_type: relatedEntityType,
        sender_id: senderId,
        read: false,
        created_at: new Date().toISOString()
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
    message: `${buyerName} purchased your beat "${beatTitle}"`,
    type: 'success',
    notificationType: 'sale',
    relatedEntityId: beatId,
    relatedEntityType: 'beat'
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
    message: `Your payment of ${currency === 'NGN' ? '₦' : '$'}${amount} has been processed successfully.`,
    type: 'success',
    notificationType: 'payment',
    relatedEntityId: orderId,
    relatedEntityType: 'order'
  });
}

// Helper function to notify a user about a beat being favorited
export async function notifyBeatFavorited(
  producerId: string,
  beatId: string,
  beatTitle: string,
  buyerName: string
) {
  return createNotification({
    recipientId: producerId,
    title: 'New Favorite',
    message: `${buyerName} added your beat "${beatTitle}" to their favorites`,
    type: 'info',
    notificationType: 'favorite',
    relatedEntityId: beatId,
    relatedEntityType: 'beat'
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
    message: `Your beat "${beatTitle}" has been featured on the platform!`,
    type: 'success',
    notificationType: 'feature',
    relatedEntityId: beatId,
    relatedEntityType: 'beat'
  });
}

// Helper function to send a system message to all users or a specific role
export async function sendSystemNotification(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType = 'info'
) {
  try {
    const notifications = userIds.map(userId => ({
      recipient_id: userId,
      title,
      message,
      type,
      notification_type: 'system',
      read: false,
      created_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending system notifications:', error);
    throw error;
  }
}
