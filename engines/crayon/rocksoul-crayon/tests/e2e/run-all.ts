import { runDomainApiTests } from './01-domain-api.test.js';
import { runMetadataTests } from './02-metadata-security.test.js';
import { runUiRuntimeTests } from './03-ui-runtime.test.js';
import { runAiEngineTests } from './04-ai-engine.test.js';
import { runOperationalOrmTests } from './05-operational-orm.test.js';

async function runMasterSuite() {
  const start = Date.now();
  console.log('\n========================================================================');
  console.log('🚀 ROCKSOUL FULL-STACK END-TO-END MASTER VERIFICATION SUITE');
  console.log('========================================================================\n');

  try {
    await runDomainApiTests();
    await runMetadataTests();
    await runUiRuntimeTests();
    await runAiEngineTests();
    await runOperationalOrmTests();

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log('\n========================================================================');
    console.log(`🎉 ALL 5 TEST SUITES PASSED CLEANLY (Total Time: ${duration}s)`);
    console.log('========================================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ MASTER SUITE FAILED:', error.message);
    process.exit(1);
  }
}

runMasterSuite();
