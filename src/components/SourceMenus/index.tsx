import { FC, useState, useMemo, useEffect, useRef } from "react";
import { View, Image } from "@tarojs/components";
import "./index.scss";

export type VehicleModel =
  | "小面"
  | "中面"
  | "大面"
  | "单排"
  | "4.2"
  | "6.8"
  | "9.6"
  | "13"
  | "17.5";
export type CargoType = "整车" | "零单";

type Option<T extends string> = {
  key: T;
  label: string;
  icon: string;
};

type Props = {
  vehicleOptions: Option<VehicleModel>[];
  cargoOptions: Option<CargoType>[];
  selectedVehicle?: VehicleModel;
  selectedCargo?: CargoType;
  onPrimaryClick?: (primary: "vehicle" | "cargo") => void;
  onSelectVehicle?: (model: VehicleModel) => void;
  onSelectCargo?: (type: CargoType) => void;
  // 当需要与外部按钮（如左侧栏）保持一致样式时，可隐藏自身主按钮，仅展示子菜单
  hidePrimary?: boolean;
  // 由外部控制当前展开的菜单（vehicle/cargo），当 hidePrimary 为 true 时生效
  openMenu?: null | "vehicle" | "cargo";
  // 隐藏菜单的回调函数
  onHideMenu?: () => void;
};

const SourceMenus: FC<Props> = ({
  vehicleOptions,
  cargoOptions,
  selectedVehicle,
  selectedCargo,
  onPrimaryClick,
  onSelectVehicle,
  onSelectCargo,
  hidePrimary,
  openMenu,
  onHideMenu,
}) => {
  const [internalOpen, setInternalOpen] = useState<null | "vehicle" | "cargo">(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const vehiclePrimary = useMemo(() => {
    if (!selectedVehicle) return { icon: "🚚", label: "车源" };
    const opt = vehicleOptions.find((o) => o.key === selectedVehicle);
    return { icon: opt?.icon || "🚚", label: opt?.label || selectedVehicle };
  }, [selectedVehicle, vehicleOptions]);

  const cargoPrimary = useMemo(() => {
    if (!selectedCargo) return { icon: "📦", label: "货源" };
    const opt = cargoOptions.find((o) => o.key === selectedCargo);
    return { icon: opt?.icon || "📦", label: opt?.label || selectedCargo };
  }, [selectedCargo, cargoOptions]);

  const effectiveOpen =
    typeof openMenu === "undefined" ? internalOpen : openMenu;

  const toggleMenu = (which: "vehicle" | "cargo") => {
    const next = effectiveOpen === which ? null : which;
    setInternalOpen(next);
    onPrimaryClick?.(which);
  };

  return (
    <View className="source-menus" ref={containerRef}>
      {/* 主按钮区域（可隐藏） */}
      {!hidePrimary && (
        <View className="primary-row">
          <View
            className="primary-btn"
            onTap={() => toggleMenu("vehicle")}
            onClick={() => toggleMenu("vehicle")}
          >
            <Image
              className="primary-icon"
              src={vehiclePrimary.icon}
              mode="aspectFit"
            />
            <View className="primary-text">{vehiclePrimary.label}</View>
          </View>
          {effectiveOpen === "vehicle" && (
            <View className="submenu-card">
              <View className="submenu-header">选择车型</View>
              <View className="submenu-list">
                {vehicleOptions.map((opt) => (
                  <View
                    key={`veh_${opt.key}`}
                    className={`submenu-item ${
                      selectedVehicle === opt.key ? "selected" : ""
                    }`}
                    onTap={() => {
                      onSelectVehicle?.(opt.key);
                      onHideMenu?.();
                    }}
                    onClick={() => {
                      onSelectVehicle?.(opt.key);
                      onHideMenu?.();
                    }}
                  >
                    <Image
                      className="submenu-icon"
                      src={opt.icon}
                      mode="aspectFit"
                    />
                    <View className="submenu-text">{opt.label}</View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View
            className="primary-btn"
            onTap={() => toggleMenu("cargo")}
            onClick={() => toggleMenu("cargo")}
          >
            <Image
              className="primary-icon"
              src={cargoPrimary.icon}
              mode="aspectFit"
            />
            <View className="primary-text">{cargoPrimary.label}</View>
          </View>
          {effectiveOpen === "cargo" && (
            <View className="submenu-card">
              <View className="submenu-header">选择货源</View>
              <View className="submenu-list">
                {cargoOptions.map((opt) => (
                  <View
                    key={`cargo_${opt.key}`}
                    className={`submenu-item ${
                      selectedCargo === opt.key ? "selected" : ""
                    }`}
                    onTap={() => {
                      onSelectCargo?.(opt.key);
                      onHideMenu?.();
                    }}
                    onClick={() => {
                      onSelectCargo?.(opt.key);
                      onHideMenu?.();
                    }}
                  >
                    <Image
                      className="submenu-icon"
                      src={opt.icon}
                      mode="aspectFit"
                    />
                    <View className="submenu-text">{opt.label}</View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 仅展示子菜单（与外部主按钮配合），竖排卡片，显示在一级菜单右边 */}
      {hidePrimary && effectiveOpen === "vehicle" && (
        <View className="submenu-card vehicle">
          <View className="submenu-header">选择车型</View>
          <View className="submenu-list vehicle-grid">
            {vehicleOptions.map((opt) => (
              <View
                key={`veh_${opt.key}`}
                className={`submenu-item ${
                  selectedVehicle === opt.key ? "selected" : ""
                }`}
                onTap={() => {
                  onSelectVehicle?.(opt.key);
                  onHideMenu?.();
                }}
                onClick={() => {
                  onSelectVehicle?.(opt.key);
                  onHideMenu?.();
                }}
              >
                <Image
                  className="submenu-icon"
                  src={opt.icon}
                  mode="aspectFit"
                />
                <View className="submenu-text">{opt.label}</View>
              </View>
            ))}
          </View>
        </View>
      )}

      {hidePrimary && effectiveOpen === "cargo" && (
        <View className="submenu-card">
          <View className="submenu-header">选择货源</View>
          <View className="submenu-list cargo-column">
            {cargoOptions.map((opt) => (
              <View
                key={`cargo_${opt.key}`}
                className={`submenu-item ${
                  selectedCargo === opt.key ? "selected" : ""
                }`}
                onTap={() => {
                  onSelectCargo?.(opt.key);
                  onHideMenu?.();
                }}
                onClick={() => {
                  onSelectCargo?.(opt.key);
                  onHideMenu?.();
                }}
              >
                <Image
                  className="submenu-icon"
                  src={opt.icon}
                  mode="aspectFit"
                />
                <View className="submenu-text">{opt.label}</View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default SourceMenus;
