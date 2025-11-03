/**
 * 高德地图输入提示API测试文件
 * 用于验证输入提示功能在微信小程序环境下是否正常工作
 */

import { 
  getInputTips,
  batchGetInputTips,
  searchPOITips,
  searchAddressTips,
  searchBusTips,
  smartSearchTips,
  amapService
} from '../index';

/**
 * 输入提示API测试套件
 */
export class InputTipsTestSuite {
  
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 记录测试结果
   */
  recordTest(testName, passed, error = null) {
    this.totalTests++;
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${testName} - 通过`);
    } else {
      this.failedTests++;
      console.log(`❌ ${testName} - 失败:`, error?.message || error);
    }
    
    this.testResults.push({
      name: testName,
      passed,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 测试基础输入提示功能
   */
  async testBasicInputTips() {
    console.log('\n=== 测试基础输入提示功能 ===');
    
    // 测试1: 基础关键词搜索
    try {
      const result = await getInputTips({
        keywords: '万达广场'
      });
      
      const passed = result && 
                    result.success === true && 
                    Array.isArray(result.tips) && 
                    typeof result.count === 'number';
      
      this.recordTest('基础关键词搜索', passed, passed ? null : '返回数据格式不正确');
      
      if (passed && result.tips.length > 0) {
        console.log(`  找到 ${result.count} 个结果，第一个: ${result.tips[0].name}`);
      }
      
    } catch (error) {
      this.recordTest('基础关键词搜索', false, error);
    }

    // 测试2: 指定城市搜索
    try {
      const result = await getInputTips({
        keywords: '银行',
        city: '北京'
      });
      
      const passed = result && 
                    result.success === true && 
                    Array.isArray(result.tips);
      
      this.recordTest('指定城市搜索', passed, passed ? null : '城市搜索失败');
      
    } catch (error) {
      this.recordTest('指定城市搜索', false, error);
    }

    // 测试3: 坐标搜索
    try {
      const result = await getInputTips({
        keywords: '餐厅',
        location: '116.481028,39.989643',
        city: '北京'
      });
      
      const passed = result && result.success === true;
      this.recordTest('坐标搜索', passed, passed ? null : '坐标搜索失败');
      
    } catch (error) {
      this.recordTest('坐标搜索', false, error);
    }
  }

  /**
   * 测试分类搜索功能
   */
  async testCategorizedSearch() {
    console.log('\n=== 测试分类搜索功能 ===');
    
    // 测试POI搜索
    try {
      const result = await searchPOITips({
        keywords: '咖啡厅',
        city: '北京'
      });
      
      const passed = result && result.success === true;
      this.recordTest('POI搜索', passed, passed ? null : 'POI搜索失败');
      
    } catch (error) {
      this.recordTest('POI搜索', false, error);
    }

    // 测试地址搜索
    try {
      const result = await searchAddressTips({
        keywords: '朝阳区',
        city: '北京'
      });
      
      const passed = result && result.success === true;
      this.recordTest('地址搜索', passed, passed ? null : '地址搜索失败');
      
    } catch (error) {
      this.recordTest('地址搜索', false, error);
    }

    // 测试公交搜索
    try {
      const result = await searchBusTips({
        keywords: '地铁站',
        city: '北京'
      });
      
      const passed = result && result.success === true;
      this.recordTest('公交搜索', passed, passed ? null : '公交搜索失败');
      
    } catch (error) {
      this.recordTest('公交搜索', false, error);
    }

    // 测试智能搜索
    try {
      const result = await smartSearchTips({
        keywords: '北京大学',
        city: '北京'
      });
      
      const passed = result && result.success === true;
      this.recordTest('智能搜索', passed, passed ? null : '智能搜索失败');
      
    } catch (error) {
      this.recordTest('智能搜索', false, error);
    }
  }

  /**
   * 测试批量搜索功能
   */
  async testBatchSearch() {
    console.log('\n=== 测试批量搜索功能 ===');
    
    try {
      const batchParams = [
        { keywords: '麦当劳', city: '北京' },
        { keywords: '肯德基', city: '上海' }
      ];
      
      const results = await batchGetInputTips(batchParams);
      
      const passed = Array.isArray(results) && 
                    results.length === batchParams.length &&
                    results.every(result => typeof result === 'object');
      
      this.recordTest('批量搜索', passed, passed ? null : '批量搜索返回格式不正确');
      
      if (passed) {
        const successCount = results.filter(r => r.success).length;
        console.log(`  批量搜索完成，${successCount}/${results.length} 个请求成功`);
      }
      
    } catch (error) {
      this.recordTest('批量搜索', false, error);
    }
  }

  /**
   * 测试服务类方法
   */
  async testServiceClassMethods() {
    console.log('\n=== 测试服务类方法 ===');
    
    // 测试服务类实例方法
    try {
      const result = await amapService.getInputTips({
        keywords: '医院',
        city: '北京'
      });
      
      const passed = result && result.success === true;
      this.recordTest('服务类实例方法', passed, passed ? null : '服务类方法调用失败');
      
    } catch (error) {
      this.recordTest('服务类实例方法', false, error);
    }

    // 测试服务类POI搜索
    try {
      const result = await amapService.searchPOITips({
        keywords: '购物中心',
        city: '上海'
      });
      
      const passed = result && result.success === true;
      this.recordTest('服务类POI搜索', passed, passed ? null : '服务类POI搜索失败');
      
    } catch (error) {
      this.recordTest('服务类POI搜索', false, error);
    }
  }

  /**
   * 测试参数验证
   */
  async testParameterValidation() {
    console.log('\n=== 测试参数验证 ===');
    
    // 测试空关键词
    try {
      await getInputTips({ keywords: '' });
      this.recordTest('空关键词验证', false, '应该抛出错误但没有');
    } catch (error) {
      this.recordTest('空关键词验证', true, null);
    }

    // 测试无效坐标
    try {
      await getInputTips({
        keywords: '餐厅',
        location: 'invalid'
      });
      this.recordTest('无效坐标验证', false, '应该抛出错误但没有');
    } catch (error) {
      this.recordTest('无效坐标验证', true, null);
    }

    // 测试缺少必需参数
    try {
      await getInputTips({});
      this.recordTest('缺少必需参数验证', false, '应该抛出错误但没有');
    } catch (error) {
      this.recordTest('缺少必需参数验证', true, null);
    }
  }

  /**
   * 测试数据格式
   */
  async testDataFormat() {
    console.log('\n=== 测试数据格式 ===');
    
    try {
      const result = await getInputTips({
        keywords: '星巴克',
        city: '北京'
      });
      
      if (result && result.success && result.tips.length > 0) {
        const tip = result.tips[0];
        
        // 检查必需字段
        const hasRequiredFields = tip.name && 
                                 tip.district && 
                                 tip.adcode;
        
        this.recordTest('数据格式-必需字段', hasRequiredFields, 
                       hasRequiredFields ? null : '缺少必需字段');
        
        // 检查坐标格式
        if (tip.location) {
          const coordsValid = /^\d+\.\d+,\d+\.\d+$/.test(tip.location);
          this.recordTest('数据格式-坐标格式', coordsValid,
                         coordsValid ? null : '坐标格式不正确');
        }
        
        // 检查地址码格式
        const adcodeValid = /^\d{6}$/.test(tip.adcode);
        this.recordTest('数据格式-地址码格式', adcodeValid,
                       adcodeValid ? null : '地址码格式不正确');
        
      } else {
        this.recordTest('数据格式测试', false, '无法获取测试数据');
      }
      
    } catch (error) {
      this.recordTest('数据格式测试', false, error);
    }
  }

  /**
   * 测试环境兼容性
   */
  async testEnvironmentCompatibility() {
    console.log('\n=== 测试环境兼容性 ===');
    
    try {
      // 检查是否在微信小程序环境
      const isWechat = typeof wx !== 'undefined' && wx.request;
      console.log(`  当前环境: ${isWechat ? '微信小程序' : '浏览器'}`);
      
      // 测试网络请求是否正常
      const result = await getInputTips({
        keywords: '测试',
        city: '北京'
      });
      
      const passed = result && typeof result === 'object';
      this.recordTest('环境兼容性', passed, passed ? null : '环境兼容性测试失败');
      
      if (isWechat) {
        console.log('  ✅ 微信小程序环境兼容性正常');
      } else {
        console.log('  ✅ 浏览器环境兼容性正常');
      }
      
    } catch (error) {
      this.recordTest('环境兼容性', false, error);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始运行输入提示API测试套件...\n');
    
    const startTime = Date.now();
    
    // 重置测试结果
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    
    // 运行各项测试
    await this.testBasicInputTips();
    await this.testCategorizedSearch();
    await this.testBatchSearch();
    await this.testServiceClassMethods();
    await this.testParameterValidation();
    await this.testDataFormat();
    await this.testEnvironmentCompatibility();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 输出测试结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(50));
    console.log(`总测试数: ${this.totalTests}`);
    console.log(`通过: ${this.passedTests} ✅`);
    console.log(`失败: ${this.failedTests} ❌`);
    console.log(`成功率: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log(`耗时: ${duration}ms`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
    
    return {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      successRate: (this.passedTests / this.totalTests) * 100,
      duration,
      results: this.testResults
    };
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: (this.passedTests / this.totalTests) * 100
      },
      details: this.testResults
    };
    
    console.log('📋 测试报告已生成:', report);
    return report;
  }
}

/**
 * 快速测试函数
 */
export async function quickTest() {
  console.log('🔍 运行快速测试...');
  
  try {
    const result = await getInputTips({
      keywords: '咖啡厅',
      city: '北京'
    });
    
    if (result && result.success) {
      console.log('✅ 快速测试通过 - 输入提示API工作正常');
      console.log(`找到 ${result.count} 个结果`);
      return true;
    } else {
      console.log('❌ 快速测试失败 - API返回异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 快速测试失败:', error.message);
    return false;
  }
}

/**
 * 创建测试实例并导出
 */
export const inputTipsTestSuite = new InputTipsTestSuite();

/**
 * 运行完整测试的便捷函数
 */
export const runInputTipsTests = () => inputTipsTestSuite.runAllTests();