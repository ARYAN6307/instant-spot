
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_provider_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.book_slot(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_slot(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
