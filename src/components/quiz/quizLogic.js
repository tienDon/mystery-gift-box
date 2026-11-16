export function toggleOption(selectedIds, optionId, type) {
  if (type === 'single') return [optionId];
  return selectedIds.includes(optionId)
    ? selectedIds.filter(id => id !== optionId)
    : [...selectedIds, optionId];
}

export function isAnswerCorrect(selectedIds, correctIds) {
  return selectedIds.length === correctIds.length
    && correctIds.every(id => selectedIds.includes(id));
}
