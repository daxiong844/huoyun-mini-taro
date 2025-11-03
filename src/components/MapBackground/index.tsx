import { FC, useEffect, useState, useCallback, useRef } from "react";
import { Map, CoverView, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { amapService } from "../../services/amap";
import "./index.scss";

// 标记点类型定义
type Marker = {
  id: number;
  latitude: number;
  longitude: number;
  iconPath?: string;
  width?: number;
  height?: number;
  baseWidth?: number; // 记录原始宽度，便于放大/还原
  baseHeight?: number; // 记录原始高度，便于放大/还原
  alpha?: number; // 0~1 透明度（Weapp Map 支持）
  anchor?: { x: number; y: number };
  callout?: any;
  customCallout?: any;
  label?: any; // 微信小程序原生 label（用于显示中心位置名称等）
  joinCluster?: boolean; // 是否参与点聚合
  address?: string; // 地址信息
  // 业务分类与类型（用于筛选和风格控制）
  category?: "vehicle" | "cargo" | "other";
  vehicleModel?:
    | "小面"
    | "中面"
    | "大面"
    | "单排"
    | "4.2"
    | "6.8"
    | "9.6"
    | "13"
    | "17.5";
  cargoType?: "整车" | "零单";
};

// 路径规划结果类型
type RouteInfo = {
  distance: string;
  duration: string;
  polyline: any[];
  steps?: any[];
};

// 组件Props类型定义
type Props = {
  latitude: number;
  longitude: number;
  scale?: number;
  markers: Marker[];
  // 是否显示地图中心标记（默认显示）；用于首页控制初次加载时隐藏中心标记
  showCenterMarker?: boolean;
  // 起终点标记支持以对象形式单独传入
  startMarker?: Marker;
  endMarker?: Marker;
  // 路径规划相关
  showRoute?: boolean; // 是否显示路径
  routeMode?: "driving" | "walking" | "bicycling"; // 路径规划模式
  polyline?: any[]; // 路径折线数据
  // 路径规划触发键（仅在首页点击“设置起点/终点”时更新，用于触发计算）
  routeTriggerKey?: number;
  // 定位相关
  enableLocationSearch?: boolean; // 是否启用位置搜索
  // 事件回调
  onMapTap?: (address: string, latitude: number, longitude: number) => void;
  onMarkerTap?: (e: any) => void;
  onSetStart?: (name: string, longitude: number, latitude: number) => void;
  onSetEnd?: (name: string, longitude: number, latitude: number) => void;
  onRouteCalculated?: (routeInfo: RouteInfo) => void; // 路径计算完成回调
  onLocationSearch?: (keyword: string) => void; // 位置搜索回调
  // 在定位“我的位置”后，通知父组件追加该标记
  onAddMyLocationMarker?: (marker: Marker) => void;
  // 地图拖动结束，通知中心点位置（名称、经纬度）回传首页
  onCenterUpdate?: (name: string, latitude: number, longitude: number) => void;
  // 地图拖动状态变化：begin -> true，end -> false
  onDraggingChange?: (dragging: boolean) => void;

  // 点聚合
  enableCluster?: boolean; // 启用点聚合
  clusterOptions?: {
    enableDefaultStyle?: boolean;
    zoomOnClick?: boolean;
    gridSize?: number;
  };
  onClusterClick?: (e: any) => void;
  onClusterCreate?: (e: any) => void; // 使用自定义聚合样式时触发
};

const MapBackground: FC<Props> = ({
  latitude,
  longitude,
  scale = 14,
  markers,
  showCenterMarker = true,
  startMarker,
  endMarker,
  showRoute = false,
  routeMode = "driving",
  polyline = [],
  routeTriggerKey,
  enableLocationSearch = false,
  onMapTap,
  onMarkerTap,
  onSetStart,
  onSetEnd,
  onRouteCalculated,
  onLocationSearch,
  onAddMyLocationMarker,
  onCenterUpdate,
  onDraggingChange,
  enableCluster = true,
  clusterOptions,
  onClusterClick,
  onClusterCreate,
}) => {
  const mapId = "mapBackground";
  const mapCtxRef = useRef<any>(null);
  // 状态管理
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [myLocationMarker, setMyLocationMarker] = useState<Marker | null>(null);
  // 点击地图位置后的标记（固定 id -2）
  const [tappedLocationMarker, setTappedLocationMarker] =
    useState<Marker | null>(null);
  // 拖动状态与中心位置名称（用于覆盖层显示）
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [centerLocationName, setCenterLocationName] = useState<string>("");
  const [composedMarkers, setComposedMarkers] = useState<Marker[]>([]);

  /**
   * 路径规划功能
   * 根据起点和终点计算路径
   */
  const calculateRoute = useCallback(async () => {
    if (!startMarker || !endMarker || !showRoute) return;

    // 优先使用 props 传入的起终点标记，其次兼容旧逻辑从 markers 中按 id 查找
    const startM = startMarker;
    const endM = endMarker;
    if (!startM || !endM) return;

    try {
      const origin = `${startM.longitude},${startM.latitude}`;
      const destination = `${endM.longitude},${endM.latitude}`;

      let routeResult;

      // 根据模式选择不同的路径规划API
      switch (routeMode) {
        case "walking":
          routeResult = await amapService.getWalkingRoute({
            origin,
            destination,
          });
          break;
        case "bicycling":
          routeResult = await amapService.getBicyclingRoute({
            origin,
            destination,
          });
          break;
        case "driving":
        default:
          routeResult = await amapService.getDrivingRoute({
            origin,
            destination,
            show_fields:"polyline"
          });
          break;
      }

      // 兼容当前 AmapService 返回结构：{ status: 'success', paths: [...], ... }
      if (routeResult?.status === "success" && Array.isArray(routeResult.paths) && routeResult.paths.length > 0) {
        const path = routeResult.paths[0];

        // 将步骤中的 polyline 字符串转换为微信小程序 Map 组件可用的 points 数组
        // polyline 示例："lng,lat;lng,lat;..."
        const points: { latitude: number; longitude: number }[] = [];
        try {
          (path.steps || []).forEach((step: any) => {
            const seg = String(step.polyline || "");
            const coords = seg.split(";").filter(Boolean);
            coords.forEach((c) => {
              const [lngStr, latStr] = c.split(",");
              const lng = parseFloat(lngStr);
              const lat = parseFloat(latStr);
              if (!isNaN(lng) && !isNaN(lat)) {
                points.push({ longitude: lng, latitude: lat });
              }
            });
          });
        } catch (e) {
          console.warn("polyline 解析失败：", e);
        }

        const routeData: RouteInfo = {
          distance: path.distanceText || String(path.distance || 0),
          duration: path.durationText || String(path.duration || 0),
          polyline: [
            {
              points,
              color: "#3B7CFF",
              width: 6,
              dottedLine: false,
              arrowLine: true,
            },
          ],
          steps: path.steps || [],
        };

        setRouteInfo(routeData);
        onRouteCalculated?.(routeData);
      } else {
        throw new Error("路径规划失败");
      }
    } catch (error) {
      console.error("路径规划错误:", error);
      Taro.showToast({
        title: "路径规划失败，请重试",
        icon: "error",
      });
    } finally {
      console.log("路径规划完成");
    }
  }, [
    startMarker,
    endMarker,
    markers,
    showRoute,
    routeMode,
    onRouteCalculated,
  ]);

  // 仅在首页点击“设置起点/终点”时触发路径规划：通过 routeTriggerKey 变化驱动
  // 注意：startMarker/endMarker 是在父组件 render 中根据条件新建对象，引用每次 render 都会变化，
  // 如果把它们放到依赖中会导致 useEffect 每次渲染都触发，从而不断请求路径规划接口。
  // 同理，calculateRoute 的引用也会因为其依赖发生变化而重建，放入依赖会导致重复执行。
  // 因此，这里仅监听 routeTriggerKey，避免由于对象引用变化造成的重复请求。
  useEffect(() => {
    if (routeTriggerKey && showRoute && startMarker && endMarker) {
      calculateRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeTriggerKey]);

  /**
   * 地址解析：输入经纬度，返回地址信息（字符串）。
   * @param lat 纬度
   * @param lng 经度
   * @returns Promise<string | null> 地址字符串，失败或未开启解析返回 null
   */
  async function fetchAddressByCoords(
    lat: number,
    lng: number
  ): Promise<string | null> {
    try {
      const location = `${lng},${lat}`;
      const result = await amapService.reverseGeocode({ location });
      if (result && result.address) {
        return result.address;
      }
    } catch (error) {
      console.error("地址解析错误:", error);
    }
    return null;
  }

  /**
   * 规范化地址显示：去掉省份和城市信息，仅保留区/县及之后的详细地址
   * 处理示例：
   * - "浙江省杭州市西湖区文三路xxx" => "西湖区文三路xxx"
   * - "北京市海淀区中关村大街xxx" => "海淀区中关村大街xxx"
   * - "内蒙古自治区呼和浩特市赛罕区xxx" => "赛罕区xxx"
   * - "中国上海市浦东新区世纪大道xxx" => "浦东新区世纪大道xxx"
   */
  function stripProvinceCity(address?: string | null): string {
    if (!address) return "";
    let s = address.trim();
    // 去掉前缀“中国”
    s = s.replace(/^中国/, "");
    // 第一次：去掉省级（省/自治区/特别行政区/直辖市）
    s = s.replace(/^(?:.*?(?:省|自治区|特别行政区|市))/, "");
    // 第二次：去掉地市级（市/地区/盟/自治州）
    s = s.replace(/^(?:.*?(?:市|地区|盟|自治州))/, "");
    return s.trim();
  }

  /**
   * 坐标定位功能
   * 将地图中心移动到指定坐标
   */
  const moveToLocation = useCallback(
    (lat: number, lng: number, newScale?: number) => {
      // 这里可以通过父组件传递的回调来更新地图中心
      // 或者使用 Taro 的地图 API 来实现
      try {
        const ctx = mapCtxRef.current;
        if (ctx && typeof ctx.moveToLocation === "function") {
          // 微信基础库 >= 2.13.0 支持传入经纬度
          ctx.moveToLocation({ latitude: lat, longitude: lng });
        }
      } catch (err) {
        console.warn("moveToLocation 调用失败：", err);
      }
    },
    [scale]
  );

  /**
   * “我的位置”按钮：请求定位权限，定位到当前位置并设置标记
   */
  const handleLocateMyPosition = useCallback(async () => {
    console.log("点击了“我的位置”按钮");
    try {
      const setting = await Taro.getSetting();
      const authorized = !!setting?.authSetting?.["scope.userLocation"];

      if (!authorized) {
        try {
          await Taro.authorize({ scope: "scope.userLocation" });
        } catch (e) {
          Taro.showToast({ title: "用户未授权获取位置", icon: "none" });
          return;
        }
      }

      const loc = await Taro.getLocation({
        type: "gcj02",
        isHighAccuracy: true,
      });
      const { latitude: lat, longitude: lng } = loc;

      // 移动地图中心到当前位置；不再添加“我的位置”标记
      moveToLocation(lat, lng);
      // 清除已有的“我的位置”标记（如果存在）
      setMyLocationMarker(null);
    } catch (err) {
      console.warn("定位失败：", err);
      Taro.showToast({ title: "定位失败，请重试", icon: "none" });
    }
  }, [fetchAddressByCoords, moveToLocation]);

  // 监听标记点变化，合并父组件传入的标记、起终点标记以及“我的位置”标记
  useEffect(() => {
    const composed: Marker[] = [
      ...markers,
      ...(startMarker ? [startMarker] : []),
      ...(endMarker ? [endMarker] : []),
      // 移除“我的位置”标记以满足“仅居中不加标记”的需求
      ...(tappedLocationMarker ? [tappedLocationMarker] : []),
    ];
    setComposedMarkers(composed);
  }, [markers, startMarker, endMarker, tappedLocationMarker]);

  // 当标记点数据变化时，只添加标记到聚合
  useEffect(() => {
    // 过滤出需要聚合的标记点：只有joinCluster为true的标记点
    const joinClusterMarkers = markers.filter(
      (marker) => marker.joinCluster === true
    );
    console.log("需要聚合的标记点:", joinClusterMarkers);
    if (joinClusterMarkers.length > 0) {
      // 延迟添加标记，确保聚合已初始化
      const timer = setTimeout(() => {
        addMarkers(joinClusterMarkers);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [markers]);

  /**
   * 向地图添加标记点
   * @param {Array} newMarkers - 新的标记点数组
   */
  const addMarkers = async (newMarkers) => {
    try {
      // 创建 MapContext
      if (!mapCtxRef.current) {
        try {
          mapCtxRef.current = Taro.createMapContext(mapId);
        } catch (err) {
          console.warn("createMapContext 失败：", err);
        }
      }
      const mapContext = mapCtxRef.current;
      if (!mapContext) return;
      if (mapContext) {
        console.log("添加点聚合标记点，数量:", newMarkers.length);
        await mapContext.addMarkers({
          markers: newMarkers,
          clear: true, // 清空现有标记
          success: (res) => {
            console.log("点聚合添加成功:", res);
          },
          fail: (err) => {
            console.error("点聚合添加失败:", err);
          },
          complete: () => {
            console.log("点聚合添加完成");
          },
        });
      }
    } catch (error) {
      console.error("添加标记点异常:", error);
    }
  };

  // 初始化 MapContext 并设置点聚合
  useEffect(() => {
    // 创建 MapContext
    if (!mapCtxRef.current) {
      try {
        mapCtxRef.current = Taro.createMapContext(mapId);
      } catch (err) {
        console.warn("createMapContext 失败：", err);
      }
    }

    const ctx = mapCtxRef.current;
    if (!ctx) return;

    if (enableCluster) {
      const {
        enableDefaultStyle = true,
        zoomOnClick = true,
        gridSize = 60,
      } = clusterOptions || {};
      // 初始化聚合配置
      try {
        ctx.initMarkerCluster({
          enableDefaultStyle,
          zoomOnClick,
          gridSize,
          complete: () => {
            console.log("initMarkerCluster 完成");
          },
          success: () => {
            console.log("initMarkerCluster 成功");
          },
          fail: (err: any) => {
            console.warn("initMarkerCluster 调用失败：", err);
          },
        });
      } catch (err) {
        console.warn("initMarkerCluster 调用失败：", err);
      }

      // 事件绑定：聚合点点击
      try {
        ctx.on &&
          ctx.on("markerClusterClick", (e: any) => {
            onClusterClick && onClusterClick(e);
          });
      } catch (err) {}
    }
  }, [enableCluster, clusterOptions, onClusterClick, onClusterCreate]);

  /**
   * 地图区域变化（拖动/缩放）事件：
   * - begin：隐藏中心标记
   * - end：根据当前中心坐标创建中心标记，并为其设置 label 显示位置名称
   */
  const handleRegionChange = useCallback(async (e: any) => {
    const type = e?.detail?.type || e?.type;
    if (type === "begin") {
      // 拖动开始：隐藏 label，但保留中心覆盖标记
      setIsDragging(true);
      setCenterLocationName("");
      onDraggingChange?.(true);
      return;
    }

    if (type === "end") {
      try {
        // 确保 MapContext 可用
        if (!mapCtxRef.current) {
          try {
            mapCtxRef.current = Taro.createMapContext(mapId);
          } catch (err) {
            console.warn("createMapContext 失败：", err);
          }
        }
        const ctx = mapCtxRef.current;
        if (!ctx || typeof ctx.getCenterLocation !== "function") {
          setIsDragging(false);
          return;
        }

        // 获取当前中心点坐标
        const center = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
          try {
            ctx.getCenterLocation({
              success: (res: any) => resolve({ latitude: res.latitude, longitude: res.longitude }),
              fail: (err: any) => reject(err),
            });
          } catch (err) {
            reject(err);
          }
        });

        const { latitude: lat, longitude: lng } = center;
        // 解析中心点位置名称
        const name = await fetchAddressByCoords(lat, lng);
        const displayName = stripProvinceCity(name);
        setCenterLocationName(displayName || "当前位置");
        // 回传首页
        onCenterUpdate?.(displayName || "", lat, lng);
      } catch (error) {
        console.warn("获取中心位置失败：", error);
      } finally {
        setIsDragging(false);
        onDraggingChange?.(false);
      }
    }
  }, []);

  /**
   * 地图点击事件：在点击位置添加一个固定 id 为 -2 的标记，并解析位置名称
   * 然后将名称与经纬度通过 onMapTap 回传给父组件
   */
  const handleMapTap = useCallback(
    async (e: any) => {
      const { latitude: lat, longitude: lng } = e?.detail || {};
      if (typeof lat !== "number" || typeof lng !== "number") return;

      // // 解析地址名称
      // const name = await fetchAddressByCoords(lat, lng);

      // // 添加（或更新）点击位置标记，固定 id 为 -2
      // const clickMarker: Marker = {
      //   id: -2,
      //   latitude: lat,
      //   longitude: lng,
      //   //   iconPath: '/assets/marker-default.png',
      //   width: 32,
      //   height: 32,
      //   address: name || undefined,
      //   customCallout: {
      //     display: "ALWAYS",
      //     anchorX: 0,
      //     anchorY: 0,
      //   },
      // };
      // setTappedLocationMarker(clickMarker);

      // 将点击位置的名称与经纬度回传父组件
      // onMapTap?.(name || "", lat, lng);
    },
    [onMapTap]
  );

  return (
    <View className="map-container">
      <Map
        id={mapId}
        onError={() => {}}
        className="map"
        latitude={latitude}
        longitude={longitude}
        scale={scale}
        markers={composedMarkers.map(({ address, ...m }) => ({
          // Weapp marker 必填字段确保类型兼容
          id: m.id,
          latitude: m.latitude,
          longitude: m.longitude,
          iconPath:
            m.iconPath ||
            "https://img.icons8.com/emoji/48/round-pushpin-emoji.png",
          width: m.width || 32,
          height: m.height || 32,
          ...(typeof m.alpha === "number" ? { alpha: m.alpha } : {}),
          // 参与点聚合：仅当标记本身包含 joinCluster 时才加入聚合
          ...(m.joinCluster ? { joinCluster: true } : {}),
          // 兼容自定义气泡（Weapp 支持 customCallout），默认点击才显示
          customCallout: m.customCallout
            ? {
                anchorY: m.customCallout?.anchorY ?? -48, // 气泡向上偏移
                anchorX: m.customCallout?.anchorX ?? 0, // 气泡水平居中
                display: m.customCallout?.display ?? "BYCLICK",
              }
            : undefined,
          // 透传原有的 callout（如果存在）
          ...(m.callout ? { callout: m.callout } : {}),
          // 透传原生 label（Weapp 支持），用于中心位置名称展示
          ...(m.label ? { label: m.label } : {}),
        }))}
        polyline={showRoute && routeInfo ? routeInfo.polyline : polyline}
        showLocation
        onTap={handleMapTap}
        onMarkerTap={onMarkerTap}
        onRegionChange={handleRegionChange}
      >
        {/* 地图中心覆盖标记：受 showCenterMarker 控制；拖动时仅隐藏标签 */}
        {showCenterMarker && (
          <CoverView className="center-marker">
            <CoverView className="center-marker-icon">📍</CoverView>
            {!isDragging && !!centerLocationName && (
              <CoverView className="center-marker-label">
                {centerLocationName}
              </CoverView>
            )}
          </CoverView>
        )}
        <CoverView slot="callout">
          {composedMarkers
            .filter((m) => m.customCallout)
            .map((m) => (
              <CoverView
                key={`callout-${m.id}`}
                markerId={m.id}
                className="custom-callout"
              >
                {/* 显示地址信息 */}
                {m.address && (
                  <CoverView className="address">{m.address}</CoverView>
                )}
              </CoverView>
            ))}
        </CoverView>
      </Map>

      {/* 我的位置按钮（放在地图外部，覆盖在地图右侧） */}
      <View
        className="my-location-btn"
        onTap={handleLocateMyPosition}
        onClick={handleLocateMyPosition}
      >
        <View className="icon">📍</View>
      </View>
    </View>
  );
};

// 导出组件和相关类型
export default MapBackground;
export type { Marker, RouteInfo, Props as MapBackgroundProps };
