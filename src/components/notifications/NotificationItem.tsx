
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
  Tag,
  Check
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAsUnread?: (id: string) => Promise<void>;
}

export function NotificationItem({ notification, onMarkAsRead, onMarkAsUnread }: NotificationItemProps) {
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
    if (!notification.is_read) {
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

  const handleToggleReadStatus = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    
    if (notification.is_read && onMarkAsUnread) {
      await onMarkAsUnread(notification.id);
    } else if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
  };
  
  return (
    <div className={cn(
      "group w-full relative transition-colors duration-200",
      !notification.is_read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
    )}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left px-4 py-3 space-x-3 rounded-md h-auto",
        )}
        onClick={handleClick}
      >
        <div className={cn(
          "flex-shrink-0 rounded-full p-1.5",
          !notification.is_read ? "bg-primary/10" : "bg-muted"
        )}>
          {getNotificationIcon(notification.notification_type)}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <p className={cn(
              "text-sm font-medium leading-none",
              !notification.is_read ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </p>
            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
              {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs mt-1 text-muted-foreground line-clamp-2 break-words">
            {notification.body}
          </p>
        </div>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
        onClick={handleToggleReadStatus}
        title={notification.is_read ? "Mark as unread" : "Mark as read"}
      >
        <Check className={cn(
          "h-3.5 w-3.5",
          notification.is_read ? "text-green-500" : "text-muted-foreground"
        )} />
      </Button>
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
      )}
    </div>
  );
}
