import { api } from '../../api'

// 导入所有图标资源，确保在小程序真机环境下能正确加载
import smallCarIcon from '../../assets/icons/small_car.png'
import mediumCarIcon from '../../assets/icons/medium_car.png'
import largeCarIcon from '../../assets/icons/large_car.png'
import singleRackIcon from '../../assets/icons/single_rack.png'
import truck42Icon from '../../assets/icons/truck_4_2.png'
import truck68Icon from '../../assets/icons/truck_6_8.png'
import truck96Icon from '../../assets/icons/truck_9_6.png'
import truck13Icon from '../../assets/icons/truck_13.png'
import truck175Icon from '../../assets/icons/truck_17_5.png'
import cargoFullTruckIcon from '../../assets/icons/cargo-full-truck.png'
import cargoLtlIcon from '../../assets/icons/cargo-ltl.png'

export type VehicleSource = {
  id: number
  type: 'vehicle'
  model: '小面' | '中面' | '大面' | '单排' | '4.2' | '6.8' | '9.6' | '13' | '17.5'
  brand: string
  plate: string
  location: { latitude: number; longitude: number }
  available: boolean
  length: number
  load: number
  owner: string // 司机/企业
}

// 货源数据类型定义
export interface CargoSource {
  id: number;
  type: '整车' | '零单'; // 货源类型
  origin: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  loadingTime: string; // 装货时间
  unloadingTime: string; // 卸货时间
  cargoInfo: {
    type: string; // 货物类型
    weight: number; // 重量(吨)
    volume: number; // 体积(立方米)
    description: string; // 描述
  };
  freightRate: number; // 运价(元)
  status: 'pending' | 'in_transit' | 'completed'; // 状态
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export type FreightResponse = {
  vehicles: VehicleSource[]
  cargos: CargoSource[]
}

export async function fetchFreight(center: { latitude: number; longitude: number }, scale: number): Promise<FreightResponse> {
  const { latitude, longitude } = center
  return api.get<FreightResponse>('/freight', {
    query: { lat: latitude, lng: longitude, scale }
  })
}

/**
 * 根据车型获取对应图标
 * @param model 车型
 * @returns 图标URL
 */
export function getVehicleIcon(model: VehicleSource['model']): string {
  // 使用import导入的图标资源，确保在真机环境下能正确显示
  const iconMap: Record<VehicleSource['model'], string> = {
    '小面': smallCarIcon,
    '中面': mediumCarIcon,
    '大面': largeCarIcon,
    '单排': singleRackIcon,
    '4.2': truck42Icon,
    '6.8': truck68Icon,
    '9.6': truck96Icon,
    '13': truck13Icon,
    '17.5': truck175Icon
  };

  return iconMap[model];
}

/**
 * 根据货源类型获取对应图标
 * @param type 货源类型
 * @returns 图标URL
 */
export function getCargoIcon(type: CargoSource['type']): string {
  // 使用import导入的图标资源，确保在真机环境下能正确显示
  const iconMap: Record<CargoSource['type'], string> = {
    '整车': cargoFullTruckIcon,
    '零单': cargoLtlIcon
  };

  return iconMap[type];
}