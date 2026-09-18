import React from 'react';
import { Avatar } from '@chakra-ui/react';
import { getDisplayName } from '@/utils/user.js';

// Glass-themed avatar. `profileImage` is a plain URL/string on the user's
// profile (there is no upload pipeline yet); when it is empty we fall back to
// initials derived from the display name.
const UserAvatar = ({ user, size = 'md', ...props }) => {
  const name = getDisplayName(user);
  const image = user?.profile?.profileImage || undefined;

  return (
    <Avatar.Root
      size={size}
      bg="bg.muted"
      color="fg.default"
      borderWidth="1px"
      borderColor="border.default"
      {...props}
    >
      <Avatar.Fallback name={name} />
      {image ? <Avatar.Image src={image} alt={name} /> : null}
    </Avatar.Root>
  );
};

export default UserAvatar;
