-- One-off update for the EXISTING database (run after schema.sql). Safe to re-run.
-- Each row is matched on id AND slug, so products you renamed or re-created are left alone.
-- The product with slug 'aaa' (looks like a test entry) is not touched.

begin;

-- 1. Frame shapes: enables the virtual try-on and the face-shape filter.
update public.products set frame_shape = 'aviator' where id = '1' and slug = 'ray-ban-aviateur-classique';
update public.products set frame_shape = 'cat_eye' where id = '2' and slug = 'lunettes-soleil-cat-eye-femme';
update public.products set frame_shape = 'rectangle' where id = '3' and slug = 'lunettes-soleil-homme-sport';
update public.products set frame_shape = 'round' where id = '4' and slug = 'lunettes-soleil-polarisees-premium';
update public.products set frame_shape = 'round' where id = '5' and slug = 'lunettes-optiques-classiques';
update public.products set frame_shape = 'browline' where id = '6' and slug = 'lunettes-anti-lumiere-bleue';
update public.products set frame_shape = null where id = '7' and slug = 'lentilles-contact-mensuelles';
update public.products set frame_shape = 'cat_eye' where id = '8' and slug = 'lunettes-soleil-luxe-femme';
update public.products set frame_shape = 'square' where id = '9' and slug = 'lunettes-optiques-homme-moderne';
update public.products set frame_shape = null where id = '10' and slug = 'lentilles-colorees';

-- 2. Replace broken (HTTP 404) or wrong photos (e.g. product 3 showed an armchair).
update public.products set image = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', gallery = array['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', 'https://images.unsplash.com/photo-1584036553516-bf83210aa16c?w=800&q=80'] where id = '2' and slug = 'lunettes-soleil-cat-eye-femme';
update public.products set image = 'https://images.unsplash.com/photo-1584036553516-bf83210aa16c?w=800&q=80', gallery = array['https://images.unsplash.com/photo-1584036553516-bf83210aa16c?w=800&q=80', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80'] where id = '3' and slug = 'lunettes-soleil-homme-sport';
update public.products set image = 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=800&q=80', gallery = array['https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=800&q=80'] where id = '7' and slug = 'lentilles-contact-mensuelles';
update public.products set image = 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80', gallery = array['https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80', 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80'] where id = '8' and slug = 'lunettes-soleil-luxe-femme';
update public.products set image = 'https://images.unsplash.com/photo-1603578119639-798b8413d8d7?w=800&q=80', gallery = array['https://images.unsplash.com/photo-1603578119639-798b8413d8d7?w=800&q=80', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80'] where id = '9' and slug = 'lunettes-optiques-homme-moderne';
update public.products set image = 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=800&q=80', gallery = array['https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=800&q=80'] where id = '10' and slug = 'lentilles-colorees';

commit;
