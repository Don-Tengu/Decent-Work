const CATEGORY_LEVEL = 'CATEGORY';
const SUBCATEGORY_LEVEL = 'SUBCATEGORY';
const SPECIALTY_LEVEL = 'SPECIALTY';

const compareTaxonomyNodes = (firstNode, secondNode) => {
  const orderDelta = (firstNode.displayOrder ?? 0) - (secondNode.displayOrder ?? 0);

  if (orderDelta !== 0) {
    return orderDelta;
  }

  return firstNode.name.localeCompare(secondNode.name);
};

const sortTaxonomyNodes = (nodes) => [...nodes].sort(compareTaxonomyNodes);

export const buildTaxonomyGroups = (taxonomyNodes) => {
  const subcategories = new Map();

  taxonomyNodes
    .filter((node) => node.level === SUBCATEGORY_LEVEL)
    .forEach((node) => {
      subcategories.set(String(node.id), {
        categoryId: String(node.parent?.id ?? ''),
        name: node.name,
        displayOrder: node.displayOrder ?? 0,
      });
    });

  const categories = sortTaxonomyNodes(
    taxonomyNodes.filter((node) => node.level === CATEGORY_LEVEL)
  );
  const specialtiesByCategoryId = taxonomyNodes
    .filter((node) => node.level === SPECIALTY_LEVEL)
    .reduce((groups, node) => {
      const subcategoryId = String(node.parent?.id ?? '');
      const subcategory = subcategories.get(subcategoryId);
      const categoryId = subcategory?.categoryId;

      if (!categoryId) {
        return groups;
      }

      const categorySpecialties = groups.get(categoryId) ?? [];
      categorySpecialties.push({
        ...node,
        subcategoryName: subcategory.name,
        subcategoryDisplayOrder: subcategory.displayOrder,
      });
      groups.set(categoryId, categorySpecialties);
      return groups;
    }, new Map());

  specialtiesByCategoryId.forEach((specialties, categoryId) => {
    specialtiesByCategoryId.set(
      categoryId,
      specialties.sort((firstNode, secondNode) => {
        const subcategoryOrderDelta =
          firstNode.subcategoryDisplayOrder - secondNode.subcategoryDisplayOrder;

        if (subcategoryOrderDelta !== 0) {
          return subcategoryOrderDelta;
        }

        return compareTaxonomyNodes(firstNode, secondNode);
      })
    );
  });

  return { categories, specialtiesByCategoryId };
};
