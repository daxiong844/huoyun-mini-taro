/**
 * 高德地图API工具函数集合
 * 提供坐标转换、数据处理等通用功能
 */

// 导出兼容性工具函数
export * from './compatibility';

/**
 * 坐标格式验证
 * @param {string|Array} coordinate - 坐标，格式为 "lng,lat" 或 [lng, lat]
 * @returns {boolean} 是否为有效坐标
 */
export const isValidCoordinate = (coordinate) => {
  if (!coordinate) return false;
  
  let lng, lat;
  
  if (typeof coordinate === 'string') {
    const parts = coordinate.split(',');
    if (parts.length !== 2) return false;
    lng = parseFloat(parts[0]);
    lat = parseFloat(parts[1]);
  } else if (Array.isArray(coordinate) && coordinate.length === 2) {
    lng = parseFloat(coordinate[0]);
    lat = parseFloat(coordinate[1]);
  } else {
    return false;
  }
  
  // 检查经纬度范围
  return !isNaN(lng) && !isNaN(lat) && 
         lng >= -180 && lng <= 180 && 
         lat >= -90 && lat <= 90;
};

/**
 * 格式化坐标为字符串
 * @param {string|Array|Object} coordinate - 坐标
 * @returns {string} 格式化后的坐标字符串 "lng,lat"
 */
export const formatCoordinate = (coordinate) => {
  if (!coordinate) return '';
  
  if (typeof coordinate === 'string') {
    return coordinate;
  }
  
  if (Array.isArray(coordinate) && coordinate.length >= 2) {
    return `${coordinate[0]},${coordinate[1]}`;
  }
  
  if (typeof coordinate === 'object' && coordinate.lng && coordinate.lat) {
    return `${coordinate.lng},${coordinate.lat}`;
  }
  
  if (typeof coordinate === 'object' && coordinate.longitude && coordinate.latitude) {
    return `${coordinate.longitude},${coordinate.latitude}`;
  }
  
  return '';
};

/**
 * 解析坐标字符串为对象
 * @param {string} coordinateStr - 坐标字符串 "lng,lat"
 * @returns {Object} 坐标对象 {lng, lat}
 */
export const parseCoordinate = (coordinateStr) => {
  if (!coordinateStr || typeof coordinateStr !== 'string') {
    return null;
  }
  
  const parts = coordinateStr.split(',');
  if (parts.length !== 2) {
    return null;
  }
  
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  
  if (isNaN(lng) || isNaN(lat)) {
    return null;
  }
  
  return { lng, lat };
};

/**
 * 计算两点之间的直线距离（米）
 * @param {string|Array|Object} coord1 - 起点坐标
 * @param {string|Array|Object} coord2 - 终点坐标
 * @returns {number} 距离（米）
 */
export const calculateDistance = (coord1, coord2) => {
  const point1 = parseCoordinate(formatCoordinate(coord1));
  const point2 = parseCoordinate(formatCoordinate(coord2));
  
  if (!point1 || !point2) {
    return 0;
  }
  
  const R = 6371000; // 地球半径（米）
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;
  
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
};

/**
 * 格式化距离显示
 * @param {number} distance - 距离（米）
 * @returns {string} 格式化后的距离字符串
 */
export const formatDistance = (distance) => {
  if (!distance || distance < 0) return '0米';
  
  if (distance < 1000) {
    return `${Math.round(distance)}米`;
  } else {
    return `${(distance / 1000).toFixed(1)}公里`;
  }
};

/**
 * 格式化时间显示
 * @param {number} duration - 时间（秒）
 * @returns {string} 格式化后的时间字符串
 */
export const formatDuration = (duration) => {
  if (!duration || duration < 0) return '0分钟';
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  } else {
    return `${Math.max(1, minutes)}分钟`;
  }
};

/**
 * 格式化费用显示
 * @param {number} cost - 费用（元）
 * @returns {string} 格式化后的费用字符串
 */
export const formatCost = (cost) => {
  if (!cost || cost < 0) return '0元';
  
  if (cost < 1) {
    return `${Math.round(cost * 100)}分`;
  } else {
    return `${cost.toFixed(2)}元`;
  }
};

/**
 * 解析路径坐标点
 * @param {string} polyline - 路径编码字符串
 * @returns {Array} 坐标点数组
 */
export const parsePolyline = (polyline) => {
  if (!polyline || typeof polyline !== 'string') {
    return [];
  }
  
  // 这里可以实现高德地图的polyline解码算法
  // 暂时返回空数组，实际使用时需要根据高德地图的编码规则实现
  return [];
};

/**
 * 验证地址字符串
 * @param {string} address - 地址字符串
 * @returns {boolean} 是否为有效地址
 */
export const isValidAddress = (address) => {
  return typeof address === 'string' && address.trim().length > 0;
};

/**
 * 清理和格式化地址
 * @param {string} address - 原始地址
 * @returns {string} 清理后的地址
 */
export const cleanAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return '';
  }
  
  return address.trim().replace(/\s+/g, ' ');
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  
  return obj;
};