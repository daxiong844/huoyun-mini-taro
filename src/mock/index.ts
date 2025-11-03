import { ApiOptions } from '../api/types'
import Taro from '@tarojs/taro'

type MockHandler<T = any> = (options?: ApiOptions) => T | Promise<T>

// 在此注册项目用到的所有 mock 数据（RESTful 风格）
const MOCK_REGISTRY: Record<string, MockHandler> = {
  // 示例：获取系统状态
  'GET /status': () => ({ ok: true, ts: Date.now(), message: 'ok' }),

  // 示例：获取文章列表
  'GET /articles': () => ([
    { id: 1, title: 'Hello Taro1', author: 'System' },
    { id: 2, title: 'Mock & API 统一封装示例', author: 'Assistant' },
  ]),

  // 货运数据：车源与货源（根据地图中心与缩放范围生成附近数据）
  'GET /freight': (options?: ApiOptions) => {
    const q = options?.query || {}
    const centerLat = Number(q.lat) || 38.010232
    const centerLng = Number(q.lng) || 114.484472
    const scale = Number(q.scale) || 14

    // 根据缩放级别动态生成偏移半径（简化模型）：scale 越大，范围越小
    const baseRadiusKm = 50 // 基础半径（公里）
    const radiusKm = Math.max(1, baseRadiusKm / Math.max(5, scale))

    // 经纬度换算（粗略）：1度纬度约等于 111km；经度按纬度修正
    function randomNearby(lat: number, lng: number) {
      const latOffset = (Math.random() - 0.5) * (radiusKm / 111)
      const lngOffset = (Math.random() - 0.5) * (radiusKm / (111 * Math.cos((lat * Math.PI) / 180)))
      return { latitude: +((lat + latOffset).toFixed(6)), longitude: +((lng + lngOffset).toFixed(6)) }
    }

    const vehicleModels = ['小面', '中面', '大面', '单排', '4.2', '6.8', '9.6', '13', '17.5'] as const
    const brands = ['解放', '东风', '重汽', '陕汽', '福田']
    const companies = ['华运物流', '北辰货运', '天行运输', '安达物流']
    const drivers = ['张师傅', '李师傅', '王师傅', '赵师傅']

    const cargoTypes = ['整车', '零单'] as const
    const goodsTypes = ['普货', '冷链', '危化', '大件', '建材', '钢材', '食品', '电子产品']
    const statuses = ['pending', 'in_transit', 'completed'] as const

    const vehicles = Array.from({ length: 8 }).map((_, i) => {
      const model = vehicleModels[Math.floor(Math.random() * vehicleModels.length)]
      const brand = brands[Math.floor(Math.random() * brands.length)]
      const licensePlate = `冀A${String(1000 + Math.floor(Math.random() * 8999))}`
      const location = {
        ...randomNearby(centerLat, centerLng),
        address: `石家庄市区域${i + 1}`
      }
      const availability = Math.random() > 0.3
      
      // 根据车型设置合理的车长和载重
      let length: number, loadCapacity: number
      switch (model) {
        case '小面':
          length = +(2.5 + Math.random() * 1).toFixed(1) // 2.5-3.5米
          loadCapacity = +(0.5 + Math.random() * 1).toFixed(1) // 0.5-1.5吨
          break
        case '中面':
          length = +(3.5 + Math.random() * 1).toFixed(1) // 3.5-4.5米
          loadCapacity = +(1.5 + Math.random() * 1.5).toFixed(1) // 1.5-3吨
          break
        case '大面':
          length = +(4.5 + Math.random() * 1.5).toFixed(1) // 4.5-6米
          loadCapacity = +(3 + Math.random() * 2).toFixed(1) // 3-5吨
          break
        case '单排':
          length = +(3 + Math.random() * 1).toFixed(1) // 3-4米
          loadCapacity = +(1 + Math.random() * 1.5).toFixed(1) // 1-2.5吨
          break
        case '4.2':
          length = 4.2
          loadCapacity = +(2 + Math.random() * 1).toFixed(1) // 2-3吨
          break
        case '6.8':
          length = 6.8
          loadCapacity = +(5 + Math.random() * 3).toFixed(1) // 5-8吨
          break
        case '9.6':
          length = 9.6
          loadCapacity = +(8 + Math.random() * 4).toFixed(1) // 8-12吨
          break
        case '13':
          length = 13
          loadCapacity = +(15 + Math.random() * 10).toFixed(1) // 15-25吨
          break
        case '17.5':
          length = 17.5
          loadCapacity = +(25 + Math.random() * 15).toFixed(1) // 25-40吨
          break
        default:
          length = +(6 + Math.random() * 10).toFixed(1)
          loadCapacity = +(5 + Math.random() * 25).toFixed(1)
      }
      
      const isCompany = Math.random() > 0.5
      const driver = {
        name: drivers[Math.floor(Math.random() * drivers.length)],
        phone: `138${String(10000000 + Math.floor(Math.random() * 89999999))}`,
        company: isCompany ? companies[Math.floor(Math.random() * companies.length)] : undefined
      }
      
      return {
        // 使用整数 ID，避免字符串 ID 与地图组件数值 ID 不兼容
        id: 10000 + (i + 1),
        model,
        brand,
        licensePlate,
        location,
        availability,
        length,
        loadCapacity,
        driver,
      }
    })

    const cargos = Array.from({ length: 10 }).map((_, i) => {
      const type = cargoTypes[Math.floor(Math.random() * cargoTypes.length)]
      const goodsType = goodsTypes[Math.floor(Math.random() * goodsTypes.length)]
      
      const origin = {
        ...randomNearby(centerLat, centerLng),
        address: `起点地址${i + 1}`
      }
      const destination = {
        ...randomNearby(centerLat, centerLng),
        address: `终点地址${i + 1}`
      }
      
      const loadingTime = new Date(Date.now() + Math.floor(Math.random() * 24) * 3600_000).toISOString()
      const unloadingTime = new Date(Date.now() + (24 + Math.floor(Math.random() * 48)) * 3600_000).toISOString()
      
      const cargoInfo = {
        type: goodsType,
        weight: +(1 + Math.random() * 29).toFixed(1), // 1-30吨
        volume: +(5 + Math.random() * 95).toFixed(1), // 5-100立方米
        description: `${goodsType}货物，需要${type === '整车' ? '整车运输' : '零担拼车'}`
      }
      
      const freightRate = type === '整车' 
        ? +(2000 + Math.random() * 8000).toFixed(0) // 整车：2000-10000元
        : +(3 + Math.random() * 7).toFixed(1) // 零单：3-10元/公斤
      
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const location = {
        ...randomNearby(centerLat, centerLng),
        address: `当前位置${i + 1}`
      }
      
      return {
        // 使用整数 ID，且与车辆 ID 保持不同数值段，避免合并列表时产生冲突
        id: 20000 + (i + 1),
        type,
        origin,
        destination,
        loadingTime,
        unloadingTime,
        cargoInfo,
        freightRate,
        status,
        location,
      }
    })

    return { vehicles, cargos }
  },

  // 用户信息：头像、姓名、手机号、微信号、实名认证、会员级别
  'GET /user/profile': () => {
    try {
      const saved = Taro.getStorageSync('user_profile')
      if (saved && typeof saved === 'object') return saved
    } catch {}
    const profile = {
      avatarUrl: '',
      name: '游客',
      phone: '138********',
      wechatId: '',
      verified: false,
      membershipLevel: 'none', // none | monthly | annual
      monthlyPrice: 99,
      annualPrice: 899,
    }
    try { Taro.setStorageSync('user_profile', profile) } catch {}
    return profile
  },

  'POST /user/wechat/bind': (options?: ApiOptions) => {
    const { wechatId } = (options?.body || {}) as { wechatId?: string }
    const profile = Taro.getStorageSync('user_profile') || {}
    const next = { ...profile, wechatId: wechatId || 'wxid_demo_user' }
    Taro.setStorageSync('user_profile', next)
    return { ok: true, data: next }
  },

  'POST /user/verify': () => {
    const profile = Taro.getStorageSync('user_profile') || {}
    const next = { ...profile, verified: true }
    Taro.setStorageSync('user_profile', next)
    return { ok: true, data: next }
  },

  'POST /user/membership/purchase': (options?: ApiOptions) => {
    const { level } = (options?.body || {}) as { level: 'monthly' | 'annual' }
    if (!level) return { ok: false, error: 'missing level' }
    const profile = Taro.getStorageSync('user_profile') || {}
    const next = { ...profile, membershipLevel: level }
    Taro.setStorageSync('user_profile', next)
    return { ok: true, data: next }
  },

  // 合作记录：用于“我的”页面下方展示以及列表页
  'GET /user/cooperations': () => {
    try {
      const saved = Taro.getStorageSync('user_cooperations')
      if (Array.isArray(saved) && saved.length) return saved
    } catch {}
    // 默认生成一些合作记录
    const partners = ['华运物流', '北辰货运', '天行运输', '安达物流', '盛达供应链', '龙腾运输', '星辰物流']
    const projects = ['城市配送', '冷链运输', '危化品运输', '大件运输', '建材运输']
    const driverNames = ['张师傅', '李师傅', '王师傅', '赵师傅', '刘师傅', '陈师傅']
    const vehicleModels = ['小面', '中面', '大面', '单排', '4.2', '6.8', '9.6', '13', '17.5']
    const vehicleBrands = ['解放', '东风', '重汽', '陕汽', '福田', '金杯']
    const licensePlate = () => `冀A${String(1000 + Math.floor(Math.random() * 8999))}`
    const phoneGen = () => `138${String(10000000 + Math.floor(Math.random() * 89999999))}`
    const makeItem = (i: number) => {
      const ts = Date.now() - i * 86400_000
      const amount = +(500 + Math.random() * 9500).toFixed(0)
      const partner = partners[i % partners.length]
      const project = projects[i % projects.length]
      const driverName = driverNames[i % driverNames.length]
      const model = vehicleModels[i % vehicleModels.length]
      const brand = vehicleBrands[i % vehicleBrands.length]
      const plate = licensePlate()
      const driverPhone = phoneGen()
      const coopCount = 1 + Math.floor(Math.random() * 20)
      const lastCoopAt = ts // 最近一次合作时间使用该条记录时间
      return {
        id: 30000 + i,
        partner,
        project,
        date: ts,
        amount,
        summary: `${partner} · ${project}`,
        driverName,
        driverPhone,
        vehicleType: model,
        vehicleBrand: brand,
        licensePlate: plate,
        vehicleInfo: `${brand} ${model} · ${plate}`,
        coopCount,
        lastCoopAt,
      }
    }
    const list = Array.from({ length: 8 }).map((_, i) => makeItem(i + 1))
    try { Taro.setStorageSync('user_cooperations', list) } catch {}
    return list
  },

  // 提交发货：保存到本地 storage，初始支付状态为未支付
  'POST /shipping/orders': async (options?: ApiOptions) => {
    const body = options?.body || {}
    const order = {
      id: Date.now(),
      status: '待支付', // 初始状态：待支付
      createdAt: Date.now(),
      ...body,
    }
    try {
      const existing = Taro.getStorageSync('shipping_orders') || []
      const list = Array.isArray(existing) ? existing : []
      list.push(order)
      Taro.setStorageSync('shipping_orders', list)
      return { ok: true, data: order }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  },

  // 支付：无论选择哪种方案，都将该订单状态改为已支付
  'POST /shipping/orders/pay': async (options?: ApiOptions) => {
    const { id, plan } = (options?.body || {}) as { id: number; plan?: string }
    if (!id) {
      return { ok: false, error: 'missing id' }
    }
    try {
      const existing = Taro.getStorageSync('shipping_orders') || []
      const list = Array.isArray(existing) ? existing : []
      const idx = list.findIndex((o: any) => o.id === id)
      if (idx >= 0) {
        list[idx] = { ...list[idx], status: '待接单', paidAt: Date.now(), plan }
        Taro.setStorageSync('shipping_orders', list)
        return { ok: true, data: list[idx] }
      }
      return { ok: false, error: 'order not found' }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  },

  // 取消订单：将订单状态改为已取消
  'POST /shipping/orders/cancel': async (options?: ApiOptions) => {
    const { id } = (options?.body || {}) as { id: number }
    if (!id) {
      return { ok: false, error: 'missing id' }
    }
    try {
      const existing = Taro.getStorageSync('shipping_orders') || []
      const list = Array.isArray(existing) ? existing : []
      const idx = list.findIndex((o: any) => o.id === id)
      if (idx >= 0) {
        list[idx] = { ...list[idx], status: '已取消' }
        Taro.setStorageSync('shipping_orders', list)
        return { ok: true, data: list[idx] }
      }
      return { ok: false, error: 'order not found' }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  },

  // 获取运单列表：支持关键词模糊查询、状态筛选与分页；也支持通过 id 获取单条
  'GET /shipping/orders': (options?: ApiOptions) => {
    const q = options?.query || {}
    const keyword = String(q.keyword || '').trim()
    const status = String(q.status || '').trim()
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.max(1, Number(q.pageSize) || 10)
    const id = q.id ? Number(q.id) : undefined

    const existing = Taro.getStorageSync('shipping_orders') || []
    let list = Array.isArray(existing) ? existing : []

    // 按 id 精确查询
    if (id) {
      const found = list.find((o: any) => o.id === id)
      return { ok: true, data: found || null }
    }

    // 关键词模糊匹配：货名、起终点、描述
    if (keyword) {
      const kw = keyword.toLowerCase()
      list = list.filter((o: any) => {
        const text = [o.cargoName, o.origin, o.destination, o.description]
          .filter(Boolean)
          .map((s: string) => String(s).toLowerCase())
          .join(' ')
        return text.includes(kw)
      })
    }

    // 状态筛选
    if (status) {
      list = list.filter((o: any) => String(o.status) === status)
    }

    const total = list.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageList = list.slice(start, end)
    return { ok: true, data: pageList, total, page, pageSize }
  },

  // AI 运价推荐：根据车型、里程、货物信息，返回合理建议价格
  'POST /pricing/quote': (options?: ApiOptions) => {
    const body = (options?.body || {}) as {
      distanceKm?: number
      originName?: string
      originLongitude?: number | null
      originLatitude?: number | null
      destinationName?: string
      destinationLongitude?: number | null
      destinationLatitude?: number | null
      vehicleType?: 'mini' | '4.2' | '6.8' | '9.6' | '13' | '17.5'
      cargoName?: string
      weight?: number | null
      volume?: number | null
    }

    // 距离：优先使用 body.distanceKm，其次计算坐标，最后给默认值
    const toNum = (v: any) => v === undefined || v === null ? null : Number(v)
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (d: number) => (d * Math.PI) / 180
      const R = 6371
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return +(R * c).toFixed(1)
    }
    let distanceKm = toNum(body.distanceKm)
    if (!distanceKm && body.originLatitude != null && body.originLongitude != null && body.destinationLatitude != null && body.destinationLongitude != null) {
      distanceKm = haversine(
        Number(body.originLatitude),
        Number(body.originLongitude),
        Number(body.destinationLatitude),
        Number(body.destinationLongitude)
      )
    }
    if (!distanceKm || isNaN(distanceKm)) distanceKm = 50 // 默认给 50km

    // 车型对应每公里价格区间
    const RATE_MAP: Record<string, [number, number]> = {
      mini: [2.1, 2.8],
      '4.2': [2.8, 3.9],
      '6.8': [3.5, 5.0],
      '9.6': [4.4, 6.0],
      '13': [6.5, 7.5],
      '17.5': [8.5, 11.5],
    }
    const vt = body.vehicleType || '4.2'
    const [minRate, maxRate] = RATE_MAP[vt] || RATE_MAP['4.2']
    // 取区间内较合理值（靠近中位），添加轻微随机扰动
    const mid = (minRate + maxRate) / 2
    const jitter = (Math.random() - 0.5) * (maxRate - minRate) * 0.2 // ±10% 区间抖动
    let ratePerKm = +(mid + jitter).toFixed(2)
    // 区域规则：石家庄→河北，优先使用区间中值，避免离谱
    const isShijiazhuangToHebei =
      String(body.originName || '').includes('石家庄') &&
      String(body.destinationName || '').includes('河北')
    if (isShijiazhuangToHebei) {
      ratePerKm = +mid.toFixed(2)
    }

    // 重量/体积轻微加成（保持不离谱）
    let factor = 1.0
    if (body.weight && body.weight > 0) {
      const w = Math.min(50, body.weight)
      factor *= 1 + Math.min(0.15, w / 200) // 最多 +15%
    }
    if (body.volume && body.volume > 0) {
      const v = Math.min(200, body.volume)
      factor *= 1 + Math.min(0.10, v / 500) // 最多 +10%
    }

    const rawPrice = distanceKm * ratePerKm * factor
    // 合理范围校正，避免太离谱
    let price = Math.round(rawPrice)
    // 最低不少于 150 元，最高不超过 50000 元（极端保护）
    price = Math.min(50000, Math.max(150, price))

    return {
      ok: true,
      data: {
        price,
        unit: '元/趟',
        ratePerKm,
        distanceKm,
        note: `AI 推荐价（${vt}车、约${distanceKm}km、单价约¥${ratePerKm}/km）`
      }
    }
  },
}

export function getMockHandler(key: string): MockHandler | undefined {
  return MOCK_REGISTRY[key]
}

export { MOCK_REGISTRY }