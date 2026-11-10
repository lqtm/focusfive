import type { Category } from '../domain/models';

export function CategoryChip({ category }: { category?: Category }) {
  if (!category) return null;
  return <span className="chip">{category.name}</span>;
}
