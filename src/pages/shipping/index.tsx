import { useState } from "react";
import Taro, { useLoad, useDidShow } from "@tarojs/taro";
import { View, Text, Picker } from "@tarojs/components";
import { AtInput, AtButton, AtList, AtListItem, AtSteps } from "taro-ui";
import TimeSheet from "../../components/TimeSheet";
import "./index.scss";
import { api } from "../../api";
import PriceModal from "../../components/PriceModal";

type CargoType = "整车" | "零单";
type WeightUnit = "吨" | "千克";
type VolumeUnit = "m³" | "立方米";
type PricingUnit = "元/趟" | "元/吨";

export default function ShippingForm() {
  const [cargoType, setCargoType] = useState<CargoType>("整车");
  const [cargoTypeIndex, setCargoTypeIndex] = useState(0);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loadDate, setLoadDate] = useState("");
  const [unloadDate, setUnloadDate] = useState("");
  const [cargoName, setCargoName] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("吨");
  const [volume, setVolume] = useState<string>("");
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>("m³");
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>("元/趟");
  const [price, setPrice] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  // 价格弹窗与提交订单 ID
  const [pricePopupVisible, setPricePopupVisible] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);
  // 经纬度（由搜索页选择后填充）
  const [originLongitude, setOriginLongitude] = useState<number | null>(null);
  const [originLatitude, setOriginLatitude] = useState<number | null>(null);
  const [destinationLongitude, setDestinationLongitude] = useState<
    number | null
  >(null);
  const [destinationLatitude, setDestinationLatitude] = useState<number | null>(
    null
  );

  // —— AI 推荐运价：车型选择与计算状态 ——
  type VehicleType = "mini" | "4.2" | "6.8" | "9.6" | "13" | "17.5";
  const vehicleTypeOptions: { key: VehicleType; label: string }[] = [
    { key: "mini", label: "小车(2.7-3.8米)" },
    { key: "4.2", label: "4.2米" },
    { key: "6.8", label: "6.8米" },
    { key: "9.6", label: "9.6米" },
    { key: "13", label: "13米" },
    { key: "17.5", label: "17.5米" },
  ];
  const [vehicleTypeIndex, setVehicleTypeIndex] = useState<number>(0);
  const [vehicleType, setVehicleType] = useState<VehicleType>("mini");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [aiQuoteLoading, setAiQuoteLoading] = useState<boolean>(false);
  const [aiQuotePrice, setAiQuotePrice] = useState<number | null>(null);
  const [aiQuoteNote, setAiQuoteNote] = useState<string>("");

  // 预填充起终点（如果从首页传入），并对可能的 URL 编码进行解码
  useLoad((options) => {
    const safeDecode = (v: any) => {
      if (v === undefined || v === null) return "";
      try {
        return decodeURIComponent(String(v));
      } catch {
        return String(v);
      }
    };
    if (options?.originName) setOrigin(safeDecode(options.originName));
    if (options?.destinationName)
      setDestination(safeDecode(options.destinationName));
  });

  // 计算两点之间的大圆距离（单位：公里）
  const haversineDistanceKm = (
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
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(1);
  };

  // 向后端（mock）请求 AI 推荐运价
  const requestAiQuote = async () => {
    // 至少需要起终点名称与车型；经纬度可选（没有则由后端使用默认里程）
    if (!origin || !destination || !vehicleType) {
      return;
    }
    // 计算里程（若坐标完整），否则由后端兜底
    let km: number | null = null;
    if (
      originLatitude !== null &&
      originLongitude !== null &&
      destinationLatitude !== null &&
      destinationLongitude !== null
    ) {
      km = haversineDistanceKm(
        originLatitude,
        originLongitude,
        destinationLatitude,
        destinationLongitude
      );
      setDistanceKm(km);
    } else {
      setDistanceKm(null);
    }
    setAiQuoteLoading(true);
    setAiQuoteNote("");
    try {
      const res = await api.post<{ ok: boolean; data?: any; error?: string }>(
        "/pricing/quote",
        {
          body: {
            distanceKm: km,
            originName: origin,
            originLongitude,
            originLatitude,
            destinationName: destination,
            destinationLongitude,
            destinationLatitude,
            vehicleType,
            cargoName,
            weight: weight ? Number(weight) : null,
            volume: volume ? Number(volume) : null,
          },
        }
      );
      if (res && (res as any).ok) {
        const data = (res as any).data || {};
        setAiQuotePrice(Number(data.price) || null);
        setAiQuoteNote(
          data.note || "AI 推荐价，基于车型、里程、货重与方数等估算"
        );
      } else {
        setAiQuotePrice(null);
        setAiQuoteNote((res as any)?.error || "无法获取推荐运价");
      }
    } catch (e: any) {
      setAiQuotePrice(null);
      setAiQuoteNote(e?.message || "获取推荐运价失败");
    } finally {
      setAiQuoteLoading(false);
    }
  };

  const cargoTypeOptions: CargoType[] = ["整车", "零单"]; // 内部值
  const uiCargoTypeOptions: string[] = ["整车", "零单"]; // 显示文案
  const weightUnitOptions: WeightUnit[] = ["吨", "千克"];
  const volumeUnitOptions: VolumeUnit[] = ["m³", "立方米"];
  const pricingUnitOptions: PricingUnit[] = ["元/趟", "元/吨"];

  const steps = [{ title: "" }, { title: "" }, { title: "" }];
  // 时间选择浮层开关与目标（抽离为组件）
  const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false);
  const [timeSheetTarget, setTimeSheetTarget] = useState<"load" | "unload">(
    "load"
  );
  const openTimeSheet = (target: "load" | "unload") => {
    setTimeSheetTarget(target);
    setIsTimeSheetOpen(true);
  };
  const handleConfirmTimeSheet = (value: string) => {
    if (timeSheetTarget === "load") setLoadDate(value);
    else setUnloadDate(value);
    setIsTimeSheetOpen(false);
  };

  // 选择地点并跳转到搜索页
  const handleSelectLocation = (type: "start" | "end") => {
    const keywords = type === "start" ? origin : destination;
    const url = `/pages/search-location/index?type=${type}&keywords=${encodeURIComponent(
      keywords || ""
    )}`;
    Taro.navigateTo({ url });
  };

  // 从搜索页返回后读取选中地点（名称 + 经纬度）
  useDidShow(() => {
    const app = Taro.getApp<{ globalData: any }>();
    const selected: any = app?.globalData?.selectedLocation;
    const toNum = (v: any) =>
      v === undefined || v === null || v === "" ? null : Number(v);
    if (selected && selected.type) {
      if (selected.type === "start") {
        setOrigin(selected.name || "");
        setOriginLongitude(toNum(selected.longitude));
        setOriginLatitude(toNum(selected.latitude));
      } else if (selected.type === "end") {
        setDestination(selected.name || "");
        setDestinationLongitude(toNum(selected.longitude));
        setDestinationLatitude(toNum(selected.latitude));
      }
      // 读取后清空，避免重复赋值
      if (app?.globalData) app.globalData.selectedLocation = undefined;
      // 地址选择完成后，延迟触发一次 AI 推荐运价（等待坐标 setState 完成）
      setTimeout(() => {
        requestAiQuote();
      }, 0);
    }
  });

  const handleSubmit = async () => {
    // 简单校验
    if (!origin || !destination) {
      Taro.showToast({ title: "请填写发货地和目的地", icon: "none" });
      return;
    }
    if (!loadDate || !unloadDate) {
      Taro.showToast({ title: "请填写装卸时间", icon: "none" });
      return;
    }
    if (!cargoName) {
      Taro.showToast({ title: "请填写货物名称", icon: "none" });
      return;
    }
    if (!weight) {
      Taro.showToast({ title: "请填写重量", icon: "none" });
      return;
    }
    if (!volume) {
      Taro.showToast({ title: "请填写方数", icon: "none" });
      return;
    }
    if (!price) {
      Taro.showToast({ title: "请填写运价", icon: "none" });
      return;
    }

    // 提交数据（此处仅演示）
    const payload = {
      cargoType,
      origin,
      destination,
      loadDate,
      unloadDate,
      cargoName,
      weight: Number(weight),
      weightUnit,
      volume: Number(volume),
      volumeUnit,
      pricingUnit,
      price: Number(price),
      originLongitude,
      originLatitude,
      destinationLongitude,
      destinationLatitude,
    };

    try {
      const res = await api.post<{ ok: boolean; data?: any; error?: string }>(
        "/shipping/orders",
        { body: payload }
      );
      if (res && (res as any).ok) {
        const data = (res as any).data || {}
        setSubmittedOrderId(data.id ?? null);
        setPricePopupVisible(true);
        Taro.showToast({ title: "已保存至本地（未支付）", icon: "success" });
      } else {
        const msg = (res as any)?.error || "提交失败";
        Taro.showToast({ title: msg, icon: "none" });
      }
    } catch (e: any) {
      Taro.showToast({ title: e?.message || "提交失败", icon: "none" });
    }
  };

  // 价格方案选择：无论用户选择哪个方案，都视为支付成功，修改状态并回到首页
  const handlePriceSelection = async (plan: "single" | "monthly" | "annual") => {
    if (!submittedOrderId) {
      // 无订单 ID，直接回首页
      Taro.reLaunch({ url: "/pages/index/index" });
      return;
    }
    try {
      const res = await api.post<{ ok: boolean }>("/shipping/orders/pay", {
        body: { id: submittedOrderId, plan },
      });
      if ((res as any)?.ok) {
        Taro.showToast({ title: "支付成功", icon: "success" });
      }
    } catch (e) {}
    setPricePopupVisible(false);
    Taro.reLaunch({ url: "/pages/index/index" });
  };

  // 取消与遮罩点击：直接回到首页
  const handlePriceCancel = () => {
    setPricePopupVisible(false);
    Taro.reLaunch({ url: "/pages/index/index" });
  };

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!origin || !destination) {
        Taro.showToast({ title: "请填写装货地与卸货地", icon: "none" });
        return false;
      }
      if (!loadDate || !unloadDate) {
        Taro.showToast({ title: "请填写装卸时间", icon: "none" });
        return false;
      }
    }
    if (stepIndex === 1) {
      if (!cargoName) {
        Taro.showToast({ title: "请填写货物名称", icon: "none" });
        return false;
      }
      if (!weight) {
        Taro.showToast({ title: "请填写重量", icon: "none" });
        return false;
      }
      if (!volume) {
        Taro.showToast({ title: "请填写方数", icon: "none" });
        return false;
      }
      if (!price) {
        Taro.showToast({ title: "请填写运价", icon: "none" });
        return false;
      }
    }
    return true;
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };
  const handleNext = () => {
    // 校验当前步骤，成功后进入下一步
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
  };

  return (
    <View className="shipping-page">
      {/* 顶部横幅 */}
      <View className="shipping-hero">
        <View className="hero-title">填写发货信息，快速匹配优质运力</View>
      </View>

      {/* 表单卡片：使用 taro-ui 组件 */}
      <View className="form-card">
        <View className="form-inner">
          {/* 步骤导航 */}
          <View className="form-block">
            <AtSteps
              items={steps}
              current={currentStep}
              onChange={(idx) => setCurrentStep(idx)}
            />
          </View>
          

          {/* 分组一：装卸地与时间 */}
          {currentStep === 0 && (
            <View className="form-group">
              <View className="group-header">
                <Text className="group-title">装卸信息</Text>
              </View>
              {/* 发车类型：单选（参考附件图样式） — 移入分组一 */}
              <View className="form-block">
                <View className="label-radio-inline">
                  <Text className="form-label">发车类型<Text className="required-star">*</Text></Text>
                  <View className="radio-group">
                    {uiCargoTypeOptions.map((opt, idx) => (
                      <View
                        key={opt}
                        className="radio-item"
                        onClick={() => {
                          setCargoTypeIndex(idx);
                          setCargoType(cargoTypeOptions[idx]);
                        }}
                      >
                        <View className={`radio-circle ${cargoTypeIndex === idx ? "checked" : ""}`}>
                          {cargoTypeIndex === idx && <Text className="radio-check">✓</Text>}
                        </View>
                        <Text className="radio-text">{opt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              {/* 装货地/卸货地：点击跳转到搜索页 */}
              
              {/* 装货地/卸货地：点击跳转到搜索页 */}
              <AtList hasBorder={false}>
                <AtListItem
                  title="装货地"
                  extraText={origin || "请选择"}
                  arrow="right"
                  onClick={() => handleSelectLocation("start")}
                />
                <AtListItem
                  title="卸货地"
                  extraText={destination || "请选择"}
                  arrow="right"
                  onClick={() => handleSelectLocation("end")}
                />
              </AtList>

              {/* 装卸时间：使用抽离组件的自定义浮层选择器（左中右布局） */}
              <AtList hasBorder={false}>
                <AtListItem
                  title="装货时间"
                  extraText={loadDate || "请选择时间"}
                  arrow="right"
                  onClick={() => openTimeSheet("load")}
                />
                <AtListItem
                  title="卸货时间"
                  extraText={unloadDate || "请选择时间"}
                  arrow="right"
                  onClick={() => openTimeSheet("unload")}
                />
              </AtList>
            </View>
          )}

          {/* 分组二：货物与体积重量 */}
          {currentStep === 1 && (
            <View className="form-group">
              <View className="group-header">
                <Text className="group-title">货物与体积重量</Text>
              </View>
              {/* 货物名称 */}
              <AtInput
                name="cargoName"
                title="货物名称"
                type="text"
                placeholder="货物名称,例如：建材、蔬菜、电子产品"
                value={cargoName}
                onChange={(val) => {
                  setCargoName(String(val));
                  // 更新货物名称后尝试刷新推荐价
                  if (
                    originLatitude !== null &&
                    originLongitude !== null &&
                    destinationLatitude !== null &&
                    destinationLongitude !== null
                  ) {
                    requestAiQuote();
                  }
                }}
              />

              {/* 重量 + 单位 */}
              <View className="form-row">
                <View className="row-left">
                  <AtInput
                    name="weight"
                    title="重量"
                    type="number"
                    placeholder="请输入重量"
                    value={weight}
                    onChange={(val) => {
                      setWeight(String(val));
                      // 更新重量后尝试刷新推荐价
                      if (
                        originLatitude !== null &&
                        originLongitude !== null &&
                        destinationLatitude !== null &&
                        destinationLongitude !== null
                      ) {
                        requestAiQuote();
                      }
                    }}
                  />
                </View>
                <View className="row-right">
                  <View className="radio-group">
                    {weightUnitOptions.map((u) => (
                      <View
                        key={u}
                        className="radio-item"
                        onClick={() => setWeightUnit(u)}
                      >
                        <View className={`radio-circle ${weightUnit === u ? "checked" : ""}`}>
                          {weightUnit === u && <Text className="radio-check">✓</Text>}
                        </View>
                        <Text className="radio-text">{u}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* 方数（立方米） */}
              <View className="form-row">
                <View className="row-left">
                  <AtInput
                    name="volume"
                    title="方数"
                    type="number"
                    placeholder="请输入方数"
                    value={volume}
                    onChange={(val) => {
                      setVolume(String(val));
                      // 更新方数后尝试刷新推荐价
                      if (
                        originLatitude !== null &&
                        originLongitude !== null &&
                        destinationLatitude !== null &&
                        destinationLongitude !== null
                      ) {
                        requestAiQuote();
                      }
                    }}
                  />
                </View>
                <View className="row-right">
                  <View className="radio-group">
                    {volumeUnitOptions.map((u) => (
                      <View
                        key={u}
                        className="radio-item"
                        onClick={() => setVolumeUnit(u)}
                      >
                        <View className={`radio-circle ${volumeUnit === u ? "checked" : ""}`}>
                          {volumeUnit === u && <Text className="radio-check">✓</Text>}
                        </View>
                        <Text className="radio-text">{u}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              {/* 计价与运价（移入分组二） */}
              <View className="form-block">
                <View className="label-radio-inline">
                  <Text className="form-label">计价单位</Text>
                  <View className="radio-group">
                    {pricingUnitOptions.map((p) => (
                      <View
                        key={p}
                        className="radio-item"
                        onClick={() => setPricingUnit(p)}
                      >
                        <View className={`radio-circle ${pricingUnit === p ? "checked" : ""}`}>
                          {pricingUnit === p && <Text className="radio-check">✓</Text>}
                        </View>
                        <Text className="radio-text">{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <AtInput
                name="price"
                title="运价（元）"
                type="number"
                placeholder="请输入运价（元）"
                value={price}
                onChange={(val) => setPrice(String(val))}
              />

              {/* 车型选择（下拉）：放在 AI 推荐运价前面 */}
              <View className="form-block">
                <Picker
                  mode="selector"
                  range={vehicleTypeOptions.map((o) => o.label)}
                  onChange={(e) => {
                    const idx = Number(e.detail.value);
                    setVehicleTypeIndex(idx);
                    setVehicleType(vehicleTypeOptions[idx].key);
                    // 车型变化时，直接尝试刷新推荐价（坐标缺失时由后端兜底）
                    requestAiQuote();
                  }}
                >
                  <AtList hasBorder={false}>
                    <AtListItem
                      title="车型"
                      extraText={vehicleTypeOptions[vehicleTypeIndex].label}
                      arrow="right"
                    />
                  </AtList>
                </Picker>
              </View>

              {/* AI 推荐运价（表单下方显示，可点击自动填入） */}
              <View className="form-block">
                <View className="ai-quote">
                  {!aiQuoteLoading && aiQuotePrice !== null ? (
                    <View
                      className="ai-row"
                      onClick={() => {
                        setPrice(String(aiQuotePrice));
                        Taro.showToast({ title: "已填入推荐运价", icon: "success" });
                      }}
                    >
                      <Text className="ai-label">AI 推荐运价：</Text>
                      <Text className="ai-value">¥{aiQuotePrice}</Text>
                      <Text className="ai-unit"> 元/趟（点击填入）</Text>
                    </View>
                  ) : (
                    <View className="ai-row">
                      <Text className="ai-label">AI 推荐运价：</Text>
                      <Text className="ai-value">{aiQuoteLoading ? "计算中..." : "待计算"}</Text>
                    </View>
                  )}
                  {!!aiQuoteNote && (
                    <View className="ai-note">
                      <Text>{aiQuoteNote}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 分组三：预览与提交 */}
          {currentStep === 2 && (
            <View className="form-group">
              <View className="group-header">
                <Text className="group-title">预览与提交</Text>
              </View>
              <View className="preview-list">
                <View className="preview-item">
                  <Text>货源类型：</Text>
                  <Text>{cargoType}</Text>
                </View>
                <View className="preview-item">
                  <Text>装货地：</Text>
                  <Text>{origin}</Text>
                </View>
                <View className="preview-item">
                  <Text>卸货地：</Text>
                  <Text>{destination}</Text>
                </View>
                <View className="preview-item">
                  <Text>装货时间：</Text>
                  <Text>{loadDate}</Text>
                </View>
                <View className="preview-item">
                  <Text>卸货时间：</Text>
                  <Text>{unloadDate}</Text>
                </View>
                <View className="preview-item">
                  <Text>货物名称：</Text>
                  <Text>{cargoName}</Text>
                </View>
                <View className="preview-item">
                  <Text>重量：</Text>
                  <Text>
                    {weight} {weightUnit}
                  </Text>
                </View>
                <View className="preview-item">
                  <Text>方数：</Text>
                  <Text>
                    {volume} {volumeUnit}
                  </Text>
                </View>
                <View className="preview-item">
                  <Text>计价单位：</Text>
                  <Text>{pricingUnit}</Text>
                </View>
                <View className="preview-item">
                  <Text>运价：</Text>
                  <Text>{price} 元</Text>
                </View>
              </View>
            </View>
          )}

          {/* 分组四：已移除 */}

          {/* 步骤操作 */}
          <View className="form-actions">
            {currentStep > 0 && (
              <AtButton type="secondary" size="normal" onClick={handlePrev} 
                customStyle={{ marginRight: '16rpx' }}>
                上一步
              </AtButton>
            )}
            {currentStep < steps.length - 1 ? (
              <AtButton
                type="primary"
                className="full-btn"
                circle
                onClick={handleNext}
              >
                下一步
              </AtButton>
            ) : (
              <AtButton
                type="primary"
                className="full-btn"
                circle
                onClick={handleSubmit}
              >
                提交发货
              </AtButton>
            )}
          </View>
        </View>
      </View>
      {/* 价格弹窗（公用组件） */}
      <PriceModal
        visible={pricePopupVisible}
        onSelect={handlePriceSelection}
        onCancel={handlePriceCancel}
      />

      {/* 时间选择浮层组件：左（日期）-中（最早）-右（最晚） */}
      <TimeSheet
        isOpened={isTimeSheetOpen}
        target={timeSheetTarget}
        onClose={() => setIsTimeSheetOpen(false)}
        onConfirm={handleConfirmTimeSheet}
      />
    </View>
  );
}
