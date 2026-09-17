-- Lets a custom recipe book carry an optional emoji for quick visual
-- recognition in the books list (name-only rows are hard to scan once a
-- household has more than a couple of books).
alter table public.recipe_books
  add column if not exists emoji text null;
