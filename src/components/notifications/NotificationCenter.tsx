
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAsUnread,
    markAllAsRead,
    fetchNotifications 
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative h-8 w-8"
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" 
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[min(420px,95vw)] p-0 shadow-lg" 
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-medium text-sm">Notifications</h4>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8"
                onClick={markAllAsRead}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleViewAll}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only md:not-sr-only md:ml-1 text-xs">View all</span>
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full rounded-none border-b">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none">
            {isLoading ? (
              <div className="py-2 px-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'No notifications yet' 
                    : 'No unread notifications'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === 'all'
                    ? "We'll notify you when something important happens"
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[min(400px,60vh)]">
                <div className="py-1">
                  {filteredNotifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <NotificationItem 
                        notification={notification} 
                        onMarkAsRead={markAsRead}
                        onMarkAsUnread={markAsUnread}
                      />
                      <Separator className={cn(
                        filteredNotifications[filteredNotifications.length - 1].id !== notification.id ? "opacity-100" : "opacity-0"
                      )} />
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
