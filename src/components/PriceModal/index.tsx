import { View, Text } from '@tarojs/components'
import './index.scss'

export type PlanType = 'single' | 'monthly' | 'annual'

interface PriceModalProps {
  visible: boolean
  onSelect: (plan: PlanType) => void
  onCancel: () => void
}

export default function PriceModal(props: PriceModalProps) {
  const { visible, onSelect, onCancel } = props
  return (
    <>
      <View className={`priceMask ${visible ? 'show' : ''}`} onClick={onCancel}></View>
      <View className={`priceModal ${visible ? 'show' : ''}`}>
        <Text className="priceTitle">选择价格方案</Text>
        <View className="priceOptions">
          <View className={`priceOption single`} onClick={() => onSelect('single')}>
            <Text className="planName">单次</Text>
            <Text className="amount">¥10</Text>
            <Text className="desc">一次性发布本次货源</Text>
          </View>
          <View className={`priceOption monthly`} onClick={() => onSelect('monthly')}>
            <View className="badge">热门</View>
            <Text className="planName">月费</Text>
            <Text className="amount">¥180</Text>
            <Text className="desc">30天内不限次发布</Text>
          </View>
          <View className={`priceOption annual`} onClick={() => onSelect('annual')}>
            <View className="badge">推荐</View>
            <Text className="planName">年费</Text>
            <Text className="amount">¥800</Text>
            <Text className="desc">365天内不限次发布</Text>
          </View>
        </View>
        <View
          className="priceCancel"
          hoverClass="btnHover"
          hoverStartTime={20}
          hoverStayTime={80}
          onClick={onCancel}
        >
          取消
        </View>
      </View>
    </>
  )
}