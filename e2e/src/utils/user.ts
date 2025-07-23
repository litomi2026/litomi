export function generateTestUser() {
  return {
    loginId: `test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    password: 'TestPassword123!',
    nickname: `TestUser_${Date.now()}`,
  }
}
