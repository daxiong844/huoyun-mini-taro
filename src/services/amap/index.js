/**
 * 高德地图API服务主入口
 * 提供完整的高德地图API服务接口
 */

// 导出所有API服务
export * from './api';

// 导出配置
export { AMAP_CONFIG } from './config';

// 导出工具函数
export * from './utils';

/**
 * 高德地图服务类
 * 提供面向对象的API调用方式
 */
import {
  getDrivingRoute,
  getWalkingRoute,
  getBicyclingRoute,
  getElectricBikeRoute,
  getMultiModeRoutes,
  geocode,
  batchGeocode,
  reverseGeocode,
  batchReverseGeocode,
  searchAddress,
  getInputTips,
  batchGetInputTips,
  searchPOITips,
  searchAddressTips,
  searchBusTips,
  smartSearchTips
} from './api';

export class AmapService {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    this.config = config;
  }

  // ==================== 路径规划相关方法 ====================

  /**
   * 获取驾车路径规划
   * @param {Object} params - 路径规划参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 路径规划结果
   */
  async getDrivingRoute(params, options = {}) {
    return getDrivingRoute(params, { ...this.config, ...options });
  }

  /**
   * 获取步行路径规划
   * @param {Object} params - 路径规划参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 路径规划结果
   */
  async getWalkingRoute(params, options = {}) {
    return getWalkingRoute(params, { ...this.config, ...options });
  }

  /**
   * 获取骑行路径规划
   * @param {Object} params - 路径规划参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 路径规划结果
   */
  async getBicyclingRoute(params, options = {}) {
    return getBicyclingRoute(params, { ...this.config, ...options });
  }

  /**
   * 获取电动车路径规划
   * @param {Object} params - 路径规划参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 路径规划结果
   */
  async getElectricBikeRoute(params, options = {}) {
    return getElectricBikeRoute(params, { ...this.config, ...options });
  }

  /**
   * 获取多种出行方式的路径规划
   * @param {Object} params - 路径规划参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 多种出行方式的路径规划结果
   */
  async getMultiModeRoutes(params, options = {}) {
    return getMultiModeRoutes(params, { ...this.config, ...options });
  }

  // ==================== 地理编码相关方法 ====================

  /**
   * 地理编码 - 地址转坐标
   * @param {Object} params - 地理编码参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 地理编码结果
   */
  async geocode(params, options = {}) {
    return geocode(params, { ...this.config, ...options });
  }

  /**
   * 批量地理编码 - 多个地址转坐标
   * @param {Object} params - 批量地理编码参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 批量地理编码结果
   */
  async batchGeocode(params, options = {}) {
    return batchGeocode(params, { ...this.config, ...options });
  }

  /**
   * 逆地理编码 - 坐标转地址
   * @param {Object} params - 逆地理编码参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 逆地理编码结果
   */
  async reverseGeocode(params, options = {}) {
    return reverseGeocode(params, { ...this.config, ...options });
  }

  /**
   * 批量逆地理编码 - 多个坐标转地址
   * @param {Object} params - 批量逆地理编码参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 批量逆地理编码结果
   */
  async batchReverseGeocode(params, options = {}) {
    return batchReverseGeocode(params, { ...this.config, ...options });
  }

  /**
   * 地址模糊搜索
   * @param {Object} params - 搜索参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 地址搜索结果
   */
  async searchAddress(params, options = {}) {
    return searchAddress(params, { ...this.config, ...options });
  }

  // ==================== 输入提示相关方法 ====================

  /**
   * 获取输入提示
   * @param {Object} params - 输入提示参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 输入提示结果
   */
  async getInputTips(params, options = {}) {
    return getInputTips(params, { ...this.config, ...options });
  }

  /**
   * 批量获取输入提示
   * @param {Array<Object>} paramsList - 批量请求参数列表
   * @param {Object} options - 请求选项
   * @returns {Promise<Array<Object>>} 批量输入提示结果
   */
  async batchGetInputTips(paramsList, options = {}) {
    return batchGetInputTips(paramsList, { ...this.config, ...options });
  }

  /**
   * 搜索POI提示
   * @param {Object} params - 搜索参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} POI提示结果
   */
  async searchPOITips(params, options = {}) {
    return searchPOITips(params, { ...this.config, ...options });
  }

  /**
   * 搜索地址提示
   * @param {Object} params - 搜索参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 地址提示结果
   */
  async searchAddressTips(params, options = {}) {
    return searchAddressTips(params, { ...this.config, ...options });
  }

  /**
   * 搜索公交站点提示
   * @param {Object} params - 搜索参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 公交站点提示结果
   */
  async searchBusTips(params, options = {}) {
    return searchBusTips(params, { ...this.config, ...options });
  }

  /**
   * 智能搜索提示
   * @param {Object} params - 搜索参数
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 智能搜索提示结果
   */
  async smartSearchTips(params, options = {}) {
    return smartSearchTips(params, { ...this.config, ...options });
  }

  // ==================== 便捷方法 ====================

  /**
   * 获取两点间的最优路径（默认驾车）
   * @param {string|Array|Object} origin - 起点坐标
   * @param {string|Array|Object} destination - 终点坐标
   * @param {string} mode - 出行方式 ('driving', 'walking', 'bicycling', 'electrobike')
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 路径规划结果
   */
  async getRoute(origin, destination, mode = 'driving', options = {}) {
    const params = { origin, destination };
    
    switch (mode) {
      case 'driving':
        return this.getDrivingRoute(params, options);
      case 'walking':
        return this.getWalkingRoute(params, options);
      case 'bicycling':
        return this.getBicyclingRoute(params, options);
      case 'electrobike':
        return this.getElectricBikeRoute(params, options);
      default:
        throw new Error(`不支持的出行方式: ${mode}`);
    }
  }

  /**
   * 地址转坐标的便捷方法
   * @param {string} address - 地址信息
   * @param {string} city - 城市限制
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 地理编码结果
   */
  async addressToCoordinate(address, city = '', options = {}) {
    const params = { address };
    if (city) {
      params.city = city;
    }
    return this.geocode(params, options);
  }

  /**
   * 坐标转地址的便捷方法
   * @param {string|Array|Object} location - 坐标信息
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 逆地理编码结果
   */
  async coordinateToAddress(location, options = {}) {
    return this.reverseGeocode({ location }, options);
  }

  /**
   * 计算两点间的距离和时间（驾车）
   * @param {string|Array|Object} origin - 起点坐标
   * @param {string|Array|Object} destination - 终点坐标
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 包含距离和时间的结果
   */
  async getDistanceAndDuration(origin, destination, options = {}) {
    try {
      const result = await this.getDrivingRoute({ origin, destination }, options);
      
      if (result.paths && result.paths.length > 0) {
        const path = result.paths[0];
        return {
          status: 'success',
          distance: path.distance,
          duration: path.duration,
          distanceText: path.distanceText,
          durationText: path.durationText,
          tolls: path.tolls || 0,
          tollsText: path.tollsText || '0元'
        };
      } else {
        throw new Error('未找到可用路径');
      }
    } catch (error) {
      console.error('获取距离和时间失败:', error);
      throw error;
    }
  }
}

/**
 * 创建高德地图服务实例
 * @param {Object} config - 配置选项
 * @returns {AmapService} 高德地图服务实例
 */
export const createAmapService = (config = {}) => {
  return new AmapService(config);
};

// 导出默认实例
export const amapService = new AmapService();