/**
 * 高德地图输入提示API服务
 * 提供基于关键词的地点搜索提示功能，支持POI、地址、公交站点等多种类型的搜索提示
 * 
 * API文档: https://lbs.amap.com/api/webservice/guide/api-advanced/inputtips
 */

import { get } from '../utils/request';
import { AMAP_CONFIG } from '../config';
import { 
  isValidCoordinate, 
  formatCoordinate,
  compatLog,
  handleCompatError
} from '../utils';

/**
 * 输入提示API配置
 */
const INPUTTIPS_CONFIG = {
  // API端点
  ENDPOINT: '/v3/assistant/inputtips',
  
  // 数据类型
  DATATYPE: {
    ALL: 'all',        // 返回所有数据类型
    POI: 'poi',        // 返回POI数据类型
    ADDRESS: 'address', // 返回地址数据类型
    BUS: 'bus'         // 返回公交站点数据类型
  },
  
  // 默认参数
  DEFAULT_PARAMS: {
    output: 'JSON',     // 输出格式
    datatype: 'all',    // 数据类型
    citylimit: false    // 是否强制限制在设置的城市内搜索
  }
};

/**
 * 处理输入提示API响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的数据
 */
function processInputTipsResponse(response) {
  try {
    if (!response || response.status !== '1') {
      throw new Error(response?.info || '输入提示请求失败');
    }

    const tips = response.tips || [];
    
    // 处理提示数据
    const processedTips = tips.map(tip => {
      const processed = {
        // 基础信息
        id: tip.id || '',
        name: tip.name || '',
        district: tip.district || '',
        adcode: tip.adcode || '',
        
        // 位置信息
        location: tip.location || '',
        address: tip.address || '',
        
        // 类型信息
        typecode: tip.typecode || '',
        
        // 格式化后的信息
        formattedName: tip.name || '',
        formattedAddress: formatAddress(tip),
        
        // 坐标信息（如果有）
        coordinates: null
      };
      
      // 解析坐标
      if (tip.location && isValidCoordinate(tip.location)) {
        const coords = tip.location.split(',');
        if (coords.length === 2) {
          processed.coordinates = {
            longitude: parseFloat(coords[0]),
            latitude: parseFloat(coords[1])
          };
        }
      }
      
      return processed;
    });

    return {
      success: true,
      count: processedTips.length,
      tips: processedTips,
      info: response.info || '查询成功',
      infocode: response.infocode || '10000'
    };
    
  } catch (error) {
    compatLog('处理输入提示响应数据失败:', error);
    throw handleCompatError(error, '处理输入提示数据失败');
  }
}

/**
 * 格式化地址信息
 * @param {Object} tip - 提示项数据
 * @returns {string} 格式化后的地址
 */
function formatAddress(tip) {
  const parts = [];
  
  if (tip.district) {
    parts.push(tip.district);
  }
  
  if (tip.address && tip.address !== tip.district) {
    parts.push(tip.address);
  }
  
  return parts.join(' ') || tip.name || '';
}

/**
 * 验证输入提示参数
 * @param {Object} params - 请求参数
 * @throws {Error} 参数验证失败时抛出错误
 */
function validateInputTipsParams(params) {
  if (!params) {
    throw new Error('输入提示参数不能为空');
  }
  
  if (!params.keywords || typeof params.keywords !== 'string') {
    throw new Error('关键词(keywords)参数必须是非空字符串');
  }
  
  if (params.keywords.trim().length === 0) {
    throw new Error('关键词不能为空');
  }
  
  // 验证位置参数（如果提供）
  if (params.location && !isValidCoordinate(params.location)) {
    throw new Error('位置坐标格式不正确，应为"经度,纬度"格式');
  }
  
  // 验证数据类型参数
  if (params.datatype && !Object.values(INPUTTIPS_CONFIG.DATATYPE).includes(params.datatype)) {
    throw new Error(`数据类型参数不正确，支持的类型: ${Object.values(INPUTTIPS_CONFIG.DATATYPE).join(', ')}`);
  }
}

/**
 * 获取输入提示
 * @param {Object} params - 请求参数
 * @param {string} params.keywords - 查询关键词，必填
 * @param {string} [params.type] - POI分类，可选
 * @param {string} [params.location] - 坐标点，传入后，搜索以此点为中心
 * @param {string} [params.city] - 搜索城市，可选值：城市中文、中文全拼、citycode、adcode
 * @param {string} [params.datatype] - 返回的数据类型，可选值：all|poi|address|bus
 * @param {boolean} [params.citylimit] - 是否强制限制在设置的城市内搜索
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 输入提示结果
 */
export const getInputTips = async (params, options = {}) => {
  try {
    // 参数验证
    validateInputTipsParams(params);
    
    compatLog('开始获取输入提示:', params);
    
    // 构建请求参数
    const requestParams = {
      ...INPUTTIPS_CONFIG.DEFAULT_PARAMS,
      keywords: params.keywords.trim()
    };
    
    // 可选参数
    if (params.type) {
      requestParams.type = params.type;
    }
    
    if (params.location && isValidCoordinate(params.location)) {
      requestParams.location = formatCoordinate(params.location);
    }
    
    if (params.city) {
      requestParams.city = params.city;
    }
    
    if (params.datatype) {
      requestParams.datatype = params.datatype;
    }
    
    if (typeof params.citylimit === 'boolean') {
      requestParams.citylimit = params.citylimit;
    }
    
    // 发送请求
    const response = await get(INPUTTIPS_CONFIG.ENDPOINT, requestParams, options);
    
    // 处理响应
    const result = processInputTipsResponse(response);
    
    compatLog('输入提示获取成功:', result);
    return result;
    
  } catch (error) {
    compatLog('获取输入提示失败:', error);
    throw handleCompatError(error, '获取输入提示失败');
  }
};

/**
 * 批量获取输入提示
 * @param {Array<Object>} paramsList - 批量请求参数列表
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Array<Object>>} 批量输入提示结果
 */
export const batchGetInputTips = async (paramsList, options = {}) => {
  try {
    if (!Array.isArray(paramsList) || paramsList.length === 0) {
      throw new Error('批量请求参数必须是非空数组');
    }
    
    compatLog('开始批量获取输入提示:', paramsList);
    
    // 并发请求所有输入提示
    const promises = paramsList.map((params, index) => 
      getInputTips(params, options).catch(error => {
        compatLog(`第${index + 1}个输入提示请求失败:`, error);
        return {
          success: false,
          error: error.message,
          index
        };
      })
    );
    
    const results = await Promise.all(promises);
    
    compatLog('批量输入提示获取完成:', results);
    return results;
    
  } catch (error) {
    compatLog('批量获取输入提示失败:', error);
    throw handleCompatError(error, '批量获取输入提示失败');
  }
};

/**
 * 搜索POI提示
 * @param {Object} params - 搜索参数
 * @param {string} params.keywords - 搜索关键词
 * @param {string} [params.city] - 搜索城市
 * @param {string} [params.location] - 中心点坐标
 * @param {string} [params.type] - POI类型
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} POI提示结果
 */
export const searchPOITips = async (params, options = {}) => {
  return getInputTips({
    ...params,
    datatype: INPUTTIPS_CONFIG.DATATYPE.POI
  }, options);
};

/**
 * 搜索地址提示
 * @param {Object} params - 搜索参数
 * @param {string} params.keywords - 搜索关键词
 * @param {string} [params.city] - 搜索城市
 * @param {string} [params.location] - 中心点坐标
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 地址提示结果
 */
export const searchAddressTips = async (params, options = {}) => {
  return getInputTips({
    ...params,
    datatype: INPUTTIPS_CONFIG.DATATYPE.ADDRESS
  }, options);
};

/**
 * 搜索公交站点提示
 * @param {Object} params - 搜索参数
 * @param {string} params.keywords - 搜索关键词
 * @param {string} [params.city] - 搜索城市
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 公交站点提示结果
 */
export const searchBusTips = async (params, options = {}) => {
  return getInputTips({
    ...params,
    datatype: INPUTTIPS_CONFIG.DATATYPE.BUS
  }, options);
};

/**
 * 智能搜索提示（根据关键词自动判断类型）
 * @param {Object} params - 搜索参数
 * @param {string} params.keywords - 搜索关键词
 * @param {string} [params.city] - 搜索城市
 * @param {string} [params.location] - 中心点坐标
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 智能搜索提示结果
 */
export const smartSearchTips = async (params, options = {}) => {
  try {
    // 获取所有类型的提示
    const result = await getInputTips({
      ...params,
      datatype: INPUTTIPS_CONFIG.DATATYPE.ALL
    }, options);
    
    // 按类型分组
    const groupedTips = {
      poi: [],
      address: [],
      bus: [],
      other: []
    };
    
    result.tips.forEach(tip => {
      if (tip.typecode) {
        // 根据typecode判断类型
        if (tip.typecode.startsWith('15')) {
          groupedTips.bus.push(tip);
        } else if (tip.typecode === '190301') {
          groupedTips.address.push(tip);
        } else {
          groupedTips.poi.push(tip);
        }
      } else {
        groupedTips.other.push(tip);
      }
    });
    
    return {
      ...result,
      groupedTips
    };
    
  } catch (error) {
    compatLog('智能搜索提示失败:', error);
    throw handleCompatError(error, '智能搜索提示失败');
  }
};

// 导出配置常量
export { INPUTTIPS_CONFIG };