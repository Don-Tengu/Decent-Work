import { toApiUrl } from '@/config/api.js';

const readUploadErrorMessage = async (response) => {
  try {
    const errorBody = await response.json();
    return errorBody.message || 'Attachment upload failed.';
  } catch {
    return 'Attachment upload failed.';
  }
};

export const uploadBidAttachments = async (bidId, attachments = []) => {
  const token = localStorage.getItem('token');

  for (const attachment of attachments) {
    if (!attachment.file) {
      continue;
    }

    const formData = new FormData();
    formData.append('files', attachment.file);

    const response = await fetch(toApiUrl(`/api/bids/${bidId}/attachments`), {
      method: 'POST',
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readUploadErrorMessage(response));
    }
  }
};
