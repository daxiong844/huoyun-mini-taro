/**
 * 高德地图API服务统一入口
 * 导出所有高德地图相关的API服务
 */

// 路径规划相关API
export {
  getDrivingRoute,
  getWalkingRoute,
  getBicyclingRoute,
  getElectricBikeRoute,
  getMultiModeRoutes
} from './direction';

// 地理编码相关API
export {
  geocode,
  batchGeocode,
  reverseGeocode,
  batchReverseGeocode,
  searchAddress
} from './geocoding';

// 输入提示相关API
export {
  getInputTips,
  batchGetInputTips,
  searchPOITips,
  searchAddressTips,
  searchBusTips,
  smartSearchTips,
  INPUTTIPS_CONFIG
} from './inputtips';

// 配置和工具
export { AMAP_CONFIG } from '../config';
export * from '../utils';