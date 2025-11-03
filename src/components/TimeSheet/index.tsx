import { useMemo, useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import { AtFloatLayout, AtButton } from "taro-ui";
import "./index.scss";

type Target = "load" | "unload";

interface TimeSheetProps {
  isOpened: boolean;
  target: Target;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

// 左（日期）-中（最早）-右（最晚）的时间选择浮层
export default function TimeSheet(props: TimeSheetProps) {
  const { isOpened, target, onClose, onConfirm } = props;

  const segments = useMemo(
    () => ["上午(6-12点)", "下午(12-18点)", "晚上(18-24点)"],
    []
  );

  const getDayTabs = (count = 7): string[] => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (i === 0) labels.push("今天");
      else if (i === 1) labels.push("明天");
      else if (i === 2) labels.push("后天");
      else labels.push(`${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    return labels;
  };
  const dayTabs = useMemo(() => getDayTabs(7), []);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [earliestSegmentIndex, setEarliestSegmentIndex] = useState(1);
  const [latestSegmentIndex, setLatestSegmentIndex] = useState(2);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLatestTime, setSelectedLatestTime] = useState<string | null>(null);

  // 切换最晚时间段时，重置已选时间点，避免跨段高亮残留
  useEffect(() => {
    setSelectedLatestTime(null);
  }, [latestSegmentIndex]);

  const getTimesBySegment = (segIndex: number): string[] => {
    if (segIndex === 0) return ["06:00", "08:00", "09:00", "10:00", "11:00"]; // 上午
    if (segIndex === 1) return ["12:00", "14:00", "15:00", "16:00", "17:00", "18:00"]; // 下午
    return ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]; // 晚上
  };

  const handleConfirm = () => {
    const day = dayTabs[selectedDayIndex] || "今天";
    const earliestSeg = segments[earliestSegmentIndex];
    const latestSeg = segments[latestSegmentIndex];
    const earliestText = `${earliestSeg}${selectedTime ? ` ${selectedTime}` : ""}`;
    const latestText = selectedLatestTime ? ` - ${latestSeg} ${selectedLatestTime}` : "";
    const value = `${day} ${earliestText}${latestText}`;
    onConfirm(value);
  };

  return (
    <AtFloatLayout
      isOpened={isOpened}
      title={`选择${target === "load" ? "装货" : "卸货"}时间`}
      onClose={onClose}
      className="ts-float"
    >
      <View className="time-sheet">
        {/* 顶部列标题（固定） */}
        <View className="sheet-header">
          <View className="header-item">日期</View>
          <View className="header-item">最早{target === "load" ? "装货" : "卸货"}</View>
          <View className="header-item">最晚{target === "load" ? "装货" : "卸货"}</View>
        </View>

        {/* 主体（仅日期、时间区域可滚动） */}
        <View className="sheet-body">
          {/* 左：日期列表（滚动） */}
          <View className="pane left-pane">
            <View className="pane-content">
              <View className="day-list">
                {dayTabs.map((d, idx) => (
                  <View
                    key={d}
                    className={`day-item ${selectedDayIndex === idx ? "active" : ""}`}
                    onClick={() => setSelectedDayIndex(idx)}
                  >
                    {d}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 中：最早装货/卸货（时段固定，时间滚动） */}
          <View className="pane mid-pane">
            <View className="segment-row">
              {segments.map((s, i) => (
                <View
                  key={`ear-${i}`}
                  className={`segment-chip ${earliestSegmentIndex === i ? "active" : ""}`}
                  onClick={() => setEarliestSegmentIndex(i)}
                >
                  {s}
                </View>
              ))}
            </View>
            <View className="pane-content">
              <View className="time-list">
                {getTimesBySegment(earliestSegmentIndex).map((t) => (
                  <View
                    key={`t-${t}`}
                    className={`time-item ${selectedTime === t ? "active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 右：最晚装货/卸货（时段固定，时间滚动） */}
          <View className="pane right-pane">
            <View className="segment-row">
              {segments.map((s, i) => (
                <View
                  key={`lat-${i}`}
                  className={`segment-chip ${latestSegmentIndex === i ? "active" : ""}`}
                  onClick={() => setLatestSegmentIndex(i)}
                >
                  {s}
                </View>
              ))}
            </View>
            <View className="pane-content">
              <View className="time-list">
                {getTimesBySegment(latestSegmentIndex).map((t) => (
                  <View
                    key={`tl-${t}`}
                    className={`time-item ${selectedLatestTime === t ? "active" : ""}`}
                    onClick={() => setSelectedLatestTime(t)}
                  >
                    {t}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 底部预览与确认（固定） */}
        <View className="sheet-footer column">
          <View className="preview-text">
            {`${dayTabs[selectedDayIndex]} ${segments[earliestSegmentIndex]}${selectedTime ? ` ${selectedTime}` : ""}${selectedLatestTime ? ` - ${segments[latestSegmentIndex]} ${selectedLatestTime}` : ""} ${target === "load" ? "装货" : "卸货"}`}
          </View>
          <AtButton type="primary" className="full-btn" onClick={handleConfirm}>
            确定
          </AtButton>
        </View>
      </View>
    </AtFloatLayout>
  );
}