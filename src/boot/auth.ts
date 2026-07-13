import { defineBoot } from '#q-app/wrappers';
import { useAuthStore } from 'src/stores/auth-store';

// Restore any persisted session and start listening for auth changes
// before the app renders, so the header shows the right state on load.
export default defineBoot(({ store }) => {
  const auth = useAuthStore(store);
  void auth.init();
});
