try {
  require('./flStudio.helpers.test.js');
  require('./timelineUtils.test.js');
  console.log('✅ All tests executed successfully');
} catch (error) {
  console.error('❌ Test suite encountered an error');
  console.error(error);
  process.exitCode = 1;
}
