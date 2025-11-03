import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtInput, AtButton, AtSegmentedControl, AtLoadMore } from 'taro-ui'
import { api } from '../../api'
import PriceModal, { PlanType } from '../../components/PriceModal'
import './index.scss'

type OrderStatus = '待支付' | '待接单' | '待装货' | '在途中' | '已完成' | '已取消'

interface OrderItem {
  id: number
  cargoName?: string
  origin?: string
  destination?: string
  price?: number
  pricingUnit?: string
  weight?: number
  weightUnit?: string
  volume?: number
  volumeUnit?: string
  status: OrderStatus
  createdAt?: number
  paidAt?: number
  plan?: PlanType
  loadDate?: string | number
  unloadDate?: string | number
}

const STATUS_LABELS: OrderStatus[] = ['待支付', '待接单', '待装货', '在途中', '已完成', '已取消']

export default function OrdersPage() {
  const [keyword, setKeyword] = useState('')
  const [statusIndex, setStatusIndex] = useState(0)
  const status = STATUS_LABELS[statusIndex]

  const [list, setList] = useState<OrderItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [priceVisible, setPriceVisible] = useState(false)
  const [currentPayId, setCurrentPayId] = useState<number | null>(null)

  const STATUS_CLASS_MAP: Record<OrderStatus, string> = {
    '待支付': 'status-unpaid',
    '待接单': 'status-wait',
    '待装货': 'status-loading',
    '在途中': 'status-transit',
    '已完成': 'status-done',
    '已取消': 'status-cancel',
  }

  const formatDateTime = (v?: string | number) => {
    if (!v && v !== 0) return '-'
    if (typeof v === 'number') {
      const d = new Date(v)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${y}-${m}-${dd} ${hh}:${mm}`
    }
    return String(v)
  }

  const fetchList = async (reset = false) => {
    setLoading(true)
    try {
      const res: any = await api.get('/shipping/orders', { query: { keyword, status, page: reset ? 1 : page, pageSize } })
      const data: OrderItem[] = res?.data || []
      const newList = reset ? data : [...list, ...data]
      setList(newList)
      setTotal(res?.total || newList.length)
      if (reset) setPage(1)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchList(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusIndex])

  useDidShow(() => {
    fetchList(true)
  })

  const onSearchConfirm = () => {
    fetchList(true)
  }

  const onLoadMore = async () => {
    if (list.length >= total) return
    setPage(page + 1)
    setTimeout(() => fetchList(false), 0)
  }

  const openPay = (id: number) => {
    setCurrentPayId(id)
    setPriceVisible(true)
  }

  const onSelectPlan = async (plan: PlanType) => {
    if (!currentPayId) return
    try {
      await api.post('/shipping/orders/pay', { body: { id: currentPayId, plan } })
      Taro.showToast({ title: '支付成功', icon: 'success' })
      setPriceVisible(false)
      setCurrentPayId(null)
      fetchList(true)
    } catch (e) {
      Taro.showToast({ title: '支付失败', icon: 'none' })
    }
  }

  const onCancelModal = () => {
    setPriceVisible(false)
    setCurrentPayId(null)
  }

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  }

  // 文本截断：最多 7 个字符，超过用 ..
  const clipText = (s?: string, max = 18) => {
    const str = (s || '').trim()
    if (!str) return '-'
    return str.length > max ? `${str.slice(0, max - 2)}..` : str
  }

  const copyOrderNo = (id: number) => {
    Taro.setClipboardData({ data: String(id) })
      .then(() => Taro.showToast({ title: '订单号已复制', icon: 'none' }))
  }

  const viewLogistics = (id: number) => {
    // 预留：跳转到物流跟踪页面
    Taro.showToast({ title: '物流跟踪即将上线', icon: 'none' })
  }

  const cancelOrder = async (id: number) => {
    try {
      const res: any = await api.post('/shipping/orders/cancel', { body: { id } })
      if (res?.ok) {
        Taro.showToast({ title: '已取消订单', icon: 'none' })
        fetchList(true)
      } else {
        Taro.showToast({ title: res?.error || '取消失败', icon: 'none' })
      }
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '取消失败', icon: 'none' })
    }
  }

  return (
    <View className="orders-page">
      <View className="orders-hero">
        <Text className="hero-title">我的运单</Text>
        <Text className="hero-subtitle">查询、支付、查看详情，一步到位</Text>
      </View>

      <View className="filters">
        <View className="filter-row">
          <View className="filter-left">
            <AtInput
              name="keyword"
              title="关键词"
              type="text"
              placeholder="货物名/起点/终点"
              value={keyword}
              onChange={(v) => setKeyword(String(v))}
              onConfirm={onSearchConfirm}
            />
          </View>
          <View className="filter-right">
            <AtButton type="primary" onClick={onSearchConfirm}>搜索</AtButton>
          </View>
        </View>
        <View className="seg-row">
          <AtSegmentedControl
            values={STATUS_LABELS}
            current={statusIndex}
            onClick={(idx) => setStatusIndex(idx)}
          />
        </View>
      </View>

      <View className="orders-list">
        {list.map((item) => (
          <View key={item.id} className="order-card" onClick={() => goDetail(item.id)}>
            {/* 顶部订单号 */}
            <View className="order-meta">
              <Text className="meta-label">运单号：</Text>
              <Text className="meta-value">{item.id}</Text>
              <Text className="copy-btn" onClick={(e) => { (e as any)?.stopPropagation?.(); copyOrderNo(item.id); }}>复制</Text>
            </View>

            {/* 站点与状态 */}
            <View className="order-main">
              <View className="station left">
                <Text className="station-title">{clipText(item.origin)}</Text>
              </View>
              <View className="status-center">
                <Text className="status-arrow">➜</Text>
                <Text className={`status-chip ${STATUS_CLASS_MAP[item.status]}`}>{item.status}</Text>
              </View>
              <View className="station right">
                <Text className="station-title">{clipText(item.destination)}</Text>
              </View>
            </View>

            {/* 摘要信息块（使用实际运单字段） */}
            <View className="summary">
              <View className="summary-item">
                <Text className="label">计价单位</Text>
                <Text className="value">{item.pricingUnit || '—'}</Text>
              </View>
              <View className="summary-item">
                <Text className="label">重量</Text>
                <Text className="value">{item.weight != null ? `${item.weight}${item.weightUnit || ''}` : '—'}</Text>
              </View>
              <View className="summary-item">
                <Text className="label">方数</Text>
                <Text className="value">{item.volume != null ? `${item.volume}${item.volumeUnit || ''}` : '—'}</Text>
              </View>
            </View>

            {/* 底部操作 */}
            <View className="order-actions">
              <View className="actions-left" />
              <View className="actions-right">
                <AtButton size="small" type="primary" className="action-btn" onClick={(e) => { (e as any)?.stopPropagation?.(); goDetail(item.id); }}>订单详情</AtButton>
                {item.status === '待支付' && (
                  <AtButton size="small" type="primary" className="action-btn pay-btn" onClick={(e) => { (e as any)?.stopPropagation?.(); openPay(item.id); }}>支付</AtButton>
                )}
                {(item.status === '待支付' || item.status === '待接单' || item.status === '待装货') && (
                  <AtButton size="small" className="action-btn" onClick={(e) => { (e as any)?.stopPropagation?.(); cancelOrder(item.id); }}>取消订单</AtButton>
                )}
              </View>
            </View>
          </View>
        ))}

        <View className="load-more">
          <AtLoadMore
            status={loading ? 'loading' : (list.length >= total ? 'noMore' : 'more')}
            onClick={onLoadMore}
          />
        </View>
      </View>

      {/* 公用价格弹窗 */}
      <PriceModal visible={priceVisible} onSelect={onSelectPlan} onCancel={onCancelModal} />
    </View>
  )
}