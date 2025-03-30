
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, MessageSquare, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  notification_type: string;
  is_read: boolean;
  created_date: string;
  related_entity_id?: string;
  related_entity_type?: string;
  sender_id?: string;
}

interface RecentActivityProps {
  notifications: Notification[];
}

export function RecentActivity({ notifications }: RecentActivityProps) {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
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
          // No specific navigation for other types
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign size={16} className="text-green-500" />;
      case 'favorite':
        return <Heart size={16} className="text-red-500" />;
      case 'comment':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'royalty':
      case 'payment':
        return <DollarSign size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest happenings with your beats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity to display</p>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="flex items-start gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div>
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
