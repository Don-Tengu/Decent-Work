const CATEGORY_LEVEL = 'CATEGORY';
const SUBCATEGORY_LEVEL = 'SUBCATEGORY';
const SPECIALTY_LEVEL = 'SPECIALTY';

const normalizeId = (value) => String(value ?? '');

const compareTaxonomyNodes = (firstNode, secondNode) => {
  const orderDelta = (firstNode.displayOrder ?? 0) - (secondNode.displayOrder ?? 0);

  if (orderDelta !== 0) {
    return orderDelta;
  }

  return firstNode.name.localeCompare(secondNode.name);
};

const sortTaxonomyNodes = (nodes) => [...nodes].sort(compareTaxonomyNodes);

const normalizeSearch = (value = '') => value.trim().toLowerCase();

export const buildCategoryFilterGroups = (taxonomyNodes = []) => {
  const subcategories = new Map();

  taxonomyNodes
    .filter((node) => node.level === SUBCATEGORY_LEVEL)
    .forEach((node) => {
      subcategories.set(normalizeId(node.id), {
        categoryId: normalizeId(node.parent?.id),
        name: node.name,
        displayOrder: node.displayOrder ?? 0,
      });
    });

  const specialtiesByCategoryId = taxonomyNodes
    .filter((node) => node.level === SPECIALTY_LEVEL)
    .reduce((groups, node) => {
      const subcategory = subcategories.get(normalizeId(node.parent?.id));
      const categoryId = subcategory?.categoryId;

      if (!categoryId) {
        return groups;
      }

      const specialties = groups.get(categoryId) ?? [];
      specialties.push({
        id: normalizeId(node.id),
        name: node.name,
        displayOrder: node.displayOrder ?? 0,
        subcategoryName: subcategory.name,
        subcategoryDisplayOrder: subcategory.displayOrder,
      });
      groups.set(categoryId, specialties);
      return groups;
    }, new Map());

  return sortTaxonomyNodes(taxonomyNodes.filter((node) => node.level === CATEGORY_LEVEL))
    .map((category) => {
      const categoryId = normalizeId(category.id);
      const specialties = (specialtiesByCategoryId.get(categoryId) ?? []).sort((firstNode, secondNode) => {
        const subcategoryOrderDelta = firstNode.subcategoryDisplayOrder - secondNode.subcategoryDisplayOrder;

        if (subcategoryOrderDelta !== 0) {
          return subcategoryOrderDelta;
        }

        return compareTaxonomyNodes(firstNode, secondNode);
      });

      return {
        id: categoryId,
        name: category.name,
        displayOrder: category.displayOrder ?? 0,
        specialties,
      };
    });
};

export const filterCategoryGroups = (groups, searchValue) => {
  const query = normalizeSearch(searchValue);

  if (!query) {
    return groups.map((group) => ({ ...group, showAllOption: true }));
  }

  return groups
    .map((group) => {
      const categoryMatches = normalizeSearch(group.name).includes(query);
      const specialties = categoryMatches
        ? group.specialties
        : group.specialties.filter((specialty) => normalizeSearch(specialty.name).includes(query));

      return {
        ...group,
        specialties,
        showAllOption: categoryMatches,
      };
    })
    .filter((group) => group.showAllOption || group.specialties.length > 0);
};

export const toggleCategorySelection = ({
  selectedCategoryIds,
  selectedSpecialtyIds,
  categoryId,
  specialtyIds,
  checked,
}) => {
  const nextCategoryIds = new Set(selectedCategoryIds.map(normalizeId));
  const nextSpecialtyIds = new Set(selectedSpecialtyIds.map(normalizeId));

  if (checked) {
    nextCategoryIds.add(normalizeId(categoryId));
    specialtyIds.map(normalizeId).forEach((specialtyId) => nextSpecialtyIds.delete(specialtyId));
  } else {
    nextCategoryIds.delete(normalizeId(categoryId));
  }

  return {
    categoryIds: [...nextCategoryIds],
    specialtyIds: [...nextSpecialtyIds],
  };
};

export const toggleSpecialtySelection = ({
  selectedCategoryIds,
  selectedSpecialtyIds,
  categoryId,
  specialtyId,
  checked,
}) => {
  const nextCategoryIds = new Set(selectedCategoryIds.map(normalizeId));
  const nextSpecialtyIds = new Set(selectedSpecialtyIds.map(normalizeId));

  nextCategoryIds.delete(normalizeId(categoryId));

  if (checked) {
    nextSpecialtyIds.add(normalizeId(specialtyId));
  } else {
    nextSpecialtyIds.delete(normalizeId(specialtyId));
  }

  return {
    categoryIds: [...nextCategoryIds],
    specialtyIds: [...nextSpecialtyIds],
  };
};

export const getCategoryFilterLabel = (groups, selectedCategoryIds, selectedSpecialtyIds) => {
  const categoryLabels = new Map(groups.map((group) => [normalizeId(group.id), group.name]));
  const specialtyLabels = new Map(
    groups.flatMap((group) => group.specialties.map((specialty) => [normalizeId(specialty.id), specialty.name]))
  );
  const labels = [
    ...selectedCategoryIds.map((categoryId) => categoryLabels.get(normalizeId(categoryId))).filter(Boolean),
    ...selectedSpecialtyIds.map((specialtyId) => specialtyLabels.get(normalizeId(specialtyId))).filter(Boolean),
  ];

  if (!labels.length) {
    return 'All categories';
  }

  return labels.join(', ');
};
