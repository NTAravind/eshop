import  prisma   from '@/lib/prisma';

export async function createFacet(
  storeId: string,
  data: {
    name: string;
    code: string;
  }
) {
  return prisma.facet.create({
    data: {
      storeId,
      name: data.name,
      code: data.code,
    },
    include: {
      values: true,
    },
  });
}

export async function createFacetValue(
  storeId: string,
  facetId: string,
  value: string
) {
  // Verify facet belongs to store
  const facet = await prisma.facet.findFirst({
    where: { id: facetId, storeId },
  });

  if (!facet) {
    throw new Error('Facet not found in this store');
  }

  return prisma.facetValue.create({
    data: {
      facetId,
      value,
    },
    include: {
      facet: true,
    },
  });
}

export async function listFacets(storeId: string) {
  return prisma.facet.findMany({
    where: { storeId },
    include: {
      values: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getFacetById(storeId: string, facetId: string) {
  return prisma.facet.findFirst({
    where: {
      id: facetId,
      storeId,
    },
    include: {
      values: true,
    },
  });
}

export async function assignFacetValueToProduct(
  storeId: string,
  productId: string,
  facetValueId: string
) {
  // Verify product belongs to store
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Verify facet value belongs to store (via facet)
  const facetValue = await prisma.facetValue.findFirst({
    where: {
      id: facetValueId,
      facet: {
        storeId,
      },
    },
  });

  if (!facetValue) {
    throw new Error('Facet value not found in this store');
  }

  return prisma.productFacetValue.create({
    data: {
      productId,
      facetValueId,
    },
  });
}

export async function assignFacetValueToVariant(
  storeId: string,
  variantId: string,
  facetValueId: string
) {
  // Verify variant belongs to store
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      product: {
        storeId,
      },
    },
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  // Verify facet value belongs to store
  const facetValue = await prisma.facetValue.findFirst({
    where: {
      id: facetValueId,
      facet: {
        storeId,
      },
    },
  });

  if (!facetValue) {
    throw new Error('Facet value not found in this store');
  }

  return prisma.variantFacetValue.create({
    data: {
      variantId,
      facetValueId,
    },
  });
}

export async function deleteFacet(storeId: string, facetId: string) {
  // Verify facet belongs to store
  const facet = await prisma.facet.findFirst({
    where: { id: facetId, storeId },
  });

  if (!facet) {
    throw new Error('Facet not found');
  }

  return prisma.facet.delete({
    where: { id: facetId },
  });
}

export async function deleteFacetValue(
  storeId: string,
  facetValueId: string
) {
  // Verify facet value belongs to store
  const facetValue = await prisma.facetValue.findFirst({
    where: {
      id: facetValueId,
      facet: {
        storeId,
      },
    },
  });

  if (!facetValue) {
    throw new Error('Facet value not found');
  }

  return prisma.facetValue.delete({
    where: { id: facetValueId },
  });
}