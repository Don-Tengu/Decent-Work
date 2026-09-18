import React from 'react';
import { Badge, Button, Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { greenSolidButtonStyles, subtlePillButtonStyles } from './buttonStyles.js';

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  colorPalette: _colorPalette = 'green',
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
      <Dialog.Backdrop bg="rgba(20, 20, 19, 0.35)" />
      <Dialog.Positioner px={{ base: 4, md: 6 }}>
        <Dialog.Content
          bg="bg.panel"
          border="1px solid"
          borderColor="border.default"
          borderRadius="16px"
          boxShadow="0 16px 40px rgba(20, 20, 19, 0.08)"
          color="fg.default"
          maxW="460px"
        >
          <Dialog.Header px={{ base: 5, md: 6 }} pt={{ base: 5, md: 6 }} pb={2}>
            <VStack align="start" gap={3}>
              {headerBadge ? (
                <Badge
                  variant="outline"
                  color="fg.muted"
                  borderColor="border.default"
                  bg="transparent"
                  borderRadius="8px"
                  px={3}
                  py={1}
                  fontWeight="medium"
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
              <Text color="fg.muted" lineHeight="1.7">
                {description}
              </Text>
              {children}
              {error ? (
                <Text color="red.700" fontSize="sm" role="alert">
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
              loading={loading}
              disabled={confirmDisabled}
              onClick={onConfirm}
              {...greenSolidButtonStyles}
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
