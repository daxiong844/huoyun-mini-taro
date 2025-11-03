import { Component, PropsWithChildren } from "react";
import Taro from "@tarojs/taro";
import { View, Image, Button } from "@tarojs/components";
import MapBackground, {
  Marker,
  RouteInfo,
} from "../../components/MapBackground";
// 起终点图标
import startIcon from "../../assets/icons/start.png";
import endIcon from "../../assets/icons/end.png";
import {
  fetchFreight,
  getVehicleIcon,
  getCargoIcon,
} from "../../services/freight";
import SourceMenus from "../../components/SourceMenus";
import type { VehicleModel, CargoType } from "../../components/SourceMenus";

import "./index.scss";

  type State = {
  latitude: number;
  longitude: number;
  scale: number;
  markers: Marker[];
  selected?: { id: number; latitude: number; longitude: number };
  // 高德地图功能相关状态
  showRoute: boolean; // 是否显示路径规划
  routeMode: "driving" | "walking" | "bicycling"; // 路径规划模式
  routeInfo?: RouteInfo; // 路径规划结果
  // 点聚合相关状态
  enableCluster: boolean;
  clusterOptions: {
    enableDefaultStyle: boolean;
    zoomOnClick: boolean;
    gridSize: number;
  };
  // 左侧按钮激活状态
  activeSidebar?: "车源" | "货源" | "发货" | "运单" | "我的" | "询价";
  // 底部起终点选择框
  startPoint?: { name?: string; longitude?: number; latitude?: number };
  endPoint?: { name?: string; longitude?: number; latitude?: number };
  // 地图中心点（拖动结束更新）：用于“设置起点/终点”按钮
  centerPoint?: { name?: string; longitude?: number; latitude?: number };
  // 地图拖动状态
  isDraggingCenter?: boolean;
  // 中心点按钮组显示控制（独立于拖动状态与 centerPoint）
    showCenterActions?: boolean;
    routeTriggerKey?: number;
  // 顶部菜单相关
  activePrimary?: "vehicle" | "cargo" | null;
  selectedVehicle?: VehicleModel;
  selectedCargo?: CargoType;
};

export default class Index extends Component<PropsWithChildren, State> {
  state: State = {
    
    latitude: 38.010232,
    longitude: 114.484472,
    scale: 14,
    markers: [],
    // 高德地图功能默认配置
    showRoute: false,
    routeMode: "driving",
    // 点聚合默认配置
    enableCluster: true,
    clusterOptions: {
      enableDefaultStyle: true,
      zoomOnClick: true,
      gridSize: 60,
    },
    activeSidebar: undefined,
    startPoint: undefined,
    endPoint: undefined,
    centerPoint: undefined,
    isDraggingCenter: false,
    showCenterActions: false,
    routeTriggerKey: undefined,
    activePrimary: null,
    selectedVehicle: undefined,
    selectedCargo: undefined,
    // 顶部子菜单控制（与左侧主按钮配合）
  };

  // 跳转互斥锁：避免同一次点击（或快速重复点击）触发两次导航
  private navigating = false;

  // 处理从搜索地点页面返回的数据
  handleSearchLocationResult = () => {
    const app = Taro.getApp();
    const selectedLocation = app.globalData?.selectedLocation;

    if (selectedLocation) {
      if (selectedLocation.type === "start") {
        this.setState(
          {
            startPoint: {
              name: selectedLocation.name,
              longitude: selectedLocation.longitude,
              latitude: selectedLocation.latitude,
            },
            // 将地图中心设置为选择的起点，并适当扩大范围
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            scale: 18,
          },
          () => {
            const hasStart = !!(
              this.state.startPoint?.latitude && this.state.startPoint?.longitude
            );
            const hasEnd = !!(
              this.state.endPoint?.latitude && this.state.endPoint?.longitude
            );
            if (hasStart && hasEnd) {
              const s = this.state.startPoint!;
              const e = this.state.endPoint!;
              const midLat = (s.latitude! + e.latitude!) / 2;
              const midLng = (s.longitude! + e.longitude!) / 2;
              const distanceKm = this.haversineDistanceKm(
                s.latitude!,
                s.longitude!,
                e.latitude!,
                e.longitude!
              );
              const fitScale = this.computeScaleForDistance(distanceKm);
              this.setState(
                {
                  latitude: midLat,
                  longitude: midLng,
                  scale: fitScale,
                  showRoute: true,
                  routeTriggerKey: Date.now(),
                },
                () => {
                  this.loadFreight();
                }
              );
            } else {
              // 单点选择时，居中到该点后刷新数据
              this.loadFreight();
            }
          }
        );
      } else {
        this.setState(
          {
            endPoint: {
              name: selectedLocation.name,
              longitude: selectedLocation.longitude,
              latitude: selectedLocation.latitude,
            },
            // 将地图中心设置为选择的终点，并适当扩大范围
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            scale: 18,
          },
          () => {
            const hasStart = !!(
              this.state.startPoint?.latitude && this.state.startPoint?.longitude
            );
            const hasEnd = !!(
              this.state.endPoint?.latitude && this.state.endPoint?.longitude
            );
            if (hasStart && hasEnd) {
              const s = this.state.startPoint!;
              const e = this.state.endPoint!;
              const midLat = (s.latitude! + e.latitude!) / 2;
              const midLng = (s.longitude! + e.longitude!) / 2;
              const distanceKm = this.haversineDistanceKm(
                s.latitude!,
                s.longitude!,
                e.latitude!,
                e.longitude!
              );
              const fitScale = this.computeScaleForDistance(distanceKm);
              this.setState(
                {
                  latitude: midLat,
                  longitude: midLng,
                  scale: fitScale,
                  showRoute: true,
                  routeTriggerKey: Date.now(),
                },
                () => {
                  this.loadFreight();
                }
              );
            } else {
              this.loadFreight();
            }
          }
        );
      }

      // 清理全局数据
      app.globalData.selectedLocation = null;
    }
  };

  // 计算两点之间的大圆距离（单位：公里）
  haversineDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371; // 地球半径（km）
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 根据距离选择一个合适的缩放等级，距离越大越“扩大范围”（缩小缩放等级）
  computeScaleForDistance = (distanceKm: number): number => {
    if (distanceKm <= 5) return 14; // 近距离：更聚焦
    if (distanceKm <= 20) return 12;
    if (distanceKm <= 50) return 11;
    if (distanceKm <= 100) return 10;
    if (distanceKm <= 200) return 9;
    return 8; // 跨城：扩大视野
  };

  async componentDidShow() {
    // 每次进入首页默认隐藏“设置起点/终点”按钮组
    this.setState({ showCenterActions: false, isDraggingCenter: false });
    // 处理从搜索页面返回的数据
    this.handleSearchLocationResult();

    // 进入首页后申请当前位置权限；
    // 若用户拒绝或获取失败，则使用默认坐标（38.010232, 114.484472）。
    const defaultCenter = { latitude: 38.010232, longitude: 114.484472 };
    try {
      const setting = await Taro.getSetting();
      const authorized = !!setting?.authSetting?.["scope.userLocation"];

      if (authorized) {
        const loc = await Taro.getLocation({ type: "gcj02" });
        const hasSelection = !!(this.state.startPoint || this.state.endPoint);
        if (!hasSelection) {
          this.setState(
            { latitude: loc.latitude, longitude: loc.longitude },
            () => {
              this.loadFreight();
            }
          );
        } else {
          // 已有用户选择的中心点，不覆盖，只加载货运数据
          this.loadFreight();
        }
      } else {
        try {
          await Taro.authorize({ scope: "scope.userLocation" });
          const loc = await Taro.getLocation({ type: "gcj02" });
          const hasSelection = !!(this.state.startPoint || this.state.endPoint);
          if (!hasSelection) {
            this.setState(
              { latitude: loc.latitude, longitude: loc.longitude },
              () => {
                this.loadFreight();
              }
            );
          } else {
            this.loadFreight();
          }
        } catch (e) {
          // 用户拒绝授权或环境不支持，使用默认中心点
          const hasSelection = !!(this.state.startPoint || this.state.endPoint);
          if (!hasSelection) {
            this.setState(
              {
                latitude: defaultCenter.latitude,
                longitude: defaultCenter.longitude,
              },
              () => {
                this.loadFreight();
              }
            );
          } else {
            this.loadFreight();
          }
          Taro.showToast({
            title: "已使用默认中心点",
            icon: "none",
            duration: 2000,
          });
        }
      }
    } catch (err) {
      // 兜底：任何异常均使用默认中心点
      const hasSelection = !!(this.state.startPoint || this.state.endPoint);
      if (!hasSelection) {
        this.setState(
          {
            latitude: defaultCenter.latitude,
            longitude: defaultCenter.longitude,
          },
          () => {
            this.loadFreight();
          }
        );
      } else {
        this.loadFreight();
      }
      console.warn("定位权限申请或获取失败，使用默认中心点：", err);
    }
  }

  /**
   * 加载附近车源与货源，并绘制到地图
   */
  loadFreight = async () => {
    try {
      const { latitude, longitude, scale } = this.state;
      const res = await fetchFreight({ latitude, longitude }, scale);

      console.log("加载货运数据成功：", res);

      const vehicleMarkers: Marker[] = res.vehicles.map((v) => {
        return {
          id: v.id,
          latitude: v.location.latitude,
          longitude: v.location.longitude,
          iconPath: getVehicleIcon(v.model),
          width: 36,
          height: 36,
          baseWidth: 36,
          baseHeight: 36,
          alpha: 1,
          category: "vehicle",
          vehicleModel: v.model,
          // customCallout: { display: 'BYCLICK', anchorX: 0, anchorY: -48 },
          joinCluster: true,
          callout: {
            content: `${v.model} | ${v.brand}\n${v.length}米 | 载重${
              v.load
            }t\n司机:${v.owner} | ${v.available ? "可用" : "不可用"}`,
            color: "#333",
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            bgColor: "#fff",
            display: "BYCLICK",
          },
        };
      });

      const cargoMarkers: Marker[] = res.cargos.map((c) => {
        const rateText =
          c.type === "整车" ? `¥${c.freightRate}` : `¥${c.freightRate}/kg`;
        const statusText =
          c.status === "pending"
            ? "待接单"
            : c.status === "in_transit"
            ? "运输中"
            : "已完成";
        return {
          id: c.id,
          latitude: c.location.latitude,
          longitude: c.location.longitude,
          iconPath: getCargoIcon(c.type),
          width: 34,
          height: 34,
          baseWidth: 34,
          baseHeight: 34,
          alpha: 1,
          category: "cargo",
          cargoType: c.type,
          // customCallout: { display: 'BYCLICK', anchorX: 0, anchorY: -48 },
          joinCluster: true,
          callout: {
            content: `${c.type} | ${c.cargoInfo.type}\n运价:${rateText} | ${statusText}\n重量:${c.cargoInfo.weight}t | 体积:${c.cargoInfo.volume}m³`,
            color: "#333",
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            bgColor: "#fff",
            display: "BYCLICK",
          },
        };
      });

      this.setState({ markers: [...vehicleMarkers, ...cargoMarkers] });
    } catch (err) {
      console.warn("加载货运数据失败：", err);
      Taro.showToast({ title: "加载货运数据失败", icon: "none" });
    }
  };

  // 顶部菜单点击：只控制大小和透明度（不改变数据源）
  handlePrimaryMenuClick = (primary: "vehicle" | "cargo") => {
    this.setState({ activePrimary: primary }, () => {
      const { markers } = this.state;
      const updated = markers.map((m) => {
        const isVehicle = m.category === "vehicle";
        const isCargo = m.category === "cargo";
        const enlarge = (mw?: number, mh?: number) => {
          const bw = m.baseWidth || mw || m.width || 32;
          const bh = m.baseHeight || mh || m.height || 32;
          return {
            width: Math.round(bw * 1.5),
            height: Math.round(bh * 1.5),
            alpha: 1,
          };
        };
        const reset = () => ({
          width: m.baseWidth || m.width,
          height: m.baseHeight || m.height,
          alpha: 0.5,
        });

        if (primary === "cargo") {
          if (isCargo) return { ...m, ...enlarge(34, 34) };
          if (isVehicle) return { ...m, ...reset() };
        } else if (primary === "vehicle") {
          if (isVehicle) return { ...m, ...enlarge(36, 36) };
          if (isCargo) return { ...m, ...reset() };
        }
        return m;
      });
      this.setState({ markers: updated });
    });
  };

  // 选择二级菜单：该分类中匹配类型的标记放大，其余恢复默认大小 + 50%透明
  handleSelectSubmenu = (
    category: "vehicle" | "cargo",
    key: VehicleModel | CargoType
  ) => {
    this.setState(
      {
        activePrimary: category,
        selectedVehicle:
          category === "vehicle"
            ? (key as VehicleModel)
            : this.state.selectedVehicle,
        selectedCargo:
          category === "cargo" ? (key as CargoType) : this.state.selectedCargo,
      },
      () => {
        const { markers } = this.state;
        const updated = markers.map((m) => {
          const bw = m.baseWidth || m.width || 32;
          const bh = m.baseHeight || m.height || 32;
          const match =
            category === "vehicle"
              ? m.category === "vehicle" && m.vehicleModel === key
              : m.category === "cargo" && m.cargoType === key;
          if (match) {
            return {
              ...m,
              width: Math.round(bw * 1.5),
              height: Math.round(bh * 1.5),
              alpha: 1,
            };
          }
          // 其他所有标记恢复为原始大小，并降低透明度
          return { ...m, width: bw, height: bh, alpha: 0.5 };
        });
        this.setState({ markers: updated });
      }
    );
  };

  // 隐藏二级菜单
  handleHideMenu = () => {
    this.setState({ activePrimary: null });
  };

  onMapTap = (address: string, latitude: number, longitude: number) => {
    // 点击地图时隐藏二级菜单
    this.handleHideMenu();
  };

  clearMarkers = () => {
    this.setState({ markers: [] });
  };

  onMarkerTap = (e: any) => {
    console.log("点击标记:", e);
  };

  // 修改为：位置名称、经度、纬度
  setAsStart = (name: string, longitude: number, latitude: number) => {
    console.log("设置为起点:", name, "经度:", longitude, "纬度:", latitude);
    // 保留 centerPoint，仅隐藏按钮组
    this.setState(
      { startPoint: { name, longitude, latitude }, showCenterActions: false },
      () => {
        const hasStart = !!(
          this.state.startPoint?.latitude && this.state.startPoint?.longitude
        );
        const hasEnd = !!(
          this.state.endPoint?.latitude && this.state.endPoint?.longitude
        );
        const hasBoth = hasStart && hasEnd;
        this.setState({ showRoute: hasBoth, routeTriggerKey: hasBoth ? Date.now() : this.state.routeTriggerKey });
      }
    );
  };

  setAsEnd = (name: string, longitude: number, latitude: number) => {
    console.log("设置为终点:", name, "经度:", longitude, "纬度:", latitude);
    // 保留 centerPoint，仅隐藏按钮组
    this.setState(
      { endPoint: { name, longitude, latitude }, showCenterActions: false },
      () => {
        const hasStart = !!(
          this.state.startPoint?.latitude && this.state.startPoint?.longitude
        );
        const hasEnd = !!(
          this.state.endPoint?.latitude && this.state.endPoint?.longitude
        );
        const hasBoth = hasStart && hasEnd;
        this.setState({ showRoute: hasBoth, routeTriggerKey: hasBoth ? Date.now() : this.state.routeTriggerKey });
      }
    );
  };

  // 地图中心更新（拖动结束回传）回调
  onCenterUpdate = (name: string, latitude: number, longitude: number) => {
    // 更新中心点并显示按钮组（拖动结束）
    this.setState({ centerPoint: { name, latitude, longitude }, showCenterActions: true });
  };

  // 地图拖动状态变化（begin/end）
  onDraggingChange = (dragging: boolean) => {
    // 拖动开始：隐藏按钮组；拖动结束：不直接显示，等待 onCenterUpdate 更新中心点后再显示
    if (dragging) {
      this.setState({ isDraggingCenter: true, showCenterActions: false });
    } else {
      this.setState({ isDraggingCenter: false });
    }
  };

  // 移除自动路径规划的逻辑，改为仅在按钮点击后触发（通过 routeTriggerKey）

  // 左侧竖排按钮点击
  handleSidebarClick = (
    type: "车源" | "货源" | "发货" | "运单" | "我的" | "询价"
  ) => {
    // 保持按钮选中态
    this.setState({ activeSidebar: type });
    console.log("点击左侧按钮：", type);

    // 车源/货源按钮需要展开子菜单与地图标记联动
    if (type === "车源") {
      this.handlePrimaryMenuClick("vehicle");
      this.setState({ activePrimary: "vehicle" });
    } else if (type === "货源") {
      this.handlePrimaryMenuClick("cargo");
      this.setState({ activePrimary: "cargo" });
    } else {
      // 点击发货、运单、我的、询价按钮时，如果车源或货源的二级菜单正在显示，则隐藏
      if (this.state.activePrimary !== null) {
        this.handleHideMenu();
      }
      // 发货：跳转到发货表单页面，并在已选择起终点时进行预填
      if (type === "发货") {
        if (this.navigating) return;
        this.navigating = true;
        const { startPoint, endPoint } = this.state;
        const params = `originName=${encodeURIComponent(startPoint?.name || "")}&destinationName=${encodeURIComponent(endPoint?.name || "")}`;
        Taro.navigateTo({ url: `/pages/shipping/index?${params}` })
          .finally(() => {
            this.navigating = false;
          });
        return;
      }
      // 运单：跳转到运单列表页面
      if (type === "运单") {
        Taro.navigateTo({ url: "/pages/orders/index" });
        return;
      }
      // 我的：跳转到我的页面
      if (type === "我的") {
        Taro.navigateTo({ url: "/pages/my/index" });
        return;
      }
      // 其他按钮保持原提示
      Taro.showToast({ title: `${type}`, icon: "none", duration: 1000 });
    }
  };

  // 底部选择框点击
  handleSelectPoint = (type: "start" | "end") => {
    // 获取当前已选择的地点信息，用作搜索页面的初始关键词
    const currentPoint =
      type === "start" ? this.state.startPoint : this.state.endPoint;
    const keywords = currentPoint?.name || "";

    // 跳转到搜索地点页面，传递搜索类型和初始关键词
    Taro.navigateTo({
      url: `/pages/search-location/index?type=${type}&keywords=${encodeURIComponent(
        keywords
      )}&city=北京`,
    });
  };

  // 高德地图功能相关方法

  /**
   * 路径规划完成回调
   */
  onRouteCalculated = (routeInfo: RouteInfo) => {
    console.log("路径规划结果:", routeInfo);
    // 保存到首页状态，便于固定面板展示
    // 一旦路径规划完成：隐藏中心点标记与起终点设置按钮
    this.setState({ routeInfo, showCenterActions: false, isDraggingCenter: false });
  };

  render() {
    const {
      latitude,
      longitude,
      scale,
      markers,
      showRoute,
      routeMode,
      enableCluster,
      clusterOptions,
      activePrimary,
      selectedVehicle,
      selectedCargo,
      startPoint,
      endPoint,
    } = this.state;

    // 起点与终点均已选择时，显示发货按钮
    const canShip = Boolean(
      startPoint?.latitude &&
      startPoint?.longitude &&
      endPoint?.latitude &&
      endPoint?.longitude
    );

    return (
      <View className="index">
        {/* <MapBackground
          latitude={latitude}
          longitude={longitude}
          scale={scale}
          markers={markers}
          // 高德地图功能配置
          showRoute={showRoute}
          routeMode={routeMode}
          routeTriggerKey={this.state.routeTriggerKey}
          // 起终点标记（由首页管理），用于自动触发路径规划
          startMarker={
            startPoint?.latitude && startPoint?.longitude
              ? {
                  id: -101,
                  latitude: startPoint.latitude!,
                  longitude: startPoint.longitude!,
                  iconPath: startIcon,
                  width: 32,
                  height: 32,
                }
              : undefined
          }
          endMarker={
            endPoint?.latitude && endPoint?.longitude
              ? {
                  id: -102,
                  latitude: endPoint.latitude!,
                  longitude: endPoint.longitude!,
                  iconPath: endIcon,
                  width: 32,
                  height: 32,
                }
              : undefined
          }
          // 点聚合配置
          enableCluster={enableCluster}
          clusterOptions={clusterOptions}
          // 事件回调
          onMapTap={this.onMapTap}
          onMarkerTap={this.onMarkerTap}
          // 不再使用组件内气泡设置起终点，改为首页按钮组
          onCenterUpdate={this.onCenterUpdate}
          onDraggingChange={this.onDraggingChange}
          // 默认隐藏中心标记；仅在拖动中或按钮组可见时显示
          showCenterMarker={(this.state.isDraggingCenter || this.state.showCenterActions) && !this.state.showRoute}
          onRouteCalculated={this.onRouteCalculated}
        /> */}

        {/* 路线信息固定面板：显示距离与时间（位于右上角） */}
        <View
          className={`route-info ${showRoute && this.state.routeInfo ? "visible" : "hidden"}`}
        >
          <View className="route-row">
            <View className="route-label">距离</View>
            <View className="route-value">{this.state.routeInfo?.distance || "-"}</View>
          </View>
          <View className="route-row">
            <View className="route-label">时间</View>
            <View className="route-value">{this.state.routeInfo?.duration || "-"}</View>
          </View>
        </View>

        {/* 子菜单组件（隐藏主按钮，仅在左侧主按钮点击后展示） */}
        <SourceMenus
          vehicleOptions={[
            { key: "小面", label: "小面", icon: getVehicleIcon("小面") },
            { key: "中面", label: "中面", icon: getVehicleIcon("中面") },
            { key: "大面", label: "大面", icon: getVehicleIcon("大面") },
            { key: "单排", label: "单排", icon: getVehicleIcon("单排") },
            { key: "4.2", label: "4.2", icon: getVehicleIcon("4.2") },
            { key: "6.8", label: "6.8", icon: getVehicleIcon("6.8") },
            { key: "9.6", label: "9.6", icon: getVehicleIcon("9.6") },
            { key: "13", label: "13", icon: getVehicleIcon("13") },
            { key: "17.5", label: "17.5", icon: getVehicleIcon("17.5") },
          ]}
          cargoOptions={[
            { key: "整车", label: "整车", icon: getCargoIcon("整车") },
            { key: "零单", label: "零单", icon: getCargoIcon("零单") },
          ]}
          selectedVehicle={selectedVehicle}
          selectedCargo={selectedCargo}
          hidePrimary
          openMenu={activePrimary || null}
          onSelectVehicle={(m) => this.handleSelectSubmenu("vehicle", m)}
          onSelectCargo={(t) => this.handleSelectSubmenu("cargo", t)}
          onHideMenu={this.handleHideMenu}
        />

        {/* 覆盖在地图上内容 */}
        {/* 左侧竖排功能按钮：半透明背景容器内统一布局，文字在图标下方，支持选中态 */}
        <View className="left-sidebar">
          <View className="sidebar-group">
            {/* 车源按钮（保持原样式），点击展开子菜单并联动地图 */}
            <View
              className={`sidebar-item ${
                this.state.activeSidebar === "车源" ? "active" : ""
              }`}
              onClick={() => this.handleSidebarClick("车源")}
            >
              <View className="item-icon">
                {selectedVehicle ? (
                  <Image
                    className="item-icon-img"
                    src={getVehicleIcon(selectedVehicle)}
                    mode="aspectFit"
                  />
                ) : (
                  "🚚"
                )}
              </View>
              <View className="item-text">{selectedVehicle || "车源"}</View>
            </View>
            {/* 货源按钮（保持原样式），点击展开子菜单并联动地图 */}
            <View
              className={`sidebar-item ${
                this.state.activeSidebar === "货源" ? "active" : ""
              }`}
              onClick={() => this.handleSidebarClick("货源")}
            >
              <View className="item-icon">
                {selectedCargo ? (
                  <Image
                    className="item-icon-img"
                    src={getCargoIcon(selectedCargo)}
                    mode="aspectFit"
                  />
                ) : (
                  "📦"
                )}
              </View>
              <View className="item-text">{selectedCargo || "货源"}</View>
            </View>
            <View
              className={`sidebar-item ${
                this.state.activeSidebar === "发货" ? "active" : ""
              }`}
              onClick={() => this.handleSidebarClick("发货")}
            >
              <View className="item-icon">📤</View>
              <View className="item-text">发货</View>
            </View>
            <View
              className={`sidebar-item ${
                this.state.activeSidebar === "运单" ? "active" : ""
              }`}
              onClick={() => this.handleSidebarClick("运单")}
            >
              <View className="item-icon">🧾</View>
              <View className="item-text">运单</View>
            </View>
            <View
              className={`sidebar-item ${
                this.state.activeSidebar === "我的" ? "active" : ""
              }`}
              onClick={() => this.handleSidebarClick("我的")}
            >
              <View className="item-icon">👤</View>
              <View className="item-text">我的</View>
            </View>
            <Button
              className={`sidebar-item ${
                this.state.activeSidebar === "询价" ? "active" : ""
              }`}
              openType="contact"
              sessionFrom={JSON.stringify({
                from: "首页询价",
                vehicle: selectedVehicle || "",
                cargo: selectedCargo || "",
                start: startPoint?.name || "",
                end: endPoint?.name || "",
              })}
              onClick={() => this.setState({ activeSidebar: "询价" })}
            >
              <View className="item-icon">💬</View>
            </Button>
          </View>
        </View>

        {/* 设置起点/终点按钮组（位于起终点选择卡片上方） */}
        <View
          className={`center-actions ${
            this.state.centerPoint && !this.state.isDraggingCenter && this.state.showCenterActions && !this.state.showRoute
              ? "visible"
              : "hidden"
          }`}
        >
          <View
            className={`center-btn ${this.state.centerPoint ? "" : "disabled"}`}
            onTap={() =>
              this.state.centerPoint &&
              this.setAsStart(
                this.state.centerPoint.name || "",
                this.state.centerPoint.longitude!,
                this.state.centerPoint.latitude!
              )
            }
            onClick={() =>
              this.state.centerPoint &&
              this.setAsStart(
                this.state.centerPoint.name || "",
                this.state.centerPoint.longitude!,
                this.state.centerPoint.latitude!
              )
            }
          >
            设置起点
          </View>
          <View
            className={`center-btn alt ${this.state.centerPoint ? "" : "disabled"}`}
            onTap={() =>
              this.state.centerPoint &&
              this.setAsEnd(
                this.state.centerPoint.name || "",
                this.state.centerPoint.longitude!,
                this.state.centerPoint.latitude!
              )
            }
            onClick={() =>
              this.state.centerPoint &&
              this.setAsEnd(
                this.state.centerPoint.name || "",
                this.state.centerPoint.longitude!,
                this.state.centerPoint.latitude!
              )
            }
          >
            设置终点
          </View>
        </View>

        {/* 底部起终点选择框 */}
        <View className="bottom-selector">
          <View className="selector-card">
            <View
              className="selector-row"
              onClick={() => this.handleSelectPoint("start")}
            >
              <View className="selector-icon">起</View>
              <View className="selector-content">
                <View className="selector-title">
                  {this.state.startPoint?.name || "请选择起点"}
                </View>
                <View className="selector-subtitle">
                  {this.state.startPoint?.longitude?.toFixed(6) || "经度"}，
                  {this.state.startPoint?.latitude?.toFixed(6) || "纬度"}
                </View>
              </View>
            </View>

            <View className="divider" />

            <View
              className="selector-row"
              onClick={() => this.handleSelectPoint("end")}
            >
              <View className="selector-icon alt">终</View>
              <View className="selector-content">
                <View className="selector-title alt">
                  {this.state.endPoint?.name || "请选择终点"}
                </View>
                <View className="selector-subtitle alt">
                  {this.state.endPoint?.longitude?.toFixed(6) || "经度"}，
                  {this.state.endPoint?.latitude?.toFixed(6) || "纬度"}
                </View>
              </View>
            </View>
          </View>

          {/* 当起点与终点都有值时，底部显示发货按钮（带自然过渡） */}
          <View className={`ship-action ${canShip ? "visible" : ""}`}>
            <View
              className="selector-action"
              onClick={this.handleShip}
            >
              发货
            </View>
          </View>
        </View>
      </View>
    );
  }

  // 发货按钮点击处理（可根据业务需要替换为实际跳转逻辑）
  handleShip = () => {
    if (this.navigating) return;
    const { startPoint, endPoint } = this.state;
    const valid = Boolean(
      startPoint?.latitude &&
      startPoint?.longitude &&
      endPoint?.latitude &&
      endPoint?.longitude
    );
    if (!valid) {
      Taro.showToast({ title: "请先选择起点和终点", icon: "none" });
      return;
    }
    // 跳转到发货表单页面，并预填发货地/目的地
    this.navigating = true;
    const params = `originName=${encodeURIComponent(startPoint?.name || "")}&destinationName=${encodeURIComponent(endPoint?.name || "")}`;
    Taro.navigateTo({ url: `/pages/shipping/index?${params}` })
      .finally(() => {
        this.navigating = false;
      });
  };
}
