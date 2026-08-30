import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Badge, Box, Button, HStack, IconButton, Popover, Portal, Text, VStack } from '@chakra-ui/react';
import { Bell } from 'lucide-react';
import {
  GET_MY_NOTIFICATIONS,
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
  UNREAD_NOTIFICATION_COUNT,
} from '@/graphql/queries.js';

const formatRelativeTime = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { data: countData, refetch: refetchCount } = useQuery(UNREAD_NOTIFICATION_COUNT, {
    fetchPolicy: 'cache-and-network',
  });
  const { data, loading, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
    variables: { limit: 12 },
    fetchPolicy: 'cache-and-network',
  });
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

  const unreadCount = countData?.unreadNotificationCount ?? 0;
  const notifications = data?.myNotifications ?? [];

  const refresh = async () => {
    await Promise.all([refetch(), refetchCount()]);
  };

  const handleOpenItem = async (notification) => {
    if (!notification.read) {
      try {
        await markRead({ variables: { id: notification.id } });
        await refresh();
      } catch {
        // Navigation still proceeds even if mark-read fails.
      }
    }
    if (notification.linkPath) {
      navigate(notification.linkPath);
    }
  };

  const handleMarkAll = async () => {
    await markAllRead();
    await refresh();
  };

  return (
    <Popover.Root positioning={{ placement: 'bottom-end' }}>
      <Popover.Trigger asChild>
        <Box position="relative">
          <IconButton
            aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
            type="button"
            variant="ghost"
            borderRadius="full"
            color="rgba(226, 232, 240, 0.82)"
            _hover={{ bg: 'rgba(255, 255, 255, 0.08)', color: 'white' }}
          >
            <Bell size={18} />
          </IconButton>
          {unreadCount > 0 ? (
            <Badge
              position="absolute"
              top="2px"
              right="2px"
              colorPalette="red"
              borderRadius="full"
              minW="18px"
              h="18px"
              px={1}
              fontSize="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          ) : null}
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w={{ base: 'min(92vw, 360px)', md: '360px' }}
            bg="rgba(8, 13, 25, 0.98)"
            border="1px solid"
            borderColor="rgba(148, 163, 184, 0.22)"
            borderRadius="18px"
            boxShadow="0 24px 64px rgba(0, 0, 0, 0.45)"
            p={0}
            overflow="hidden"
          >
            <Box px={4} py={3} borderBottom="1px solid" borderColor="rgba(148, 163, 184, 0.14)">
              <HStack justify="space-between" align="center">
                <Text color="white" fontWeight="bold" fontSize="sm">
                  Notifications
                </Text>
                {unreadCount > 0 ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    color="cyan.200"
                    onClick={handleMarkAll}
                  >
                    Mark all read
                  </Button>
                ) : null}
              </HStack>
            </Box>
            <VStack align="stretch" gap={0} maxH="360px" overflowY="auto">
              {loading && !data ? (
                <Box px={4} py={5}>
                  <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
                    Loading…
                  </Text>
                </Box>
              ) : null}
              {!loading && notifications.length === 0 ? (
                <Box px={4} py={5}>
                  <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
                    No notifications yet.
                  </Text>
                </Box>
              ) : null}
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  as="button"
                  type="button"
                  textAlign="left"
                  px={4}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="rgba(148, 163, 184, 0.1)"
                  bg={notification.read ? 'transparent' : 'rgba(34, 211, 238, 0.06)'}
                  _hover={{ bg: 'rgba(125, 211, 252, 0.1)' }}
                  onClick={() => handleOpenItem(notification)}
                >
                  <Text color="white" fontWeight="semibold" fontSize="sm" lineHeight="1.35">
                    {notification.title}
                  </Text>
                  <Text color="rgba(226, 232, 240, 0.68)" fontSize="sm" mt={1} lineHeight="1.5">
                    {notification.message}
                  </Text>
                  <Text color="rgba(226, 232, 240, 0.45)" fontSize="xs" mt={1.5}>
                    {formatRelativeTime(notification.createdAt)}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default NotificationBell;
