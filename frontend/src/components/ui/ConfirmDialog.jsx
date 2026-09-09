import React from 'react';
import { Badge, Button, Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { subtlePillButtonStyles } from './buttonStyles.js';

// Reusable confirm modal (glass theme) for irreversible actions such as
// hiring a freelancer, releasing escrowed payment, or removing a job.
// Pass `headerBadge` ({ label, colorPalette }) to show a status pill above the
// title.
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  colorPalette = 'green',
  headerBadge,
  loading = false,
  confirmDisabled = false,
  error,
  children,
  onConfirm,
  onClose,
}) => (
  <Dialog.Root
    lazyMount
    open={open}
    onOpenChange={({ open: nextOpen }) => {
      if (!nextOpen && !loading) {
        onClose();
      }
    }}
    placement="center"
    size={{ base: 'sm', md: 'md' }}
  >
    <Portal>
      <Dialog.Backdrop bg="rgba(2, 6, 23, 0.78)" backdropFilter="blur(8px)" />
      <Dialog.Positioner px={{ base: 4, md: 6 }}>
        <Dialog.Content
          bg="rgba(8, 13, 25, 0.98)"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.22)"
          borderRadius="26px"
          boxShadow="0 28px 80px rgba(0, 0, 0, 0.48)"
          color="white"
          maxW="460px"
        >
          <Dialog.Header px={{ base: 5, md: 6 }} pt={{ base: 5, md: 6 }} pb={2}>
            <VStack align="start" gap={3}>
              {headerBadge ? (
                <Badge
                  colorPalette={headerBadge.colorPalette || 'gray'}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="semibold"
                >
                  {headerBadge.label}
                </Badge>
              ) : null}
              <Dialog.Title fontSize={{ base: 'xl', md: '2xl' }} lineHeight="1.15" letterSpacing="0">
                {title}
              </Dialog.Title>
            </VStack>
          </Dialog.Header>

          <Dialog.Body px={{ base: 5, md: 6 }} py={3}>
            <VStack align="stretch" gap={3}>
              <Text color="rgba(226, 232, 240, 0.72)" lineHeight="1.7">
                {description}
              </Text>
              {children}
              {error ? (
                <Text color="red.200" fontSize="sm" role="alert">
                  {error.message}
                </Text>
              ) : null}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer px={{ base: 5, md: 6 }} pb={{ base: 5, md: 6 }} pt={3} gap={3}>
            <Button type="button" disabled={loading} onClick={onClose} {...subtlePillButtonStyles}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              borderRadius="full"
              colorPalette={colorPalette}
              fontWeight="bold"
              loading={loading}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

export default ConfirmDialog;
