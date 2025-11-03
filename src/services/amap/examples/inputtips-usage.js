/**
 * 高德地图输入提示API使用示例
 * 展示各种输入提示功能的使用方法
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
 * 输入提示使用示例集合
 */
export class InputTipsUsageExamples {
  
  /**
   * 基础输入提示示例
   */
  static async basicInputTipsExamples() {
    console.log('=== 基础输入提示使用示例 ===');
    
    try {
      // 1. 基础关键词搜索
      console.log('1. 基础关键词搜索');
      const basicResult = await getInputTips({
        keywords: '万达广场'
      });
      console.log('基础搜索结果:', basicResult);
      
      // 2. 指定城市搜索
      console.log('2. 指定城市搜索');
      const cityResult = await getInputTips({
        keywords: '万达广场',
        city: '北京'
      });
      console.log('城市搜索结果:', cityResult);
      
      // 3. 指定中心点搜索
      console.log('3. 指定中心点搜索');
      const locationResult = await getInputTips({
        keywords: '咖啡厅',
        location: '116.481028,39.989643', // 天安门坐标
        city: '北京'
      });
      console.log('中心点搜索结果:', locationResult);
      
      // 4. 限制城市内搜索
      console.log('4. 限制城市内搜索');
      const cityLimitResult = await getInputTips({
        keywords: '银行',
        city: '上海',
        citylimit: true
      });
      console.log('城市限制搜索结果:', cityLimitResult);
      
    } catch (error) {
      console.error('基础输入提示示例失败:', error);
    }
  }

  /**
   * 分类搜索示例
   */
  static async categorizedSearchExamples() {
    console.log('=== 分类搜索使用示例 ===');
    
    try {
      // 1. POI搜索
      console.log('1. POI搜索');
      const poiResult = await searchPOITips({
        keywords: '餐厅',
        city: '北京',
        location: '116.481028,39.989643'
      });
      console.log('POI搜索结果:', poiResult);
      
      // 2. 地址搜索
      console.log('2. 地址搜索');
      const addressResult = await searchAddressTips({
        keywords: '朝阳区',
        city: '北京'
      });
      console.log('地址搜索结果:', addressResult);
      
      // 3. 公交站点搜索
      console.log('3. 公交站点搜索');
      const busResult = await searchBusTips({
        keywords: '地铁站',
        city: '北京'
      });
      console.log('公交站点搜索结果:', busResult);
      
      // 4. 智能搜索（自动分类）
      console.log('4. 智能搜索');
      const smartResult = await smartSearchTips({
        keywords: '北京大学',
        city: '北京'
      });
      console.log('智能搜索结果:', smartResult);
      
    } catch (error) {
      console.error('分类搜索示例失败:', error);
    }
  }

  /**
   * 批量搜索示例
   */
  static async batchSearchExamples() {
    console.log('=== 批量搜索使用示例 ===');
    
    try {
      // 批量搜索不同关键词
      const batchParams = [
        { keywords: '麦当劳', city: '北京' },
        { keywords: '肯德基', city: '上海' },
        { keywords: '星巴克', city: '广州' },
        { keywords: '必胜客', city: '深圳' }
      ];
      
      const batchResult = await batchGetInputTips(batchParams);
      console.log('批量搜索结果:', batchResult);
      
      // 分析批量结果
      batchResult.forEach((result, index) => {
        if (result.success) {
          console.log(`第${index + 1}个搜索成功，找到${result.count}个结果`);
        } else {
          console.log(`第${index + 1}个搜索失败:`, result.error);
        }
      });
      
    } catch (error) {
      console.error('批量搜索示例失败:', error);
    }
  }

  /**
   * 使用服务类实例示例
   */
  static async serviceClassExamples() {
    console.log('=== 服务类使用示例 ===');
    
    try {
      // 使用默认服务实例
      console.log('1. 使用默认服务实例');
      const result1 = await amapService.getInputTips({
        keywords: '医院',
        city: '北京'
      });
      console.log('默认服务实例结果:', result1);
      
      // 使用POI搜索
      console.log('2. 使用POI搜索');
      const result2 = await amapService.searchPOITips({
        keywords: '购物中心',
        city: '上海',
        location: '121.473701,31.230416'
      });
      console.log('POI搜索结果:', result2);
      
      // 使用智能搜索
      console.log('3. 使用智能搜索');
      const result3 = await amapService.smartSearchTips({
        keywords: '天安门',
        city: '北京'
      });
      console.log('智能搜索结果:', result3);
      
    } catch (error) {
      console.error('服务类示例失败:', error);
    }
  }

  /**
   * 高级搜索示例
   */
  static async advancedSearchExamples() {
    console.log('=== 高级搜索使用示例 ===');
    
    try {
      // 1. 指定POI类型搜索
      console.log('1. 指定POI类型搜索');
      const typeResult = await getInputTips({
        keywords: '加油站',
        city: '北京',
        type: '010100' // 汽车服务相关
      });
      console.log('类型搜索结果:', typeResult);
      
      // 2. 搜索结果处理和分析
      console.log('2. 搜索结果处理');
      const searchResult = await getInputTips({
        keywords: '银行',
        city: '北京',
        location: '116.481028,39.989643'
      });
      
      if (searchResult.success && searchResult.tips.length > 0) {
        console.log(`找到${searchResult.count}个相关结果:`);
        
        // 按距离排序（如果有坐标信息）
        const tipsWithCoords = searchResult.tips.filter(tip => tip.coordinates);
        console.log(`其中${tipsWithCoords.length}个有坐标信息`);
        
        // 显示前5个结果
        searchResult.tips.slice(0, 5).forEach((tip, index) => {
          console.log(`${index + 1}. ${tip.name} - ${tip.formattedAddress}`);
          if (tip.coordinates) {
            console.log(`   坐标: ${tip.coordinates.longitude}, ${tip.coordinates.latitude}`);
          }
        });
      }
      
    } catch (error) {
      console.error('高级搜索示例失败:', error);
    }
  }

  /**
   * 错误处理示例
   */
  static async errorHandlingExamples() {
    console.log('=== 错误处理使用示例 ===');
    
    try {
      // 1. 空关键词处理
      console.log('1. 测试空关键词');
      try {
        await getInputTips({ keywords: '' });
      } catch (error) {
        console.log('空关键词错误:', error.message);
      }
      
      // 2. 无效坐标处理
      console.log('2. 测试无效坐标');
      try {
        await getInputTips({
          keywords: '餐厅',
          location: 'invalid_coordinate'
        });
      } catch (error) {
        console.log('无效坐标错误:', error.message);
      }
      
      // 3. 网络错误处理
      console.log('3. 网络错误处理示例');
      const result = await getInputTips({
        keywords: '测试',
        city: '北京'
      }).catch(error => {
        console.log('网络请求失败:', error.message);
        return {
          success: false,
          error: error.message,
          tips: []
        };
      });
      
      if (!result.success) {
        console.log('使用默认结果或缓存数据');
      }
      
    } catch (error) {
      console.error('错误处理示例失败:', error);
    }
  }

  /**
   * 运行所有示例
   */
  static async runAllExamples() {
    console.log('开始运行输入提示API所有使用示例...\n');
    
    await this.basicInputTipsExamples();
    console.log('\n');
    
    await this.categorizedSearchExamples();
    console.log('\n');
    
    await this.batchSearchExamples();
    console.log('\n');
    
    await this.serviceClassExamples();
    console.log('\n');
    
    await this.advancedSearchExamples();
    console.log('\n');
    
    await this.errorHandlingExamples();
    
    console.log('\n所有输入提示API示例运行完成！');
  }
}

/**
 * 在小程序中的使用示例
 */
export const miniProgramInputTipsExample = {
  
  /**
   * 页面数据
   */
  data: {
    searchKeywords: '',
    inputTips: [],
    loading: false,
    selectedTip: null
  },
  
  /**
   * 输入框内容变化处理
   */
  onSearchInput(e) {
    const keywords = e.detail.value;
    this.setData({ searchKeywords: keywords });
    
    // 防抖处理，避免频繁请求
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      if (keywords.trim()) {
        this.getInputTips(keywords);
      } else {
        this.setData({ inputTips: [] });
      }
    }, 300);
  },
  
  /**
   * 获取输入提示
   */
  async getInputTips(keywords) {
    this.setData({ loading: true });
    
    try {
      const result = await amapService.getInputTips({
        keywords: keywords,
        city: '北京', // 可以根据用户当前位置动态设置
        datatype: 'all'
      });
      
      this.setData({
        inputTips: result.tips || [],
        loading: false
      });
      
    } catch (error) {
      console.error('获取输入提示失败:', error);
      
      this.setData({
        inputTips: [],
        loading: false
      });
      
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    }
  },
  
  /**
   * 选择提示项
   */
  onTipSelect(e) {
    const index = e.currentTarget.dataset.index;
    const selectedTip = this.data.inputTips[index];
    
    this.setData({
      selectedTip: selectedTip,
      searchKeywords: selectedTip.name,
      inputTips: []
    });
    
    // 触发选择事件
    this.triggerEvent('tipselect', {
      tip: selectedTip
    });
    
    console.log('选择的提示:', selectedTip);
  },
  
  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({
      searchKeywords: '',
      inputTips: [],
      selectedTip: null
    });
  }
};

// 导出示例运行函数
export const runInputTipsExamples = InputTipsUsageExamples.runAllExamples;