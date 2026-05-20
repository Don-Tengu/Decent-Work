import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Field,
  HStack,
  IconButton,
  NativeSelect,
  Portal,
  TagsInput,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  AlertCircle,
  Clock3,
  Edit3,
  FileText,
  Tag,
  X,
} from 'lucide-react';
import {
  DEFAULT_HOURLY_RATE_MAX,
  DEFAULT_HOURLY_RATE_MIN,
  MAX_JOB_ATTACHMENT_BYTES,
  MAX_JOB_ATTACHMENTS,
  MAX_JOB_SKILLS,
  MIN_JOB_SKILLS,
  formatAttachmentSize,
  formatMoneyInputValue,
  getAttachmentDisplayName,
  getAttachmentDraftId,
  getAttachmentSizeBytes,
  getBudgetSummary,
  getBudgetValidationError,
  getDescriptionValidationError,
  getDetailsValidationError,
  getMoneyInputValue,
  getNormalizedCustomSkillNames,
  getPositiveIntegerInputValue,
  getScopeDurationDays,
  getScopeSummary,
  isDescriptionErrorMessage,
  isScopeStepComplete,
  normalizeSkillName,
} from '../constants.js';
import { inputStyles } from '../styles.js';
import { buildTaxonomyGroups } from '../utils/taxonomy.js';
import StepFive from './StepFive.jsx';
import StepFour from './StepFour.jsx';
import StepOne from './StepOne.jsx';
import StepThree from './StepThree.jsx';

const optionTextColor = '#0f172a';
const skillDelimiter = /[,;\n]/;
const MAX_SKILL_NAME_LENGTH = 64;

const dialogContentStyles = {
  bg: 'rgba(8, 13, 25, 0.98)',
  color: 'white',
  border: '1px solid',
  borderColor: 'rgba(148, 163, 184, 0.2)',
  borderRadius: { base: '0', md: '22px' },
  boxShadow: '0 28px 80px rgba(0, 0, 0, 0.48)',
  overflow: 'hidden',
};

const actionButtonStyles = {
  borderRadius: 'full',
  fontWeight: 'bold',
  px: 5,
};

const getSkillNameKey = (value) => normalizeSkillName(value).toLowerCase();

const ReviewDialog = ({
  id,
  title,
  open,
  onClose,
  onSave,
  saveLabel = 'Save',
  children,
  size = 'lg',
}) => (
  <Dialog.Root
    lazyMount
    open={open}
    onOpenChange={({ open: nextOpen }) => {
      if (!nextOpen) {
        onClose();
      }
    }}
    placement="center"
    scrollBehavior="inside"
    size={{ mdDown: 'full', md: size }}
  >
    <Portal>
      <Dialog.Backdrop bg="rgba(2, 6, 23, 0.78)" backdropFilter="blur(8px)" />
      <Dialog.Positioner px={{ base: 0, md: 4 }} py={{ base: 0, md: 6 }}>
        <Dialog.Content {...dialogContentStyles} mt={{ base: 0, md: 6 }}>
          <Dialog.Header px={{ base: 5, md: 6 }} pt={{ base: 5, md: 6 }} pb={1}>
            <Dialog.Title
              id={`${id}-title`}
              fontSize={{ base: '2xl', md: '4xl' }}
              lineHeight="1"
              letterSpacing="0"
            >
              {title}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <IconButton
                aria-label="Close dialog"
                type="button"
                variant="ghost"
                color="rgba(226, 232, 240, 0.76)"
                position="absolute"
                top={{ base: 4, md: 5 }}
                right={{ base: 4, md: 5 }}
                borderRadius="full"
                minW="40px"
                w="40px"
                h="40px"
                _hover={{ bg: 'rgba(255, 255, 255, 0.08)', color: 'white' }}
              >
                <X size={24} strokeWidth={2} />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body px={{ base: 5, md: 6 }} py={4}>
            {children}
          </Dialog.Body>

          <Dialog.Footer
            px={{ base: 5, md: 6 }}
            pb={{ base: 5, md: 6 }}
            pt={2}
            justifyContent="flex-end"
            gap={3}
          >
            <Button
              type="button"
              variant="ghost"
              color="rgba(226, 232, 240, 0.82)"
              onClick={onClose}
              _hover={{ bg: 'rgba(148, 163, 184, 0.1)', color: 'white' }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              bg="green.500"
              color="gray.950"
              onClick={onSave}
              _hover={{ bg: 'green.400', transform: 'translateY(-1px)' }}
              _active={{ transform: 'translateY(0)' }}
              {...actionButtonStyles}
            >
              {saveLabel}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

const EditButton = ({ label, onClick }) => (
  <IconButton
    aria-label={label}
    type="button"
    variant="outline"
    color="rgba(226, 232, 240, 0.8)"
    borderColor="rgba(148, 163, 184, 0.32)"
    bg="rgba(15, 23, 42, 0.44)"
    borderRadius="full"
    minW="42px"
    w="42px"
    h="42px"
    onClick={onClick}
    _hover={{
      color: 'green.200',
      borderColor: 'rgba(134, 239, 172, 0.62)',
      bg: 'rgba(34, 197, 94, 0.1)',
    }}
  >
    <Edit3 size={18} strokeWidth={2.2} />
  </IconButton>
);

const ReviewSection = ({ title, children, onEdit }) => (
  <Box
    as="section"
    borderBottom="1px solid"
    borderColor="rgba(148, 163, 184, 0.15)"
    px={{ base: 5, md: 7 }}
    py={{ base: 5, md: 6 }}
    _last={{ borderBottom: '0' }}
  >
    <HStack align="start" justify="space-between" gap={5}>
      <Box minW="0" flex="1">
        <Text
          color="rgba(226, 232, 240, 0.56)"
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
          mb={3}
        >
          {title}
        </Text>
        {children}
      </Box>
      <EditButton label={`Edit ${title}`} onClick={onEdit} />
    </HStack>
  </Box>
);

const EmptyText = ({ children }) => (
  <Text color="rgba(226, 232, 240, 0.52)" fontStyle="italic">
    {children}
  </Text>
);

const ErrorMessage = ({ children }) => (
  <HStack color="red.300" gap={2} align="start" role="alert">
    <AlertCircle size={18} />
    <Text fontSize="sm" fontWeight="semibold">
      {children}
    </Text>
  </HStack>
);

const AttachmentList = ({ attachments }) => {
  if (!attachments?.length) {
    return null;
  }

  return (
    <VStack align="stretch" gap={2} mt={5}>
      {attachments.map((attachment) => {
        const attachmentName = getAttachmentDisplayName(attachment);

        return (
          <HStack
            key={attachment.id}
            justify="space-between"
            gap={3}
            bg="rgba(15, 23, 42, 0.52)"
            border="1px solid"
            borderColor="rgba(148, 163, 184, 0.16)"
            borderRadius="14px"
            px={4}
            py={3}
          >
            <HStack minW="0" gap={3}>
              <Box color="cyan.200" flex="0 0 auto">
                <FileText size={22} strokeWidth={1.8} />
              </Box>
              <Box minW="0">
                <Text color="white" fontWeight="semibold" overflow="hidden" textOverflow="ellipsis">
                  {attachmentName}
                </Text>
                <Text color="rgba(226, 232, 240, 0.56)" fontSize="sm">
                  {formatAttachmentSize(getAttachmentSizeBytes(attachment))}
                </Text>
              </Box>
            </HStack>
          </HStack>
        );
      })}
    </VStack>
  );
};

const SkillEditor = ({
  skillIds,
  localCustomSkills,
  error,
  onError,
  onCustomSkillsChange,
}) => {
  const customSkillLimit = Math.max(0, MAX_JOB_SKILLS - (skillIds?.length ?? 0));
  const selectedSkillCount = (skillIds?.length ?? 0) + localCustomSkills.length;
  const invalidSkillMessageRef = useRef('');
  const customSkillKeys = useMemo(
    () => new Set(localCustomSkills.map(getSkillNameKey)),
    [localCustomSkills]
  );

  const getCustomSkillValidationError = (inputValue) => {
    const normalizedSkillName = normalizeSkillName(inputValue);

    if (!normalizedSkillName) {
      return 'Enter a skill name before adding it.';
    }

    if (normalizedSkillName.length > MAX_SKILL_NAME_LENGTH) {
      return `Keep each skill under ${MAX_SKILL_NAME_LENGTH} characters.`;
    }

    if (customSkillKeys.has(normalizedSkillName.toLowerCase())) {
      return 'That skill is already added.';
    }

    return '';
  };

  const isValidCustomSkill = ({ inputValue }) => {
    const validationError = getCustomSkillValidationError(inputValue);
    invalidSkillMessageRef.current = validationError;

    return !validationError;
  };

  const handleSkillValueChange = ({ value }) => {
    onError('');
    invalidSkillMessageRef.current = '';
    onCustomSkillsChange(getNormalizedCustomSkillNames(value, customSkillLimit));
  };

  const handleSkillValueInvalid = () => {
    if (selectedSkillCount >= MAX_JOB_SKILLS) {
      onError(`Add no more than ${MAX_JOB_SKILLS} skills.`);
      return;
    }

    onError(invalidSkillMessageRef.current || 'Enter a valid skill name.');
  };

  return (
    <Field.Root required invalid={!!error}>
      <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Field.Label color="white" fontWeight="semibold">
          Skills
        </Field.Label>
        <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
          {selectedSkillCount}/{MAX_JOB_SKILLS} skills
        </Text>
      </HStack>

      <TagsInput.Root
        value={localCustomSkills}
        onValueChange={handleSkillValueChange}
        onValueInvalid={handleSkillValueInvalid}
        validate={isValidCustomSkill}
        max={customSkillLimit}
        maxLength={MAX_SKILL_NAME_LENGTH}
        name="reviewCustomSkillNames"
        delimiter={skillDelimiter}
        addOnPaste
        blurBehavior="add"
        editable={false}
        size="lg"
        w="full"
      >
        <TagsInput.Control
          minH="64px"
          px={4}
          py={3}
          gap={2}
          alignItems="center"
          bg={inputStyles.bg}
          border={inputStyles.border}
          borderColor={error ? 'red.300' : inputStyles.borderColor}
          borderRadius={inputStyles.borderRadius}
          _hover={inputStyles._hover}
          _focusWithin={inputStyles._focus}
        >
          <TagsInput.Context>
            {({ value }) =>
              value.map((skillName, index) => (
                <TagsInput.Item key={`${skillName}-${index}`} index={index} value={skillName}>
                  <TagsInput.ItemPreview
                    maxW="100%"
                    bg="rgba(34, 211, 238, 0.14)"
                    border="1px solid"
                    borderColor="rgba(125, 211, 252, 0.28)"
                    borderRadius="full"
                    color="cyan.50"
                    fontWeight="semibold"
                    px={3}
                    py={1}
                    _highlighted={{ bg: 'rgba(34, 211, 238, 0.22)' }}
                  >
                    <TagsInput.ItemText maxW="220px" overflow="hidden" textOverflow="ellipsis">
                      {skillName}
                    </TagsInput.ItemText>
                    <TagsInput.ItemDeleteTrigger
                      borderRadius="full"
                      color="rgba(226, 232, 240, 0.72)"
                      _hover={{ bg: 'rgba(255, 255, 255, 0.12)', color: 'white' }}
                      aria-label={`Remove ${skillName}`}
                    />
                  </TagsInput.ItemPreview>
                  <TagsInput.ItemInput />
                </TagsInput.Item>
              ))
            }
          </TagsInput.Context>

          <TagsInput.Input
            placeholder={selectedSkillCount >= MAX_JOB_SKILLS ? 'Skill limit reached' : 'Add a skill'}
            disabled={selectedSkillCount >= MAX_JOB_SKILLS}
            color="white"
            flex="1 1 180px"
            minW="140px"
            _placeholder={inputStyles._placeholder}
          />
        </TagsInput.Control>
        <TagsInput.HiddenInput />
      </TagsInput.Root>

      {error ? <Field.ErrorText color="red.300">{error}</Field.ErrorText> : null}
    </Field.Root>
  );
};

const StepReview = ({
  draft,
  submitError,
  onDraftPatch,
  taxonomyNodes,
  taxonomyLoading,
  taxonomyError,
  mode = 'publish',
}) => {
  const isEditingPosting = mode === 'edit-posting';
  const [activeDialog, setActiveDialog] = useState('');
  const [titleDraft, setTitleDraft] = useState(draft.title);
  const [titleDialogError, setTitleDialogError] = useState('');
  const [detailsDraft, setDetailsDraft] = useState({
    description: draft.description,
    attachments: draft.attachments ?? [],
  });
  const [detailsDialogError, setDetailsDialogError] = useState('');
  const [categoryDraft, setCategoryDraft] = useState({
    categoryId: draft.categoryId,
    specialtyId: draft.specialtyId,
  });
  const [categoryDialogError, setCategoryDialogError] = useState('');
  const [skillsDraft, setSkillsDraft] = useState(draft.customSkillNames ?? []);
  const [skillsDialogError, setSkillsDialogError] = useState('');
  const [scopeDraft, setScopeDraft] = useState(draft);
  const [scopeDialogError, setScopeDialogError] = useState('');
  const [budgetDraft, setBudgetDraft] = useState(draft);
  const [budgetDialogError, setBudgetDialogError] = useState('');

  const { categories, specialtiesByCategoryId } = useMemo(
    () => buildTaxonomyGroups(taxonomyNodes),
    [taxonomyNodes]
  );
  const categorySpecialties = specialtiesByCategoryId.get(categoryDraft.categoryId) ?? [];
  const selectedCategory = categories.find((category) => String(category.id) === draft.categoryId);
  const selectedSpecialty = (specialtiesByCategoryId.get(draft.categoryId) ?? []).find(
    (specialty) => String(specialty.id) === draft.specialtyId
  );
  const selectedCategoryName = selectedCategory?.name || draft.categoryName || '';
  const selectedSpecialtyName = selectedSpecialty?.name || draft.specialtyName || '';
  const skillLabels = [
    ...(draft.skillIds ?? []).map(
      (skillId) => draft.skillNamesById?.[String(skillId)] ?? `Skill ${skillId}`
    ),
    ...(draft.customSkillNames ?? []),
  ];
  const descriptionDetailsError = isDescriptionErrorMessage(detailsDialogError)
    ? detailsDialogError
    : '';
  const attachmentDetailsError =
    detailsDialogError && !isDescriptionErrorMessage(detailsDialogError)
      ? detailsDialogError
      : '';

  const closeDialog = () => {
    setActiveDialog('');
  };

  const openDialog = (dialogId) => {
    setTitleDialogError('');
    setDetailsDialogError('');
    setCategoryDialogError('');
    setSkillsDialogError('');
    setScopeDialogError('');
    setBudgetDialogError('');
    setTitleDraft(draft.title);
    setDetailsDraft({
      description: draft.description,
      attachments: [...(draft.attachments ?? [])],
    });
    setCategoryDraft({
      categoryId: draft.categoryId,
      specialtyId: draft.specialtyId,
    });
    setSkillsDraft([...(draft.customSkillNames ?? [])]);
    setScopeDraft({ ...draft });
    setBudgetDraft({ ...draft });
    setActiveDialog(dialogId);
  };

  const handleTitleChange = (event) => {
    const { value } = event.target;

    setTitleDraft(value);

    if (value.trim()) {
      setTitleDialogError('');
    }
  };

  const handleTitleSave = () => {
    if (!titleDraft.trim()) {
      setTitleDialogError('Job title is required before saving.');
      return;
    }

    onDraftPatch({ title: titleDraft });
    closeDialog();
  };

  const handleDetailsDescriptionChange = (event) => {
    const { value } = event.target;

    setDetailsDraft((currentDraft) => ({
      ...currentDraft,
      description: value,
    }));

    if (!getDescriptionValidationError(value)) {
      setDetailsDialogError('');
    }
  };

  const handleDetailsDescriptionBlur = (event) => {
    setDetailsDialogError(getDescriptionValidationError(event.target.value));
  };

  const handleDetailsAttachmentsAdd = (files) => {
    if (!files.length) {
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_JOB_ATTACHMENT_BYTES);

    if (oversizedFile) {
      setDetailsDialogError(`${oversizedFile.name} is larger than 100MB.`);
      return;
    }

    const remainingSlots = MAX_JOB_ATTACHMENTS - (detailsDraft.attachments?.length ?? 0);

    if (remainingSlots < 1) {
      setDetailsDialogError(`Attach no more than ${MAX_JOB_ATTACHMENTS} files.`);
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);

    setDetailsDraft((currentDraft) => ({
      ...currentDraft,
      attachments: [
        ...(currentDraft.attachments ?? []),
        ...acceptedFiles.map((file) => ({
          id: getAttachmentDraftId(file),
          file,
        })),
      ],
    }));

    if (acceptedFiles.length < files.length) {
      setDetailsDialogError(`Only ${MAX_JOB_ATTACHMENTS} files can be attached.`);
      return;
    }

    setDetailsDialogError('');
  };

  const handleDetailsAttachmentRemove = (attachmentId) => {
    setDetailsDraft((currentDraft) => ({
      ...currentDraft,
      attachments: (currentDraft.attachments ?? []).filter(
        (attachment) => attachment.id !== attachmentId
      ),
    }));
    setDetailsDialogError('');
  };

  const handleDetailsSave = () => {
    const validationError = getDetailsValidationError(detailsDraft);

    if (validationError) {
      setDetailsDialogError(validationError);
      return;
    }

    onDraftPatch(detailsDraft);
    closeDialog();
  };

  const handleCategoryChange = (event) => {
    const { value } = event.currentTarget;

    setCategoryDraft({
      categoryId: value,
      specialtyId: '',
    });
    setCategoryDialogError('');
  };

  const handleSpecialtyChange = (event) => {
    const { value } = event.currentTarget;

    setCategoryDraft((currentDraft) => ({
      ...currentDraft,
      specialtyId: value,
    }));
    setCategoryDialogError('');
  };

  const handleCategorySave = () => {
    if (!categoryDraft.categoryId || !categoryDraft.specialtyId) {
      setCategoryDialogError('Select a category and specialty before saving.');
      return;
    }

    onDraftPatch(categoryDraft);
    closeDialog();
  };

  const handleSkillsSave = () => {
    const selectedSkillCount =
      (draft.skillIds?.length ?? 0) + (skillsDraft?.length ?? 0);

    if (selectedSkillCount < MIN_JOB_SKILLS) {
      setSkillsDialogError('Add at least one skill before saving.');
      return;
    }

    if (selectedSkillCount > MAX_JOB_SKILLS) {
      setSkillsDialogError(`Add no more than ${MAX_JOB_SKILLS} skills.`);
      return;
    }

    onDraftPatch({ customSkillNames: getNormalizedCustomSkillNames(skillsDraft) });
    closeDialog();
  };

  const updateScopeDraft = (updates) => {
    setScopeDraft((currentDraft) => {
      const nextDraft = {
        ...currentDraft,
        ...updates,
      };

      return {
        ...nextDraft,
        scopeDurationDays: getScopeDurationDays(
          nextDraft.scopeDurationAmount,
          nextDraft.scopeDurationUnit
        ),
      };
    });
    setScopeDialogError('');
  };

  const handleScopeSave = () => {
    if (!isScopeStepComplete(scopeDraft)) {
      setScopeDialogError('Complete the scope details before saving.');
      return;
    }

    onDraftPatch({
      scopeSize: scopeDraft.scopeSize,
      scopeDurationAmount: scopeDraft.scopeDurationAmount,
      scopeDurationUnit: scopeDraft.scopeDurationUnit,
      scopeDurationDays: scopeDraft.scopeDurationDays,
      experienceLevel: scopeDraft.experienceLevel,
      contractToHire: scopeDraft.contractToHire,
    });
    closeDialog();
  };

  const handleBudgetTypeChange = (value) => {
    setBudgetDraft((currentDraft) => {
      if (value === 'FIXED') {
        return {
          ...currentDraft,
          budgetType: 'FIXED',
          budgetNotReadyConfirmed: false,
          budgetNotReadyType: '',
          hourlyRateMin: '',
          hourlyRateMax: '',
          fixedBudget: currentDraft.fixedBudget,
        };
      }

      return {
        ...currentDraft,
        budgetType: 'HOURLY',
        budgetNotReadyConfirmed: false,
        budgetNotReadyType: '',
        hourlyRateMin: currentDraft.hourlyRateMin || DEFAULT_HOURLY_RATE_MIN,
        hourlyRateMax: currentDraft.hourlyRateMax || DEFAULT_HOURLY_RATE_MAX,
        fixedBudget: '',
      };
    });
    setBudgetDialogError('');
  };

  const handleBudgetAmountChange = (fieldName, value) => {
    setBudgetDraft((currentDraft) => {
      const nextBudgetType = fieldName === 'fixedBudget' ? 'FIXED' : 'HOURLY';

      return {
        ...currentDraft,
        budgetType: currentDraft.budgetType === 'NOT_READY' ? nextBudgetType : currentDraft.budgetType,
        budgetNotReadyConfirmed: false,
        budgetNotReadyType: '',
        [fieldName]: getMoneyInputValue(value),
      };
    });
    setBudgetDialogError('');
  };

  const handleBudgetAmountBlur = (fieldName) => {
    const formattedValue = formatMoneyInputValue(budgetDraft[fieldName]);

    setBudgetDraft((currentDraft) => ({
      ...currentDraft,
      [fieldName]: formatMoneyInputValue(currentDraft[fieldName]),
    }));

    setBudgetDialogError(
      getBudgetValidationError({
        ...budgetDraft,
        [fieldName]: formattedValue,
      })
    );
  };

  const handleContinueWithoutBudget = (budgetType) => {
    setBudgetDraft((currentDraft) => ({
      ...currentDraft,
      budgetType: 'NOT_READY',
      budgetNotReadyConfirmed: true,
      budgetNotReadyType: budgetType,
      hourlyRateMin: '',
      hourlyRateMax: '',
      fixedBudget: '',
    }));
    setBudgetDialogError('');
  };

  const handleBudgetSave = () => {
    const validationError = getBudgetValidationError(budgetDraft);

    if (validationError) {
      setBudgetDialogError(validationError);
      return;
    }

    onDraftPatch({
      budgetType: budgetDraft.budgetType,
      budgetNotReadyConfirmed: budgetDraft.budgetNotReadyConfirmed,
      budgetNotReadyType: budgetDraft.budgetNotReadyType,
      hourlyRateMin: budgetDraft.hourlyRateMin,
      hourlyRateMax: budgetDraft.hourlyRateMax,
      fixedBudget: budgetDraft.fixedBudget,
      currencyCode: budgetDraft.currencyCode,
      paymentModel: budgetDraft.paymentModel,
    });
    closeDialog();
  };

  return (
    <VStack align="stretch" gap={5}>
      <Box>
        <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm" fontWeight="medium">
          {isEditingPosting
            ? 'Edit each section, then save the changes to your live posting.'
            : 'Review each section, make any final edits, then publish when you are ready.'}
        </Text>
      </Box>

      {submitError ? <ErrorMessage>{submitError}</ErrorMessage> : null}

      <Box
        border="1px solid"
        borderColor="rgba(148, 163, 184, 0.18)"
        bg="rgba(15, 23, 42, 0.5)"
        borderRadius="20px"
        overflow="hidden"
      >
        <ReviewSection title="Job name" onEdit={() => openDialog('title')}>
          <Text color="white" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" lineHeight="1.2">
            {draft.title || 'Untitled job post'}
          </Text>
        </ReviewSection>

        <ReviewSection title="Job description" onEdit={() => openDialog('description')}>
          {draft.description ? (
            <Text color="rgba(248, 250, 252, 0.92)" whiteSpace="pre-wrap" lineHeight="1.75">
              {draft.description}
            </Text>
          ) : (
            <EmptyText>No description yet.</EmptyText>
          )}
          <AttachmentList attachments={draft.attachments} />
        </ReviewSection>

        <ReviewSection title="Category" onEdit={() => openDialog('category')}>
          <VStack align="start" gap={1}>
            <Text color="white" fontWeight="semibold">
              {selectedSpecialtyName || selectedCategoryName || 'No category selected'}
            </Text>
            {selectedCategoryName && selectedSpecialtyName ? (
              <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
                {selectedCategoryName}
                {selectedSpecialty?.subcategoryName ? ` / ${selectedSpecialty.subcategoryName}` : ''}
              </Text>
            ) : null}
          </VStack>
        </ReviewSection>

        <ReviewSection title="Skills" onEdit={() => openDialog('skills')}>
          {skillLabels.length ? (
            <HStack gap={2} flexWrap="wrap">
              {skillLabels.map((skillName, index) => (
                <Box
                  key={`${skillName}-${index}`}
                  bg="rgba(226, 232, 240, 0.12)"
                  color="white"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  {skillName}
                </Box>
              ))}
            </HStack>
          ) : (
            <EmptyText>No skills selected.</EmptyText>
          )}
        </ReviewSection>

        <ReviewSection title="Scope" onEdit={() => openDialog('scope')}>
          <Text color="rgba(248, 250, 252, 0.92)" lineHeight="1.7">
            {getScopeSummary(draft)}
          </Text>
        </ReviewSection>

        <ReviewSection title="Budget" onEdit={() => openDialog('budget')}>
          <Text color="white" fontWeight="semibold">
            {getBudgetSummary(draft)}
          </Text>
        </ReviewSection>
      </Box>

      <ReviewDialog
        id="review-title-dialog"
        title="Edit title"
        open={activeDialog === 'title'}
        onClose={closeDialog}
        onSave={handleTitleSave}
      >
        <StepOne
          draft={{ ...draft, title: titleDraft }}
          error={titleDialogError}
          onChange={handleTitleChange}
        />
      </ReviewDialog>

      <ReviewDialog
        id="review-description-dialog"
        title="Edit description"
        open={activeDialog === 'description'}
        onClose={closeDialog}
        onSave={handleDetailsSave}
        size="lg"
      >
        <StepFive
          draft={detailsDraft}
          descriptionError={descriptionDetailsError}
          attachmentError={attachmentDetailsError}
          submitError=""
          onDescriptionChange={handleDetailsDescriptionChange}
          onDescriptionBlur={handleDetailsDescriptionBlur}
          onAttachmentsAdd={handleDetailsAttachmentsAdd}
          onAttachmentRemove={handleDetailsAttachmentRemove}
        />
      </ReviewDialog>

      <ReviewDialog
        id="review-category-dialog"
        title="Edit category"
        open={activeDialog === 'category'}
        onClose={closeDialog}
        onSave={handleCategorySave}
        saveLabel="Apply"
      >
        <VStack align="stretch" gap={6}>
          <Field.Root required invalid={!!categoryDialogError && !categoryDraft.categoryId}>
            <Field.Label color="white" fontWeight="semibold">
              Category
            </Field.Label>
            <NativeSelect.Root size="lg" disabled={taxonomyLoading || !!taxonomyError}>
              <NativeSelect.Field
                name="reviewCategoryId"
                value={categoryDraft.categoryId}
                onChange={handleCategoryChange}
                placeholder={taxonomyLoading ? 'Loading categories...' : 'Select category'}
                h="58px"
                {...inputStyles}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id} style={{ color: optionTextColor }}>
                    {category.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="rgba(226, 232, 240, 0.74)" />
            </NativeSelect.Root>
          </Field.Root>

          <Field.Root required invalid={!!categoryDialogError && !categoryDraft.specialtyId}>
            <Field.Label color="white" fontWeight="semibold">
              Specialty
            </Field.Label>
            <NativeSelect.Root
              size="lg"
              disabled={!categoryDraft.categoryId || taxonomyLoading || !!taxonomyError}
            >
              <NativeSelect.Field
                name="reviewSpecialtyId"
                value={categoryDraft.specialtyId}
                onChange={handleSpecialtyChange}
                placeholder={categoryDraft.categoryId ? 'Select specialty' : 'Select category first'}
                h="58px"
                {...inputStyles}
              >
                {categorySpecialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id} style={{ color: optionTextColor }}>
                    {specialty.subcategoryName} / {specialty.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="rgba(226, 232, 240, 0.74)" />
            </NativeSelect.Root>
          </Field.Root>

          {categoryDialogError ? <ErrorMessage>{categoryDialogError}</ErrorMessage> : null}
          {taxonomyError ? <ErrorMessage>{taxonomyError.message}</ErrorMessage> : null}
        </VStack>
      </ReviewDialog>

      <ReviewDialog
        id="review-skills-dialog"
        title="Edit skills"
        open={activeDialog === 'skills'}
        onClose={closeDialog}
        onSave={handleSkillsSave}
      >
        <VStack align="stretch" gap={4}>
          <SkillEditor
            skillIds={draft.skillIds}
            localCustomSkills={skillsDraft}
            error={skillsDialogError}
            onError={setSkillsDialogError}
            onCustomSkillsChange={setSkillsDraft}
          />
          <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
            Add {MIN_JOB_SKILLS}-{MAX_JOB_SKILLS} skills. For best results, add 3-5.
          </Text>
        </VStack>
      </ReviewDialog>

      <ReviewDialog
        id="review-scope-dialog"
        title="Edit scope"
        open={activeDialog === 'scope'}
        onClose={closeDialog}
        onSave={handleScopeSave}
        size="lg"
      >
        <StepThree
          draft={scopeDraft}
          error={scopeDialogError}
          onScopeSizeChange={(value) => updateScopeDraft({ scopeSize: value })}
          onDurationAmountChange={(value) =>
            updateScopeDraft({ scopeDurationAmount: getPositiveIntegerInputValue(value) })
          }
          onDurationUnitChange={(value) => updateScopeDraft({ scopeDurationUnit: value })}
          onExperienceLevelChange={(value) => updateScopeDraft({ experienceLevel: value })}
          onContractToHireChange={(checked) => updateScopeDraft({ contractToHire: checked })}
        />
      </ReviewDialog>

      <ReviewDialog
        id="review-budget-dialog"
        title="Edit budget"
        open={activeDialog === 'budget'}
        onClose={closeDialog}
        onSave={handleBudgetSave}
        size="lg"
      >
        <VStack align="stretch" gap={5}>
          <HStack color="rgba(226, 232, 240, 0.62)" gap={3} flexWrap="wrap">
            <HStack gap={2}>
              <Clock3 size={18} />
              <Text fontSize="sm">Hourly rate</Text>
            </HStack>
            <HStack gap={2}>
              <Tag size={18} />
              <Text fontSize="sm">Fixed price</Text>
            </HStack>
          </HStack>
          <StepFour
            draft={budgetDraft}
            error={budgetDialogError}
            onBudgetTypeChange={handleBudgetTypeChange}
            onBudgetAmountChange={handleBudgetAmountChange}
            onBudgetAmountBlur={handleBudgetAmountBlur}
            onContinueWithoutBudget={handleContinueWithoutBudget}
          />
        </VStack>
      </ReviewDialog>
    </VStack>
  );
};

export default StepReview;
