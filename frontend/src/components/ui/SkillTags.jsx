import React from 'react';
import { Badge, HStack, Text } from '@chakra-ui/react';

// Renders a freelancer's profile skills (a flat list of free-text strings) as
// glass pills. Pass `max` to cap the visible count and surface a "+N" overflow
// badge; pass `emptyLabel` to show copy instead of rendering nothing.
const SkillTags = ({ skills = [], max, emptyLabel }) => {
  const cleaned = (skills ?? []).map((skill) => String(skill).trim()).filter(Boolean);

  if (!cleaned.length) {
    return emptyLabel ? (
      <Text color="rgba(226, 232, 240, 0.5)" fontSize="sm">
        {emptyLabel}
      </Text>
    ) : null;
  }

  const visible = typeof max === 'number' ? cleaned.slice(0, max) : cleaned;
  const overflow = cleaned.length - visible.length;

  return (
    <HStack gap={2} flexWrap="wrap">
      {visible.map((skill) => (
        <Badge
          key={skill}
          borderRadius="full"
          px={3}
          py={1}
          bg="rgba(148, 163, 184, 0.12)"
          color="rgba(226, 232, 240, 0.86)"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.2)"
          fontWeight="medium"
          textTransform="none"
        >
          {skill}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge
          borderRadius="full"
          px={3}
          py={1}
          bg="transparent"
          color="rgba(226, 232, 240, 0.6)"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.2)"
          fontWeight="medium"
          aria-label={`${overflow} more skills`}
          title={cleaned.slice(visible.length).join(', ')}
        >
          +{overflow}
        </Badge>
      ) : null}
    </HStack>
  );
};

export default SkillTags;
