-- Add image support to feed_posts (up to 2 photos)
alter table feed_posts
  add column if not exists image_urls text[] default '{}';
