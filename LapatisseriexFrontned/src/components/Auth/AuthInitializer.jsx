// Legacy AuthInitializer no longer required: AuthContextRedux now owns
// Firebase auth state subscription and local storage initialization.
// We keep this component as a harmless passthrough to avoid refactoring
// import sites immediately. Safe to delete once usages are removed.

const AuthInitializer = ({ children }) => children || null;

export default AuthInitializer;