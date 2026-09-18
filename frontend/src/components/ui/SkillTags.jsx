import React from 'react';
import { Badge, HStack, Text } from '@chakra-ui/react';

// Renders a freelancer's profile skills (a flat list of free-text strings) as
// glass pills. Pass `max` to cap the visible count and surface a "+N" overflow
// badge; pass `emptyLabel` to show copy instead of rendering nothing.
const SkillTags = ({ skills = [], max, emptyLabel }) => {
  const cleaned = (skills ?? []).map((skill) => String(skill).trim()).filter(Boolean);

  if (!cleaned.length) {
    return emptyLabel ? (
      <Text color="fg.subtle" fontSize="sm">
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
          borderRadius="10px"
          px={3}
          py={1}
          bg="paper.200"
          color="ink.900"
          border="0"
          fontWeight="semibold"
          textTransform="none"
        >
          {skill}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge
          borderRadius="10px"
          px={3}
          py={1}
          bg="paper.200"
          color="ink.600"
          border="0"
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
