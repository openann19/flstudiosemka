/**
 * Tests for Premium Autotune Features
 * Tests premium service, live recording, and feature access control
 */

(function() {
  'use strict';

  // Mock premium service for testing
  class MockPremiumService {
    constructor() {
      this.active = false;
      this.listeners = new Set();
      this.features = {};
    }

    isPremiumActive() {
      return this.active;
    }

    activatePremium(options = {}) {
      this.active = true;
      this.features = {
        liveRecording: true,
        advancedAutotune: true,
        multipleFormats: true,
        enhancedWaveform: true,
        ...options.features
      };
      this._emitChange();
      return true;
    }

    deactivatePremium() {
      this.active = false;
      this.features = {};
      this._emitChange();
      return true;
    }

    hasFeature(featureName) {
      return this.active && this.features[featureName] === true;
    }

    onStateChange(callback) {
      this.listeners.add(callback);
      callback({ active: this.active, features: this.features });
      return () => this.listeners.delete(callback);
    }

    _emitChange() {
      this.listeners.forEach((listener) => {
        try {
          listener({ active: this.active, features: this.features });
        } catch (error) {
          console.error('MockPremiumService listener error:', error);
        }
      });
    }
  }

  // Test suite
  const tests = {
    premiumService: {
      name: 'Premium Service Tests',
      tests: [
        {
          name: 'should activate premium',
          run: () => {
            const service = new MockPremiumService();
            service.activatePremium();
            return service.isPremiumActive() === true;
          }
        },
        {
          name: 'should deactivate premium',
          run: () => {
            const service = new MockPremiumService();
            service.activatePremium();
            service.deactivatePremium();
            return service.isPremiumActive() === false;
          }
        },
        {
          name: 'should check feature access',
          run: () => {
            const service = new MockPremiumService();
            service.activatePremium();
            return service.hasFeature('liveRecording') === true &&
                   service.hasFeature('nonexistent') === false;
          }
        },
        {
          name: 'should emit state changes',
          run: () => {
            const service = new MockPremiumService();
            let receivedState = null;
            service.onStateChange((state) => {
              receivedState = state;
            });
            service.activatePremium();
            return receivedState !== null && receivedState.active === true;
          }
        }
      ]
    },
    liveRecording: {
      name: 'Live Recording Tests',
      tests: [
        {
          name: 'should detect premium for live recording',
          run: () => {
            const service = new MockPremiumService();
            service.activatePremium();
            return service.hasFeature('liveRecording') === true;
          }
        },
        {
          name: 'should require premium for live recording',
          run: () => {
            const service = new MockPremiumService();
            return service.hasFeature('liveRecording') === false;
          }
        }
      ]
    },
    featureGating: {
      name: 'Feature Gating Tests',
      tests: [
        {
          name: 'should gate advanced autotune features',
          run: () => {
            const service = new MockPremiumService();
            const hasAdvanced = service.hasFeature('advancedAutotune');
            service.activatePremium();
            const hasAdvancedAfter = service.hasFeature('advancedAutotune');
            return hasAdvanced === false && hasAdvancedAfter === true;
          }
        },
        {
          name: 'should gate export formats',
          run: () => {
            const service = new MockPremiumService();
            const hasFormats = service.hasFeature('multipleFormats');
            service.activatePremium();
            const hasFormatsAfter = service.hasFeature('multipleFormats');
            return hasFormats === false && hasFormatsAfter === true;
          }
        }
      ]
    }
  };

  // Test runner
  function runTests() {
    console.log('%c=== Premium Autotune Tests ===', 'color: #FFD700; font-weight: bold; font-size: 16px');
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    Object.keys(tests).forEach((suiteKey) => {
      const suite = tests[suiteKey];
      console.log(`\n%c${suite.name}`, 'color: #FF0080; font-weight: bold; font-size: 14px');

      suite.tests.forEach((test) => {
        totalTests += 1;
        try {
          const result = test.run();
          if (result) {
            passedTests += 1;
            console.log(`  ✅ ${test.name}`, 'color: #00FF00');
          } else {
            failedTests += 1;
            console.log(`  ❌ ${test.name}`, 'color: #FF0000');
          }
        } catch (error) {
          failedTests += 1;
          console.log(`  ❌ ${test.name} - Error: ${error.message}`, 'color: #FF0000');
        }
      });
    });

    console.log(`\n%c=== Test Results ===`, 'color: #FFD700; font-weight: bold; font-size: 16px');
    console.log(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    
    if (failedTests === 0) {
      console.log('%cAll tests passed! 🎉', 'color: #00FF00; font-weight: bold; font-size: 14px');
    } else {
      console.log(`%c${failedTests} test(s) failed`, 'color: #FF0000; font-weight: bold; font-size: 14px');
    }

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests
    };
  }

  // Export for use
  if (typeof window !== 'undefined') {
    window.premiumAutotuneTests = {
      run: runTests,
      MockPremiumService: MockPremiumService
    };
  }

  // Auto-run if in test environment
  if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
    setTimeout(runTests, 1000);
  }
})();

