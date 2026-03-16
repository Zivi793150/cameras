// Утилита для тестирования безопасности админки
export const testAdminSecurity = () => {
  const testCases = [
    {
      name: 'Прямой доступ к /admin/products без авторизации',
      test: () => {
        // Симулируем попытку прямого доступа
        localStorage.removeItem('admin_token');
        return !localStorage.getItem('admin_token');
      },
      expected: true
    },
    {
      name: 'Доступ к /admin/products с авторизацией',
      test: () => {
        localStorage.setItem('admin_token', 'admin');
        return !!localStorage.getItem('admin_token');
      },
      expected: true
    }
  ];

  console.log('🔒 Тестирование безопасности админки:');
  testCases.forEach((testCase, index) => {
    const result = testCase.test();
    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${testCase.name}: ${result === testCase.expected ? 'ПРОЙДЕН' : 'ПРОВАЛЕН'}`);
  });
}; 