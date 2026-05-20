import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, Grid, Heading, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell.jsx';
import { pageAccents } from '@/common.js';
import { GET_JOB, GET_SKILL_TAXONOMY, PUBLISH_JOB, SAVE_JOB_DRAFT, UPDATE_JOB } from '@/graphql/queries.js';
import JobPostFooter from './components/JobPostFooter.jsx';
import StepContent from './components/StepContent.jsx';
import StepInfoColumn from './components/StepInfoColumn.jsx';
import StepReview from './components/StepReview.jsx';
import {
  getBudgetValidationError,
  getCompletedStepCount,
  getDescriptionValidationError,
  getDetailsValidationError,
  getDraftStepActiveStepIndex,
  getDraftStepForSave,
  getAttachmentDraftId,
  getAttachmentDisplayName,
  getJobPostValidationError,
  getMoneyInputValue,
  getNormalizedCustomSkillNames,
  getScopeDurationDays,
  getSelectedSkillCount,
  getStepProgressValue,
  getPositiveIntegerInputValue,
  formatMoneyInputValue,
  isActiveDraftStepValidForSave,
  DEFAULT_HOURLY_RATE_MAX,
  DEFAULT_HOURLY_RATE_MIN,
  isDescriptionErrorMessage,
  isScopeStepComplete,
  JOB_POST_INITIAL_DRAFT,
  JOB_POST_STEPS,
  JOB_DRAFT_STEPS,
  MAX_JOB_ATTACHMENTS,
  MAX_JOB_ATTACHMENT_BYTES,
  MAX_JOB_SKILLS,
  MIN_JOB_SKILLS,
  parseBudgetAmount,
} from './constants.js';

const DRAFT_FIELDS_TO_RESTORE_BY_ACTIVE_STEP_INDEX = {
  1: [
    'categoryId',
    'categoryName',
    'specialtyId',
    'specialtyName',
    'skillIds',
    'skillNamesById',
    'customSkillNames',
    'scopeSize',
    'scopeDurationAmount',
    'scopeDurationUnit',
    'scopeDurationDays',
    'experienceLevel',
    'contractToHire',
    'budgetType',
    'budgetNotReadyConfirmed',
    'budgetNotReadyType',
    'hourlyRateMin',
    'hourlyRateMax',
    'fixedBudget',
    'currencyCode',
    'paymentModel',
    'description',
    'attachments',
  ],
  2: [
    'scopeSize',
    'scopeDurationAmount',
    'scopeDurationUnit',
    'scopeDurationDays',
    'experienceLevel',
    'contractToHire',
    'budgetType',
    'budgetNotReadyConfirmed',
    'budgetNotReadyType',
    'hourlyRateMin',
    'hourlyRateMax',
    'fixedBudget',
    'currencyCode',
    'paymentModel',
    'description',
    'attachments',
  ],
  3: [
    'budgetType',
    'budgetNotReadyConfirmed',
    'budgetNotReadyType',
    'hourlyRateMin',
    'hourlyRateMax',
    'fixedBudget',
    'currencyCode',
    'paymentModel',
    'description',
    'attachments',
  ],
  4: ['description', 'attachments'],
};

const getDraftForSafeSave = (draft, savedDraft, activeStepIndex, activeStepIsValid) => {
  if (!savedDraft || activeStepIsValid) {
    return draft;
  }

  return (DRAFT_FIELDS_TO_RESTORE_BY_ACTIVE_STEP_INDEX[activeStepIndex] ?? []).reduce(
    (nextDraft, fieldName) => ({
      ...nextDraft,
      [fieldName]: savedDraft[fieldName],
    }),
    draft
  );
};

const getCreateJobInput = (draft) => {
  const isHourly = draft.budgetType === 'HOURLY';
  const isFixed = draft.budgetType === 'FIXED';

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    categoryId: draft.categoryId,
    specialtyId: draft.specialtyId,
    skillIds: draft.skillIds ?? [],
    customSkillNames: draft.customSkillNames ?? [],
    scopeSize: draft.scopeSize,
    scopeDurationAmount: Number.parseInt(draft.scopeDurationAmount, 10),
    scopeDurationUnit: draft.scopeDurationUnit,
    experienceLevel: draft.experienceLevel,
    contractToHire: draft.contractToHire,
    budgetType: draft.budgetType,
    hourlyRateMin: isHourly ? parseBudgetAmount(draft.hourlyRateMin) : null,
    hourlyRateMax: isHourly ? parseBudgetAmount(draft.hourlyRateMax) : null,
    fixedBudget: isFixed ? parseBudgetAmount(draft.fixedBudget) : null,
    currencyCode: draft.currencyCode,
    paymentModel: draft.paymentModel,
  };
};

const getNullableMoney = (draft, fieldName, isActive) =>
  isActive ? parseBudgetAmount(draft[fieldName]) : null;

const getSaveJobDraftInput = (draft, draftStep) => {
  const isHourly = draft.budgetType === 'HOURLY';
  const isFixed = draft.budgetType === 'FIXED';

  return {
    title: draft.title,
    description: draft.description,
    categoryId: draft.categoryId || null,
    specialtyId: draft.specialtyId || null,
    skillIds: draft.skillIds ?? [],
    customSkillNames: draft.customSkillNames ?? [],
    draftStep,
    scopeSize: draft.scopeSize,
    scopeDurationAmount: Number.parseInt(draft.scopeDurationAmount, 10) || 1,
    scopeDurationUnit: draft.scopeDurationUnit,
    experienceLevel: draft.experienceLevel,
    contractToHire: draft.contractToHire,
    budgetType: draft.budgetType,
    hourlyRateMin: getNullableMoney(draft, 'hourlyRateMin', isHourly),
    hourlyRateMax: getNullableMoney(draft, 'hourlyRateMax', isHourly),
    fixedBudget: getNullableMoney(draft, 'fixedBudget', isFixed),
    currencyCode: draft.currencyCode,
    paymentModel: draft.paymentModel,
  };
};

const getPersistedAttachmentDraft = (attachment) => ({
  id: String(attachment.id),
  persisted: true,
  fileName: attachment.fileName,
  contentType: attachment.contentType,
  fileSizeBytes: attachment.fileSizeBytes,
  publicUrl: attachment.publicUrl,
});

const getJobSkillId = (tag) => tag.skillId ?? tag.skill?.id;

const getJobSkillName = (tag) => tag.skill?.name ?? tag.name;

const getDraftFromJob = (job) => {
  const jobSkillTags = job.jobSkillTags ?? [];
  const builtInSkillTags = jobSkillTags.filter((tag) => !tag.custom && getJobSkillId(tag));

  return {
    ...JOB_POST_INITIAL_DRAFT,
    draftStep: job.draftStep ?? JOB_DRAFT_STEPS.SKILLS,
    title: job.title ?? '',
    description: job.description ?? '',
    categoryId: job.category?.id ? String(job.category.id) : '',
    categoryName: job.category?.name ?? '',
    specialtyId: job.specialty?.id ? String(job.specialty.id) : '',
    specialtyName: job.specialty?.name ?? '',
    skillIds: builtInSkillTags.map((tag) => String(getJobSkillId(tag))),
    skillNamesById: builtInSkillTags.reduce((namesById, tag) => ({
      ...namesById,
      [String(getJobSkillId(tag))]: getJobSkillName(tag),
    }), {}),
    customSkillNames: jobSkillTags
      .filter((tag) => tag.custom)
      .map((tag) => tag.name),
    scopeSize: job.scopeSize ?? JOB_POST_INITIAL_DRAFT.scopeSize,
    scopeDurationAmount: String(job.scopeDurationAmount ?? JOB_POST_INITIAL_DRAFT.scopeDurationAmount),
    scopeDurationUnit: job.scopeDurationUnit ?? JOB_POST_INITIAL_DRAFT.scopeDurationUnit,
    scopeDurationDays: job.scopeDurationDays ?? JOB_POST_INITIAL_DRAFT.scopeDurationDays,
    experienceLevel: job.experienceLevel ?? JOB_POST_INITIAL_DRAFT.experienceLevel,
    contractToHire: Boolean(job.contractToHire),
    budgetType: job.budgetType ?? JOB_POST_INITIAL_DRAFT.budgetType,
    budgetNotReadyConfirmed: job.budgetType === 'NOT_READY',
    budgetNotReadyType: job.budgetType === 'NOT_READY' ? 'HOURLY' : '',
    hourlyRateMin: job.hourlyRateMin == null ? '' : formatMoneyInputValue(job.hourlyRateMin),
    hourlyRateMax: job.hourlyRateMax == null ? '' : formatMoneyInputValue(job.hourlyRateMax),
    fixedBudget: job.fixedBudget == null ? '' : formatMoneyInputValue(job.fixedBudget),
    currencyCode: job.currencyCode ?? JOB_POST_INITIAL_DRAFT.currencyCode,
    paymentModel: job.paymentModel ?? JOB_POST_INITIAL_DRAFT.paymentModel,
    attachments: (job.attachments ?? []).map(getPersistedAttachmentDraft),
  };
};

const readUploadErrorMessage = async (response) => {
  try {
    const errorBody = await response.json();
    return errorBody.message || 'Attachment upload failed.';
  } catch {
    return 'Attachment upload failed.';
  }
};

const uploadJobAttachments = async (jobId, attachments) => {
  const token = localStorage.getItem('token');
  const uploadedAttachments = [];

  for (const attachment of attachments) {
    if (!attachment.file) {
      continue;
    }

    const formData = new FormData();
    formData.append('files', attachment.file);

    const response = await fetch(`http://localhost:8080/api/jobs/${jobId}/attachments`, {
      method: 'POST',
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readUploadErrorMessage(response));
    }

    const savedAttachments = await response.json();
    uploadedAttachments.push(...savedAttachments.map(getPersistedAttachmentDraft));
  }

  return uploadedAttachments;
};

const deleteJobAttachment = async (jobId, attachmentId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:8080/api/jobs/${jobId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!response.ok) {
    throw new Error(await readUploadErrorMessage(response));
  }
};

const PostJob = () => {
  const navigate = useNavigate();
  const { jobId: routeJobId } = useParams();
  const [searchParams] = useSearchParams();
  const hydratedJobIdRef = useRef(null);
  const draftJobIdRef = useRef(routeJobId ?? null);
  const savingDraftRef = useRef(false);
  const savedDraftRef = useRef(null);
  const savedDraftStepRef = useRef(null);
  const persistedAttachmentIdsRef = useRef(new Set());
  const isEditingPosting = Boolean(routeJobId && searchParams.get('mode') === 'edit-posting');
  const {
    data: taxonomyData,
    loading: taxonomyLoading,
    error: taxonomyError,
  } = useQuery(GET_SKILL_TAXONOMY);
  const {
    data: jobData,
    loading: loadingJob,
    error: jobLoadError,
  } = useQuery(GET_JOB, {
    variables: { id: routeJobId },
    skip: !routeJobId,
    fetchPolicy: 'network-only',
  });
  const [draft, setDraft] = useState(JOB_POST_INITIAL_DRAFT);
  const [draftJobId, setDraftJobId] = useState(routeJobId ?? null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [titleError, setTitleError] = useState('');
  const [skillSelectionError, setSkillSelectionError] = useState('');
  const [scopeError, setScopeError] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [draftSaveError, setDraftSaveError] = useState('');
  const [draftSaveSuccess, setDraftSaveSuccess] = useState('');
  const [savingDraftLocally, setSavingDraftLocally] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [publishJob, { loading: publishingJob }] = useMutation(PUBLISH_JOB);
  const [updateJob, { loading: updatingJob }] = useMutation(UPDATE_JOB);
  const [saveJobDraft, { loading: savingDraft }] = useMutation(SAVE_JOB_DRAFT);

  const activeStep = JOB_POST_STEPS[activeStepIndex];
  const isDraftSaveDisabled = !draft.title.trim();
  const isSavingDraft = savingDraft || savingDraftLocally || uploadingAttachments;
  const completedStepCount = getCompletedStepCount(draft);
  const progressValue = getStepProgressValue(activeStepIndex);
  const taxonomyNodes = taxonomyData?.skillTaxonomy ?? [];
  const descriptionDetailsError = isDescriptionErrorMessage(detailsError) ? detailsError : '';
  const attachmentDetailsError =
    detailsError && !isDescriptionErrorMessage(detailsError) ? detailsError : '';

  useEffect(() => {
    setDraftJobId(routeJobId ?? null);
    draftJobIdRef.current = routeJobId ?? null;
    savedDraftRef.current = null;
    savedDraftStepRef.current = null;
    hydratedJobIdRef.current = null;
    persistedAttachmentIdsRef.current = new Set();
  }, [routeJobId, isEditingPosting]);

  useEffect(() => {
    const loadedJob = jobData?.job;

    if (!loadedJob || hydratedJobIdRef.current === loadedJob.id) {
      return;
    }

    const loadedDraft = getDraftFromJob(loadedJob);
    const shouldOpenPostedEditor = isEditingPosting && loadedJob.status === 'OPEN';
    const loadedDraftStep = loadedJob.draftStep;
    const shouldOpenDraftReview =
      !isEditingPosting &&
      loadedJob.status === 'DRAFT' &&
      loadedDraftStep === JOB_DRAFT_STEPS.REVIEW;

    setDraft(loadedDraft);
    setDraftJobId(loadedJob.id);
    draftJobIdRef.current = loadedJob.id;
    savedDraftRef.current = loadedDraft;
    savedDraftStepRef.current = loadedDraft.draftStep;
    persistedAttachmentIdsRef.current = new Set(
      loadedDraft.attachments
        .filter((attachment) => attachment.persisted)
        .map((attachment) => attachment.id)
    );
    setActiveStepIndex(getDraftStepActiveStepIndex(loadedDraftStep, loadedDraft));
    setIsReviewing(shouldOpenPostedEditor || shouldOpenDraftReview);
    setTitleError('');
    setSkillSelectionError('');
    setScopeError('');
    setBudgetError('');
    setDetailsError('');
    setSubmitError('');
    setDraftSaveError('');
    setDraftSaveSuccess('');
    hydratedJobIdRef.current = loadedJob.id;
  }, [isEditingPosting, jobData]);

  const handleTitleChange = (event) => {
    const { value } = event.target;

    setDraft((currentDraft) => ({
      ...currentDraft,
      title: value,
    }));

    if (titleError && value.trim()) {
      setTitleError('');
    }
  };

  const handleDraftPatch = (updates) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...updates,
    }));
    setTitleError('');
    setSkillSelectionError('');
    setScopeError('');
    setBudgetError('');
    setDetailsError('');
    setSubmitError('');
    setDraftSaveError('');
    setDraftSaveSuccess('');
  };

  const handleDescriptionChange = (event) => {
    const { value } = event.target;

    setDraft((currentDraft) => ({
      ...currentDraft,
      description: value,
    }));

    if (
      detailsError &&
      isDescriptionErrorMessage(detailsError) &&
      !getDescriptionValidationError(value)
    ) {
      setDetailsError('');
    }
    setSubmitError('');
  };

  const handleDescriptionBlur = (event) => {
    setDetailsError(getDescriptionValidationError(event.target.value));
  };

  const handleAttachmentsAdd = (files) => {
    if (!files.length) {
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_JOB_ATTACHMENT_BYTES);

    if (oversizedFile) {
      setDetailsError(`${oversizedFile.name} is larger than 100MB.`);
      return;
    }

    const remainingSlots = MAX_JOB_ATTACHMENTS - (draft.attachments?.length ?? 0);

    if (remainingSlots < 1) {
      setDetailsError(`Attach no more than ${MAX_JOB_ATTACHMENTS} files.`);
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);

    setDraft((currentDraft) => ({
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
      setDetailsError(`Only ${MAX_JOB_ATTACHMENTS} files can be attached.`);
      return;
    }

    setDetailsError('');
    setSubmitError('');
  };

  const handleAttachmentRemove = async (attachmentId) => {
    const attachment = draft.attachments?.find((item) => item.id === attachmentId);

    if (attachment?.persisted && draftJobId) {
      try {
        await deleteJobAttachment(draftJobId, attachmentId);
      } catch (error) {
        setDetailsError(
          `Unable to remove ${getAttachmentDisplayName(attachment)}. ${error.message || 'Please try again.'}`
        );
        return;
      }
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      attachments: (currentDraft.attachments ?? []).filter(
        (attachment) => attachment.id !== attachmentId
      ),
    }));
    setDetailsError('');
    setSubmitError('');
    setDraftSaveError('');
  };

  const handleCategoryChange = (event) => {
    const { value } = event.currentTarget;

    setDraft((currentDraft) => ({
      ...currentDraft,
      categoryId: value,
      specialtyId: '',
    }));
    setSkillSelectionError('');
  };

  const handleSpecialtyChange = (event) => {
    const { value } = event.currentTarget;

    setDraft((currentDraft) => ({
      ...currentDraft,
      specialtyId: value,
    }));

    if (value) {
      setSkillSelectionError('');
    }
  };

  const handleBuiltInSkillRemove = (skillId) => {
    const normalizedSkillId = String(skillId);

    setDraft((currentDraft) => {
      const nextSkillNamesById = { ...(currentDraft.skillNamesById ?? {}) };
      delete nextSkillNamesById[normalizedSkillId];

      return {
        ...currentDraft,
        skillIds: (currentDraft.skillIds ?? []).filter(
          (currentSkillId) => String(currentSkillId) !== normalizedSkillId
        ),
        skillNamesById: nextSkillNamesById,
      };
    });
    setSkillSelectionError('');
    setSubmitError('');
    setDraftSaveError('');
    setDraftSaveSuccess('');
  };

  const handleCustomSkillsChange = (skillNames) => {
    const customSkillLimit = Math.max(0, MAX_JOB_SKILLS - (draft.skillIds?.length ?? 0));
    const customSkillNames = getNormalizedCustomSkillNames(skillNames, customSkillLimit);

    setDraft((currentDraft) => {
      const currentCustomSkillLimit = Math.max(
        0,
        MAX_JOB_SKILLS - (currentDraft.skillIds?.length ?? 0)
      );

      return {
        ...currentDraft,
        customSkillNames: getNormalizedCustomSkillNames(skillNames, currentCustomSkillLimit),
      };
    });

    if (
      skillSelectionError.toLowerCase().includes('skill') &&
      (draft.skillIds?.length ?? 0) + customSkillNames.length >= MIN_JOB_SKILLS
    ) {
      setSkillSelectionError('');
    }
  };

  const updateScopeDraft = (updates) => {
    setDraft((currentDraft) => {
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
    setScopeError('');
  };

  const handleScopeSizeChange = (value) => {
    updateScopeDraft({ scopeSize: value });
  };

  const handleDurationAmountChange = (value) => {
    updateScopeDraft({ scopeDurationAmount: getPositiveIntegerInputValue(value) });
  };

  const handleDurationUnitChange = (value) => {
    updateScopeDraft({ scopeDurationUnit: value });
  };

  const handleExperienceLevelChange = (value) => {
    updateScopeDraft({ experienceLevel: value });
  };

  const handleContractToHireChange = (checked) => {
    updateScopeDraft({ contractToHire: checked });
  };

  const handleBudgetTypeChange = (value) => {
    setDraft((currentDraft) => {
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
    setBudgetError('');
  };

  const handleBudgetAmountChange = (fieldName, value) => {
    setDraft((currentDraft) => {
      const nextBudgetType = fieldName === 'fixedBudget' ? 'FIXED' : 'HOURLY';

      return {
        ...currentDraft,
        budgetType: currentDraft.budgetType === 'NOT_READY' ? nextBudgetType : currentDraft.budgetType,
        budgetNotReadyConfirmed: false,
        budgetNotReadyType: '',
        [fieldName]: getMoneyInputValue(value),
      };
    });
    setBudgetError('');
  };

  const handleBudgetAmountBlur = (fieldName) => {
    const formattedValue = formatMoneyInputValue(draft[fieldName]);

    setDraft((currentDraft) => ({
      ...currentDraft,
      [fieldName]: formatMoneyInputValue(currentDraft[fieldName]),
    }));

    const nextDraft = {
      ...draft,
      [fieldName]: formattedValue,
    };

    setBudgetError(getBudgetValidationError(nextDraft));
  };

  const handleContinueWithoutBudget = (budgetType) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      budgetType: 'NOT_READY',
      budgetNotReadyConfirmed: true,
      budgetNotReadyType: budgetType,
      hourlyRateMin: '',
      hourlyRateMax: '',
      fixedBudget: '',
    }));
    setBudgetError('');

    if (activeStepIndex < JOB_POST_STEPS.length - 1) {
      setActiveStepIndex((currentStep) => currentStep + 1);
    }
  };

  const handleSubmitJob = async () => {
    const jobValidationError = getJobPostValidationError(draft);

    if (jobValidationError) {
      setSubmitError(jobValidationError);
      return;
    }

    setSubmitError('');

    try {
      const result = await publishJob({
        variables: {
          id: draftJobId,
          input: getCreateJobInput(draft),
        },
      });
      const createdJobId = result.data?.publishJob?.id;

      if (createdJobId && draft.attachments?.length) {
        setUploadingAttachments(true);
        await uploadJobAttachments(createdJobId, draft.attachments);
      }

      navigate('/dashboard');
    } catch (error) {
      setSubmitError(error.message || 'Unable to post this job. Please try again.');
    } finally {
      setUploadingAttachments(false);
    }
  };

  const syncPostedJobAttachments = async (jobId) => {
    const currentPersistedAttachmentIds = new Set(
      (draft.attachments ?? [])
        .filter((attachment) => attachment.persisted)
        .map((attachment) => attachment.id)
    );
    const removedAttachmentIds = [...persistedAttachmentIdsRef.current].filter(
      (attachmentId) => !currentPersistedAttachmentIds.has(attachmentId)
    );
    const localAttachments = (draft.attachments ?? []).filter((attachment) => attachment.file);

    if (!removedAttachmentIds.length && !localAttachments.length) {
      return;
    }

    setUploadingAttachments(true);

    for (const attachmentId of removedAttachmentIds) {
      await deleteJobAttachment(jobId, attachmentId);
    }

    if (localAttachments.length) {
      await uploadJobAttachments(jobId, localAttachments);
    }
  };

  const handleSavePosting = async () => {
    const jobValidationError = getJobPostValidationError(draft);

    if (jobValidationError) {
      setSubmitError(jobValidationError);
      return;
    }

    setSubmitError('');

    try {
      await updateJob({
        variables: {
          id: routeJobId,
          input: getCreateJobInput(draft),
        },
      });

      await syncPostedJobAttachments(routeJobId);
      navigate('/dashboard');
    } catch (error) {
      setSubmitError(error.message || 'Unable to save this posting. Please try again.');
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleSaveDraft = async () => {
    if (savingDraftRef.current) {
      return;
    }

    if (isDraftSaveDisabled) {
      setTitleError('Job title is required before saving a draft.');
      return;
    }

    savingDraftRef.current = true;
    setSavingDraftLocally(true);
    setDraftSaveError('');
    setDraftSaveSuccess('');
    setSubmitError('');

    try {
      const activeStepIsValid = isActiveDraftStepValidForSave(draft, activeStepIndex);
      const nextDraftStep = getDraftStepForSave(
        draft,
        activeStepIndex,
        savedDraftStepRef.current
      );
      const draftForSave = getDraftForSafeSave(
        draft,
        savedDraftRef.current,
        activeStepIndex,
        activeStepIsValid
      );
      const result = await saveJobDraft({
        variables: {
          id: draftJobIdRef.current,
          input: getSaveJobDraftInput(draftForSave, nextDraftStep),
        },
      });
      const savedJob = result.data?.saveJobDraft;
      const savedJobId = savedJob?.id;

      if (!savedJobId) {
        throw new Error('Unable to save this draft.');
      }

      setDraftJobId(savedJobId);
      draftJobIdRef.current = savedJobId;

      let savedDraftSnapshot = {
        ...(savedJob ? getDraftFromJob(savedJob) : draftForSave),
        draftStep: nextDraftStep,
      };
      let savedAttachments = savedDraftSnapshot.attachments ?? [];
      const localAttachments = (draftForSave.attachments ?? []).filter((attachment) => attachment.file);
      if (localAttachments.length) {
        setUploadingAttachments(true);
        const uploadedAttachments = await uploadJobAttachments(savedJobId, localAttachments);
        uploadedAttachments.forEach((attachment) => persistedAttachmentIdsRef.current.add(attachment.id));

        savedAttachments = [
          ...(draftForSave.attachments ?? []).filter((attachment) => !attachment.file),
          ...uploadedAttachments,
        ];
        savedDraftSnapshot = {
          ...savedDraftSnapshot,
          attachments: savedAttachments,
        };
      }

      savedDraftRef.current = savedDraftSnapshot;
      savedDraftStepRef.current = savedDraftSnapshot.draftStep ?? nextDraftStep;

      if (activeStepIsValid) {
        setDraft(savedDraftSnapshot);
      } else {
        setDraft((currentDraft) => ({
          ...currentDraft,
          draftStep: savedDraftStepRef.current,
          ...(localAttachments.length ? { attachments: savedAttachments } : {}),
        }));
      }

      if (!routeJobId) {
        window.history.replaceState(null, '', `/post-job/${savedJobId}`);
      }

      setDraftSaveSuccess('Draft saved. You can continue from your dashboard later.');
    } catch (error) {
      setDraftSaveError(error.message || 'Unable to save this draft. Please try again.');
    } finally {
      savingDraftRef.current = false;
      setSavingDraftLocally(false);
      setUploadingAttachments(false);
    }
  };

  const handleContinue = () => {
    if (activeStep.id === 'title' && !draft.title.trim()) {
      setTitleError('Job title is required before moving to the next step.');
      return;
    }

    if (activeStep.id === 'skills') {
      const selectedSkillCount = getSelectedSkillCount(draft);

      if (!draft.categoryId || !draft.specialtyId) {
        setSkillSelectionError('Select a category and specialty before moving to the next step.');
        return;
      }

      if (selectedSkillCount < MIN_JOB_SKILLS) {
        setSkillSelectionError('Add at least one skill before moving to the next step.');
        return;
      }

      if (selectedSkillCount > MAX_JOB_SKILLS) {
        setSkillSelectionError(`Add no more than ${MAX_JOB_SKILLS} skills.`);
        return;
      }
    }

    if (activeStep.id === 'scope' && !isScopeStepComplete(draft)) {
      if (!draft.scopeSize) {
        setScopeError('Choose a scope size before moving to the next step.');
        return;
      }

      if (getScopeDurationDays(draft.scopeDurationAmount, draft.scopeDurationUnit) < 1) {
        setScopeError('Enter a positive whole number for the duration.');
        return;
      }

      if (!draft.experienceLevel) {
        setScopeError('Choose an experience level before moving to the next step.');
        return;
      }

      setScopeError('Complete the scope details before moving to the next step.');
      return;
    }

    if (activeStep.id === 'budget') {
      const budgetValidationError = getBudgetValidationError(draft);

      if (budgetValidationError) {
        setBudgetError(budgetValidationError);
        return;
      }
    }

    if (activeStep.id === 'details') {
      const detailsValidationError = getDetailsValidationError(draft);

      if (detailsValidationError) {
        setDetailsError(detailsValidationError);
        return;
      }

      setSubmitError('');
      setIsReviewing(true);
      return;
    }

    if (activeStepIndex < JOB_POST_STEPS.length - 1) {
      setActiveStepIndex((currentStep) => currentStep + 1);
    }
  };

  const handleBack = () => {
    if (isReviewing) {
      setIsReviewing(false);
      setSubmitError('');
      return;
    }

    if (activeStepIndex > 0) {
      setActiveStepIndex((currentStep) => currentStep - 1);
    }
  };

  const routeJobStatus = jobData?.job?.status;
  const routeJobCannotOpen =
    routeJobId && routeJobStatus && (isEditingPosting ? routeJobStatus !== 'OPEN' : routeJobStatus !== 'DRAFT');
  const routeJobErrorTitle = isEditingPosting ? 'Unable to edit this posting' : 'Unable to open this draft';
  const routeJobErrorMessage = isEditingPosting
    ? 'Only open posted jobs can be edited from this view.'
    : 'Only draft jobs can be resumed in the posting flow.';
  const reviewActionLoading = isEditingPosting
    ? updatingJob || uploadingAttachments
    : publishingJob || uploadingAttachments;
  const reviewActionLabel = reviewActionLoading
    ? (isEditingPosting ? 'Saving...' : 'Posting...')
    : (isEditingPosting ? 'Save changes' : 'Post job');

  if (loadingJob) {
    return (
      <PageShell accents={pageAccents} maxW="720px" py={{ base: 8, md: 12 }} bg="rgba(2, 6, 23, 1)">
        <VStack align="stretch" gap={4} pt={{ base: '64px', md: '88px' }}>
          <Heading color="white" size="lg">
            {isEditingPosting ? 'Loading posting' : 'Loading draft'}
          </Heading>
          <Text color="rgba(226, 232, 240, 0.68)">
            {isEditingPosting
              ? 'We are pulling your posted job into the editor.'
              : 'We are pulling your saved job draft into the editor.'}
          </Text>
        </VStack>
      </PageShell>
    );
  }

  if (
    jobLoadError ||
    (routeJobId && jobData && !jobData.job) ||
    routeJobCannotOpen
  ) {
    return (
      <PageShell accents={pageAccents} maxW="720px" py={{ base: 8, md: 12 }} bg="rgba(2, 6, 23, 1)">
        <VStack align="stretch" gap={5} pt={{ base: '64px', md: '88px' }}>
          <Heading color="white" size="lg">
            {routeJobErrorTitle}
          </Heading>
          <Text color="rgba(226, 232, 240, 0.68)">
            {jobLoadError?.message || routeJobErrorMessage}
          </Text>
          <Button
            type="button"
            alignSelf="start"
            borderRadius="full"
            colorPalette="green"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </Button>
        </VStack>
      </PageShell>
    );
  }

  return (
    <PageShell
      accents={pageAccents}
      maxW={isReviewing ? '1040px' : '1380px'}
      py={{ base: 6, md: 8 }}
      px={{ base: 4, md: 8 }}
      pb={isReviewing ? { base: 8, md: 12 } : { base: '210px', md: '190px' }}
      bg="rgba(2, 6, 23, 1)"
      h={{ base: 'auto', lg: isReviewing ? 'auto' : '100vh' }}
      minH="100vh"
      overflow={{ base: 'auto', lg: isReviewing ? 'auto' : 'hidden' }}
    >
      {isReviewing ? (
        <VStack align="stretch" gap={{ base: 6, md: 8 }} pt={{ base: '48px', md: '68px' }}>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'end' }}
            justify="space-between"
            gap={5}
          >
            <Box>
              <Text color="rgba(226, 232, 240, 0.58)" fontSize="sm" fontWeight="medium" mb={3}>
                Job Post
              </Text>
              <Heading as="h1" size={{ base: '3xl', md: '4xl' }} color="white" letterSpacing="0">
                {isEditingPosting ? 'Edit job posting' : 'Review your job post'}
              </Heading>
              <Text color="rgba(226, 232, 240, 0.7)" fontSize="sm" mt={3} maxW="44rem">
                {isEditingPosting
                  ? 'Update the live posting details candidates see, then save your changes.'
                  : 'Make final edits to the details candidates will see before publishing.'}
              </Text>
            </Box>

            <HStack gap={3} justify={{ base: 'stretch', md: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
                borderColor="rgba(148, 163, 184, 0.28)"
                color="white"
                flex={{ base: '1', md: '0 0 auto' }}
                onClick={isEditingPosting ? () => navigate('/dashboard') : handleBack}
                _hover={{
                  bg: 'rgba(148, 163, 184, 0.1)',
                  borderColor: 'rgba(226, 232, 240, 0.44)',
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                bgGradient="to-r"
                gradientFrom="green.300"
                gradientTo="cyan.400"
                color="gray.950"
                fontWeight="bold"
                borderRadius="full"
                px={6}
                flex={{ base: '1', md: '0 0 auto' }}
                onClick={isEditingPosting ? handleSavePosting : handleSubmitJob}
                disabled={reviewActionLoading}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 18px 34px rgba(74, 222, 128, 0.24)',
                }}
                _active={{ transform: 'translateY(0)' }}
              >
                {reviewActionLabel}
              </Button>
            </HStack>
          </Stack>

          <StepReview
            draft={draft}
            submitError={submitError}
            onDraftPatch={handleDraftPatch}
            taxonomyNodes={taxonomyNodes}
            taxonomyLoading={taxonomyLoading}
            taxonomyError={taxonomyError}
            mode={isEditingPosting ? 'edit-posting' : 'publish'}
          />
        </VStack>
      ) : (
        <>
          <Grid
            templateColumns={{ base: '1fr', lg: 'minmax(0, 0.95fr) minmax(0, 1.05fr)' }}
            gap={{ base: 8, lg: 10 }}
            alignItems="start"
            alignContent="start"
            h={{ base: 'auto', lg: 'calc(100vh - 292px)' }}
            minH={{ base: 'auto', lg: '420px' }}
            overflow={{ base: 'visible', lg: 'hidden' }}
            pt={{ base: '68px', md: '82px' }}
          >
            <StepInfoColumn activeStep={activeStep} stepIndex={activeStepIndex} />

            <VStack
              align="stretch"
              maxH={{ base: 'none', lg: '100%' }}
              overflowY="visible"
              pr={{ base: 0, lg: 3 }}
              pb={{ base: 4, lg: 8 }}
            >
              <StepContent
                activeStepId={activeStep.id}
                draft={draft}
                titleError={titleError}
                skillSelectionError={skillSelectionError}
                scopeError={scopeError}
                budgetError={budgetError}
                descriptionError={descriptionDetailsError}
                attachmentError={attachmentDetailsError}
                submitError={submitError}
                onTitleChange={handleTitleChange}
                onDescriptionChange={handleDescriptionChange}
                onDescriptionBlur={handleDescriptionBlur}
                onAttachmentsAdd={handleAttachmentsAdd}
                onAttachmentRemove={handleAttachmentRemove}
                onCategoryChange={handleCategoryChange}
                onSpecialtyChange={handleSpecialtyChange}
                onBuiltInSkillRemove={handleBuiltInSkillRemove}
                onCustomSkillsChange={handleCustomSkillsChange}
                onScopeSizeChange={handleScopeSizeChange}
                onDurationAmountChange={handleDurationAmountChange}
                onDurationUnitChange={handleDurationUnitChange}
                onExperienceLevelChange={handleExperienceLevelChange}
                onContractToHireChange={handleContractToHireChange}
                onBudgetTypeChange={handleBudgetTypeChange}
                onBudgetAmountChange={handleBudgetAmountChange}
                onBudgetAmountBlur={handleBudgetAmountBlur}
                onContinueWithoutBudget={handleContinueWithoutBudget}
                taxonomyNodes={taxonomyNodes}
                taxonomyLoading={taxonomyLoading}
                taxonomyError={taxonomyError}
              />
            </VStack>
          </Grid>

          <JobPostFooter
            activeStep={activeStep}
            activeStepIndex={activeStepIndex}
            completedStepCount={completedStepCount}
            progressValue={progressValue}
            onBack={handleBack}
            onContinue={handleContinue}
            onExit={() => navigate('/dashboard')}
            onSaveDraft={handleSaveDraft}
            taxonomyLoading={taxonomyLoading}
            isSubmitting={publishingJob || uploadingAttachments}
            isSavingDraft={isSavingDraft}
            saveDraftDisabled={isDraftSaveDisabled}
            draftSaveError={draftSaveError}
            draftSaveSuccess={draftSaveSuccess}
          />
        </>
      )}
    </PageShell>
  );
};

export default PostJob;
