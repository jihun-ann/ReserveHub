export function useAuthStore() {
  // Simple in-memory store placeholder.
  const state = {
    role: "USER",
    email: "guest@reservehub.test",
  };

  return {
    state,
    setRole(role) {
      state.role = role;
    },
  };
}
