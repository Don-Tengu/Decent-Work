import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Field,
  HStack,
  IconButton,
  NativeSelect,
  SimpleGrid,
  TagsInput,
  Text,
  VStack,
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import { inputStyles } from '../styles.js';
import { buildTaxonomyGroups } from '../utils/taxonomy.js';
import { getSelectedSkillCount, MAX_JOB_SKILLS, MIN_JOB_SKILLS } from '../constants.js';

const optionTextColor = '#0f172a';
const MAX_SKILL_NAME_LENGTH = 64;
const skillDelimiter = /[,;\n]/;

const normalizeSkillName = (value = '') => value.trim().replace(/\s+/g, ' ');

const getSkillNameKey = (value) => normalizeSkillName(value).toLowerCase();

const StepTwo = ({
  draft,
  selectionError,
  onCategoryChange,
  onSpecialtyChange,
  onBuiltInSkillRemove,
  onCustomSkillsChange,
  taxonomyNodes,
  taxonomyLoading,
  taxonomyError,
}) => {
  const [inputError, setInputError] = useState('');
  const invalidSkillMessageRef = useRef('');
  const { categories, specialtiesByCategoryId } = useMemo(
    () => buildTaxonomyGroups(taxonomyNodes),
    [taxonomyNodes]
  );
  const specialties = specialtiesByCategoryId.get(draft.categoryId) ?? [];
  const selectedSkillCount = getSelectedSkillCount(draft);
  const customSkillLimit = Math.max(0, MAX_JOB_SKILLS - (draft.skillIds?.length ?? 0));
  const hasSkillSelectionError =
    !!selectionError && selectionError.toLowerCase().includes('skill');
  const taxonomySelectionError = selectionError && !hasSkillSelectionError ? selectionError : '';
  const skillError = inputError || (hasSkillSelectionError ? selectionError : '');
  const builtInSkillTags = useMemo(
    () =>
      (draft.skillIds ?? []).map((skillId) => {
        const normalizedSkillId = String(skillId);

        return {
          id: normalizedSkillId,
          name: draft.skillNamesById?.[normalizedSkillId] ?? `Skill ${normalizedSkillId}`,
        };
      }),
    [draft.skillIds, draft.skillNamesById]
  );
  const selectedSkillNameKeys = useMemo(
    () => new Set([
      ...builtInSkillTags.map((skill) => getSkillNameKey(skill.name)),
      ...(draft.customSkillNames ?? []).map(getSkillNameKey),
    ]),
    [builtInSkillTags, draft.customSkillNames]
  );

  const getCustomSkillValidationError = (inputValue) => {
    const normalizedSkillName = normalizeSkillName(inputValue);

    if (!normalizedSkillName) {
      return 'Enter a skill name before adding it.';
    }

    if (normalizedSkillName.length > MAX_SKILL_NAME_LENGTH) {
      return `Keep each skill under ${MAX_SKILL_NAME_LENGTH} characters.`;
    }

    if (selectedSkillNameKeys.has(normalizedSkillName.toLowerCase())) {
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
    setInputError('');
    invalidSkillMessageRef.current = '';
    onCustomSkillsChange(value);
  };

  const handleSkillValueInvalid = () => {
    if (selectedSkillCount >= MAX_JOB_SKILLS) {
      setInputError(`Add no more than ${MAX_JOB_SKILLS} skills.`);
      return;
    }

    setInputError(invalidSkillMessageRef.current || 'Enter a valid skill name.');
  };

  const handleBuiltInSkillRemove = (skillId) => {
    setInputError('');
    invalidSkillMessageRef.current = '';
    onBuiltInSkillRemove(skillId);
  };

  return (
    <VStack align="stretch" gap={6}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Field.Root required invalid={!!selectionError && !draft.categoryId}>
          <Field.Label color="white" fontWeight="semibold">
            Category
          </Field.Label>
          <NativeSelect.Root size="lg" disabled={taxonomyLoading || !!taxonomyError}>
            <NativeSelect.Field
              name="categoryId"
              value={draft.categoryId}
              onChange={onCategoryChange}
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

        <Field.Root required invalid={!!selectionError && !draft.specialtyId}>
          <Field.Label color="white" fontWeight="semibold">
            Specialty
          </Field.Label>
          <NativeSelect.Root
            size="lg"
            disabled={!draft.categoryId || taxonomyLoading || !!taxonomyError}
          >
            <NativeSelect.Field
              name="specialtyId"
              value={draft.specialtyId}
              onChange={onSpecialtyChange}
              placeholder={draft.categoryId ? 'Select specialty' : 'Select category first'}
              h="58px"
              {...inputStyles}
            >
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id} style={{ color: optionTextColor }}>
                  {specialty.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="rgba(226, 232, 240, 0.74)" />
          </NativeSelect.Root>
        </Field.Root>
      </SimpleGrid>

      <Field.Root required invalid={!!skillError}>
        <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
          <Field.Label color="white" fontWeight="semibold">
            Skills
          </Field.Label>
          <Text color="rgba(226, 232, 240, 0.6)" fontSize="sm">
            {selectedSkillCount}/{MAX_JOB_SKILLS} skills
          </Text>
        </HStack>

        <TagsInput.Root
          value={draft.customSkillNames}
          onValueChange={handleSkillValueChange}
          onValueInvalid={handleSkillValueInvalid}
          validate={isValidCustomSkill}
          max={customSkillLimit}
          maxLength={MAX_SKILL_NAME_LENGTH}
          name="customSkillNames"
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
            borderColor={skillError ? 'red.300' : inputStyles.borderColor}
            borderRadius={inputStyles.borderRadius}
            _hover={inputStyles._hover}
            _focusWithin={inputStyles._focus}
          >
            {builtInSkillTags.map((skill) => (
              <Box
                key={skill.id}
                as="span"
                display="inline-flex"
                alignItems="center"
                maxW="100%"
                bg="rgba(34, 211, 238, 0.14)"
                border="1px solid"
                borderColor="rgba(125, 211, 252, 0.28)"
                borderRadius="full"
                color="cyan.50"
                fontWeight="semibold"
                px={3}
                py={1}
              >
                <Text as="span" maxW="220px" overflow="hidden" textOverflow="ellipsis">
                  {skill.name}
                </Text>
                <IconButton
                  aria-label={`Remove ${skill.name}`}
                  type="button"
                  variant="ghost"
                  size="2xs"
                  minW="24px"
                  w="24px"
                  h="24px"
                  ml={1}
                  borderRadius="full"
                  color="rgba(226, 232, 240, 0.72)"
                  onClick={() => handleBuiltInSkillRemove(skill.id)}
                  _hover={{ bg: 'rgba(255, 255, 255, 0.12)', color: 'white' }}
                >
                  <X size={14} strokeWidth={2.4} />
                </IconButton>
              </Box>
            ))}

            <TagsInput.Context>
              {({ value }) =>
                value.map((skillName, index) => (
                  <TagsInput.Item key={skillName} index={index} value={skillName}>
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
              placeholder={
                selectedSkillCount >= MAX_JOB_SKILLS
                  ? 'Skill limit reached'
                  : 'Search or add a skill'
              }
              disabled={selectedSkillCount >= MAX_JOB_SKILLS}
              color="white"
              flex="1 1 180px"
              minW="140px"
              _placeholder={inputStyles._placeholder}
            />
          </TagsInput.Control>
          <TagsInput.HiddenInput />
        </TagsInput.Root>

        <HStack justify="space-between" gap={3} align="start" flexWrap="wrap">
          <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm">
            Add {MIN_JOB_SKILLS}-{MAX_JOB_SKILLS} skills. For best results, add 3-5.
          </Text>
          {skillError ? <Field.ErrorText color="red.300">{skillError}</Field.ErrorText> : null}
        </HStack>
      </Field.Root>

      {taxonomySelectionError ? (
        <Text color="red.300" fontSize="sm">
          {taxonomySelectionError}
        </Text>
      ) : null}

      {taxonomyError ? (
        <Text color="red.300" fontSize="sm">
          {taxonomyError.message}
        </Text>
      ) : null}
    </VStack>
  );
};

export default StepTwo;
