
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  ShoppingCart, 
  MessageSquare, 
  Star, 
  Award, 
  Bell, 
  CreditCard, 
  Heart, 
  Tag 
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const navigate = useNavigate();
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'feature':
        return <Award className="h-4 w-4 text-purple-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'favorite':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'promo':
        return <Tag className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const handleClick = async () => {
    // Mark as read first
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
    
    // Navigate to related content if applicable
    if (notification.related_entity_id && notification.related_entity_type) {
      switch (notification.related_entity_type) {
        case 'beat':
          navigate(`/beat/${notification.related_entity_id}`);
          break;
        case 'order':
          navigate(`/orders`);
          break;
        case 'message':
          navigate(`/messages`);
          break;
        default:
          // If no specific navigation, do nothing after marking as read
          break;
      }
    }
  };
  
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left px-4 py-3 space-x-3 rounded-md",
        !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "flex-shrink-0 rounded-full p-1.5",
        !notification.read ? "bg-primary/10" : "bg-muted"
      )}>
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <p className={cn(
            "text-sm font-medium leading-none",
            !notification.read ? "text-foreground" : "text-muted-foreground"
          )}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </Button>
  );
}
