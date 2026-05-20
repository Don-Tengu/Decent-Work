import React from 'react';
import FutureStepPlaceholder from './FutureStepPlaceholder.jsx';
import StepOne from './StepOne.jsx';
import StepFour from './StepFour.jsx';
import StepFive from './StepFive.jsx';
import StepThree from './StepThree.jsx';
import StepTwo from './StepTwo.jsx';

const StepContent = ({
  activeStepId,
  draft,
  titleError,
  skillSelectionError,
  scopeError,
  budgetError,
  descriptionError,
  attachmentError,
  submitError,
  onTitleChange,
  onDescriptionChange,
  onDescriptionBlur,
  onAttachmentsAdd,
  onAttachmentRemove,
  onCategoryChange,
  onSpecialtyChange,
  onBuiltInSkillRemove,
  onCustomSkillsChange,
  onScopeSizeChange,
  onDurationAmountChange,
  onDurationUnitChange,
  onExperienceLevelChange,
  onContractToHireChange,
  onBudgetTypeChange,
  onBudgetAmountChange,
  onBudgetAmountBlur,
  onContinueWithoutBudget,
  taxonomyNodes,
  taxonomyLoading,
  taxonomyError,
}) => {
  if (activeStepId === 'title') {
    return <StepOne draft={draft} error={titleError} onChange={onTitleChange} />;
  }

  if (activeStepId === 'skills') {
    return (
      <StepTwo
        draft={draft}
        selectionError={skillSelectionError}
        onCategoryChange={onCategoryChange}
        onSpecialtyChange={onSpecialtyChange}
        onBuiltInSkillRemove={onBuiltInSkillRemove}
        onCustomSkillsChange={onCustomSkillsChange}
        taxonomyNodes={taxonomyNodes}
        taxonomyLoading={taxonomyLoading}
        taxonomyError={taxonomyError}
      />
    );
  }

  if (activeStepId === 'scope') {
    return (
      <StepThree
        draft={draft}
        error={scopeError}
        onScopeSizeChange={onScopeSizeChange}
        onDurationAmountChange={onDurationAmountChange}
        onDurationUnitChange={onDurationUnitChange}
        onExperienceLevelChange={onExperienceLevelChange}
        onContractToHireChange={onContractToHireChange}
      />
    );
  }

  if (activeStepId === 'budget') {
    return (
      <StepFour
        draft={draft}
        error={budgetError}
        onBudgetTypeChange={onBudgetTypeChange}
        onBudgetAmountChange={onBudgetAmountChange}
        onBudgetAmountBlur={onBudgetAmountBlur}
        onContinueWithoutBudget={onContinueWithoutBudget}
      />
    );
  }

  if (activeStepId === 'details') {
    return (
      <StepFive
        draft={draft}
        descriptionError={descriptionError}
        attachmentError={attachmentError}
        submitError={submitError}
        onDescriptionChange={onDescriptionChange}
        onDescriptionBlur={onDescriptionBlur}
        onAttachmentsAdd={onAttachmentsAdd}
        onAttachmentRemove={onAttachmentRemove}
      />
    );
  }

  return <FutureStepPlaceholder stepId={activeStepId} />;
};

export default StepContent;
