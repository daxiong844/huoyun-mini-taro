/**
 * 高德地图API服务使用示例
 * 展示各种API的使用方法
 */

import { 
  AmapService, 
  createAmapService,
  amapService,
  getDrivingRoute,
  geocode,
  reverseGeocode
} from '../index';

/**
 * 使用示例集合
 */
export class AmapUsageExamples {
  
  /**
   * 路径规划使用示例
   */
  static async routePlanningExamples() {
    console.log('=== 路径规划使用示例 ===');
    
    try {
      // 1. 驾车路径规划
      console.log('1. 驾车路径规划');
      const drivingResult = await getDrivingRoute({
        origin: '116.481028,39.989643', // 北京天安门
        destination: '116.434446,39.90816', // 北京西站
        strategy: 0 // 速度优先
      });
      console.log('驾车路径:', drivingResult);
      
      // 2. 使用服务类实例
      console.log('2. 使用服务类实例');
      const service = new AmapService();
      const walkingResult = await service.getWalkingRoute({
        origin: [116.481028, 39.989643],
        destination: [116.434446, 39.90816]
      });
      console.log('步行路径:', walkingResult);
      
      // 3. 多种出行方式对比
      console.log('3. 多种出行方式对比');
      const multiModeResult = await amapService.getMultiModeRoutes({
        origin: '116.481028,39.989643',
        destination: '116.434446,39.90816',
        modes: ['driving', 'walking', 'bicycling']
      });
      console.log('多种出行方式:', multiModeResult);
      
      // 4. 带途经点的驾车路径
      console.log('4. 带途经点的驾车路径');
      const waypointsResult = await getDrivingRoute({
        origin: '116.481028,39.989643',
        destination: '116.434446,39.90816',
        waypoints: ['116.465302,39.925818'] // 途经王府井
      });
      console.log('带途经点的路径:', waypointsResult);
      
    } catch (error) {
      console.error('路径规划示例失败:', error);
    }
  }
  
  /**
   * 地理编码使用示例
   */
  static async geocodingExamples() {
    console.log('=== 地理编码使用示例 ===');
    
    try {
      // 1. 地址转坐标
      console.log('1. 地址转坐标');
      const geocodeResult = await geocode({
        address: '北京市朝阳区阜通东大街6号',
        city: '北京'
      });
      console.log('地理编码结果:', geocodeResult);
      
      // 2. 坐标转地址
      console.log('2. 坐标转地址');
      const reverseResult = await reverseGeocode({
        location: '116.481028,39.989643',
        extensions: 'all'
      });
      console.log('逆地理编码结果:', reverseResult);
      
      // 3. 批量地址转坐标
      console.log('3. 批量地址转坐标');
      const batchGeocodeResult = await amapService.batchGeocode({
        addresses: [
          '北京市朝阳区阜通东大街6号',
          '上海市浦东新区世纪大道1号',
          '广州市天河区珠江新城'
        ]
      });
      console.log('批量地理编码结果:', batchGeocodeResult);
      
      // 4. 地址搜索
      console.log('4. 地址搜索');
      const searchResult = await amapService.searchAddress({
        keywords: '万达广场',
        city: '北京',
        location: '116.481028,39.989643',
        radius: 5000
      });
      console.log('地址搜索结果:', searchResult);
      
    } catch (error) {
      console.error('地理编码示例失败:', error);
    }
  }
  
  /**
   * 便捷方法使用示例
   */
  static async convenienceMethodsExamples() {
    console.log('=== 便捷方法使用示例 ===');
    
    try {
      // 1. 获取两点间距离和时间
      console.log('1. 获取两点间距离和时间');
      const distanceResult = await amapService.getDistanceAndDuration(
        '116.481028,39.989643', // 起点
        '116.434446,39.90816'   // 终点
      );
      console.log('距离和时间:', distanceResult);
      
      // 2. 地址转坐标便捷方法
      console.log('2. 地址转坐标便捷方法');
      const addressResult = await amapService.addressToCoordinate(
        '北京市朝阳区阜通东大街6号',
        '北京'
      );
      console.log('地址转坐标:', addressResult);
      
      // 3. 坐标转地址便捷方法
      console.log('3. 坐标转地址便捷方法');
      const coordinateResult = await amapService.coordinateToAddress(
        '116.481028,39.989643'
      );
      console.log('坐标转地址:', coordinateResult);
      
      // 4. 获取指定出行方式的路径
      console.log('4. 获取指定出行方式的路径');
      const routeResult = await amapService.getRoute(
        '116.481028,39.989643',
        '116.434446,39.90816',
        'bicycling' // 骑行
      );
      console.log('骑行路径:', routeResult);
      
    } catch (error) {
      console.error('便捷方法示例失败:', error);
    }
  }
  
  /**
   * 自定义配置使用示例
   */
  static async customConfigExamples() {
    console.log('=== 自定义配置使用示例 ===');
    
    try {
      // 1. 创建自定义配置的服务实例
      console.log('1. 创建自定义配置的服务实例');
      const customService = createAmapService({
        maxAttempts: 5, // 最大重试次数
        retryDelay: 2000 // 重试延迟
      });
      
      const result = await customService.getDrivingRoute({
        origin: '116.481028,39.989643',
        destination: '116.434446,39.90816'
      });
      console.log('自定义配置结果:', result);
      
      // 2. 使用特定的驾车策略
      console.log('2. 使用特定的驾车策略');
      const strategyResult = await getDrivingRoute({
        origin: '116.481028,39.989643',
        destination: '116.434446,39.90816',
        strategy: 1, // 费用优先
        cartype: 0,  // 小客车
        plate: 1     // 考虑限行
      });
      console.log('策略路径结果:', strategyResult);
      
    } catch (error) {
      console.error('自定义配置示例失败:', error);
    }
  }
  
  /**
   * 错误处理示例
   */
  static async errorHandlingExamples() {
    console.log('=== 错误处理示例 ===');
    
    try {
      // 1. 无效坐标处理
      console.log('1. 无效坐标处理');
      try {
        await getDrivingRoute({
          origin: 'invalid_coordinate',
          destination: '116.434446,39.90816'
        });
      } catch (error) {
        console.log('捕获到坐标错误:', error.message);
      }
      
      // 2. 无效地址处理
      console.log('2. 无效地址处理');
      try {
        await geocode({
          address: '' // 空地址
        });
      } catch (error) {
        console.log('捕获到地址错误:', error.message);
      }
      
      // 3. 网络错误处理
      console.log('3. 网络错误处理');
      // 这里可以模拟网络错误的处理
      
    } catch (error) {
      console.error('错误处理示例失败:', error);
    }
  }
  
  /**
   * 运行所有示例
   */
  static async runAllExamples() {
    console.log('开始运行高德地图API服务示例...\n');
    
    await this.routePlanningExamples();
    console.log('\n');
    
    await this.geocodingExamples();
    console.log('\n');
    
    await this.convenienceMethodsExamples();
    console.log('\n');
    
    await this.customConfigExamples();
    console.log('\n');
    
    await this.errorHandlingExamples();
    console.log('\n');
    
    console.log('所有示例运行完成！');
  }
}

/**
 * 在小程序中的使用示例
 */
export const miniProgramUsageExample = {
  
  /**
   * 页面数据
   */
  data: {
    origin: '',
    destination: '',
    routeResult: null,
    loading: false
  },
  
  /**
   * 获取路径规划
   */
  async getRoute() {
    if (!this.data.origin || !this.data.destination) {
      wx.showToast({
        title: '请输入起点和终点',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      const result = await amapService.getDrivingRoute({
        origin: this.data.origin,
        destination: this.data.destination
      });
      
      this.setData({ 
        routeResult: result,
        loading: false 
      });
      
      wx.showToast({
        title: '路径规划成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('路径规划失败:', error);
      
      this.setData({ loading: false });
      
      wx.showToast({
        title: '路径规划失败',
        icon: 'none'
      });
    }
  },
  
  /**
   * 地址转坐标
   */
  async addressToCoordinate(address) {
    try {
      const result = await amapService.addressToCoordinate(address);
      
      if (result.coordinate) {
        return `${result.coordinate.lng},${result.coordinate.lat}`;
      } else {
        throw new Error('地址转换失败');
      }
      
    } catch (error) {
      console.error('地址转坐标失败:', error);
      wx.showToast({
        title: '地址转换失败',
        icon: 'none'
      });
      return null;
    }
  },
  
  /**
   * 获取当前位置的地址
   */
  async getCurrentAddress() {
    try {
      // 获取当前位置
      const location = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject
        });
      });
      
      // 逆地理编码
      const result = await amapService.coordinateToAddress(
        `${location.longitude},${location.latitude}`
      );
      
      return result.address;
      
    } catch (error) {
      console.error('获取当前地址失败:', error);
      return null;
    }
  }
};

// 如果在开发环境，可以运行示例
if (process.env.NODE_ENV === 'development') {
  // AmapUsageExamples.runAllExamples();
}