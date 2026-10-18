// Route tests render lazy pages. A cold dynamic import costs up to ~1 s (the dashboard pulls in
// recharts) and would otherwise run inside a test or leak into the next one under a busy suite.
// Loading the modules once per file moves that cost out of the test timeouts.
export async function preloadPages(): Promise<void> {
  await Promise.all([
    import('../features/auth/views/LoginPage'),
    import('../features/dashboard/views/DashboardPage'),
    import('../features/products/views/InventoryPage'),
    import('../features/users/views/UsersPage'),
    import('../shared/pages/NotFoundPage'),
  ]);
}
