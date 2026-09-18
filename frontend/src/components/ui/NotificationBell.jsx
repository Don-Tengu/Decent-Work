import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Box, Button, HStack, IconButton, Popover, Portal, Text, VStack } from '@chakra-ui/react';
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
            color="fg.muted"
            _hover={{ bg: 'paper.200', color: 'fg.default' }}
          >
            <Bell size={18} />
          </IconButton>
          {unreadCount > 0 ? (
            <Box
              position="absolute"
              top="2px"
              right="2px"
              bg="ink.900"
              color="#EDE9E0"
              borderRadius="full"
              minW="18px"
              h="18px"
              px="5px"
              fontSize="10px"
              fontWeight="bold"
              lineHeight="18px"
              textAlign="center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Box>
          ) : null}
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w={{ base: 'min(92vw, 360px)', md: '360px' }}
            bg="bg.canvas"
            border="1px solid"
            borderColor="border.default"
            borderRadius="12px"
            boxShadow="0 12px 32px rgba(20, 20, 19, 0.1)"
            color="fg.default"
            p={0}
            overflow="hidden"
          >
            <Box px={4} py={3} borderBottom="1px solid" borderColor="border.default">
              <HStack justify="space-between" align="center">
                <Text color="fg.default" fontWeight="bold" fontSize="sm">
                  Notifications
                </Text>
                {unreadCount > 0 ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
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
                  <Text color="fg.muted" fontSize="sm">
                    Loading…
                  </Text>
                </Box>
              ) : null}
              {!loading && notifications.length === 0 ? (
                <Box px={4} py={5}>
                  <Text color="fg.muted" fontSize="sm">
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
                  borderColor="border.default"
                  bg={notification.read ? 'transparent' : 'paper.200'}
                  _hover={{ bg: 'paper.200' }}
                  onClick={() => handleOpenItem(notification)}
                >
                  <Text color="fg.default" fontWeight="semibold" fontSize="sm" lineHeight="1.35">
                    {notification.title}
                  </Text>
                  <Text color="fg.muted" fontSize="sm" mt={1} lineHeight="1.5">
                    {notification.message}
                  </Text>
                  <Text color="fg.subtle" fontSize="xs" mt={1.5}>
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
