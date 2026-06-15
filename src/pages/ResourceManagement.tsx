import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import {
  AlertCircle, CheckCircle, XCircle, Shield,
  Plus, Trash2, Send, CreditCard, Database, CheckCircle2, Star, Gift, Package, Upload, FileText, Download, Eye
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useTutorial } from "../context/TutorialContext"
import { api } from "../lib/api"

// ─── Helpers ───
function safeId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// ═══════════════════════════════════════════════
// Product Catalog
// ═══════════════════════════════════════════════
const PRODUCT_CATALOG = [
  { id: "vip", name: "VIP账号", type: "账号", unitPrice: "4800/年", desc: "基础VIP招聘账号", icon: "👑", pointsCost: 5 },
  { id: "vvip-select", name: "VVIP账号-精选版", type: "账号", unitPrice: "8000/年", desc: "精选人才推荐", icon: "💎", pointsCost: 10 },
  { id: "vvip-exposure", name: "VVIP账号-曝光版", type: "账号", unitPrice: "8000/年", desc: "高曝光招聘位", icon: "🚀", pointsCost: 10 },
  { id: "top-card", name: "置顶卡", type: "道具", unitPrice: "498/张", desc: "职位置顶曝光", icon: "📌", pointsCost: 3 },
  { id: "bomb-pro", name: "牛人炸弹Pro", type: "道具", unitPrice: "198/张", desc: "精准触达牛人", icon: "💣", pointsCost: 2 },
  { id: "search-card", name: "搜索畅聊卡", type: "道具", unitPrice: "328/张", desc: "无限搜索沟通", icon: "🔍", pointsCost: 2 },
  { id: "refresh-pro", name: "曝光刷新卡Pro", type: "道具", unitPrice: "388/张", desc: "职位曝光刷新", icon: "🔄", pointsCost: 2 },
]

// ─── localStorage helpers ───
function getUserPoints(userName: string, userPhone: string, userUsername?: string): number {
  const key = userPhone ? `${userName}-${userPhone}` : `${userName}-${userUsername || ""}`
  try { return Number(localStorage.getItem(`boss-points-${key}`)) || 0 } catch { return 0 }
}

interface ExchangeOrder {
  id: string
  userName: string
  userPhone: string
  productName: string
  productId: string
  pointsCost: number
  quantity: number
  status: "pending" | "shipped" | "completed"
  shippedAccount?: string
  shippedDate?: string
  orderDate: string
}

function loadOrders(): ExchangeOrder[] {
  try { return JSON.parse(localStorage.getItem("boss-exchange-orders") || "[]") } catch { return [] }
}
function saveOrders(orders: ExchangeOrder[]) {
  localStorage.setItem("boss-exchange-orders", JSON.stringify(orders))
}

// ═══════════════════════════════════════════════
// BossExchangeView — BOSS 兑换页面
// ═══════════════════════════════════════════════
function BossExchangeView({ onExchanged }: { onExchanged?: () => void }) {
  const { user } = useAuth()
  const [points, setPoints] = useState(0)
  const [orders, setOrders] = useState<ExchangeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [exchanging, setExchanging] = useState(false)

  // 从云API获取积分和订单
  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [pointsData, ordersData] = await Promise.all([
        api.points.get(user.id),
        api.orders.list(),
      ])
      setPoints(pointsData.total || 0)
      setOrders(ordersData || [])
    } catch (e) {
      console.error("获取数据失败:", e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const myOrders = (orders || []).filter(o => o.userId === user?.id)
  const product = PRODUCT_CATALOG.find(p => p.id === selectedProduct)
  const totalCost = product ? product.pointsCost * quantity : 0

  const handleExchange = useCallback(async () => {
    if (!product || !user) return
    if (totalCost > points) return alert("姚币不足，无法兑换")
    setExchanging(true)
    try {
      await api.points.add(user.id, -totalCost, `兑换 ${product.name} x${quantity}`, "exchange")
      await api.orders.create({
        productId: product.id,
        productName: product.name,
        pointsCost: product.pointsCost,
        quantity,
      })
      setPoints(p => p - totalCost)
      const updated = await api.orders.list()
      setOrders(updated || [])
      setShowConfirm(false)
      setShowSuccess(true)
      onExchanged?.()
    } catch (e: any) {
      alert("兑换失败: " + (e.message || "请重试"))
    } finally {
      setExchanging(false)
    }
  }, [product, user, totalCost, points, quantity])

  return (
    <div className="space-y-6">
      {/* Points Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-7 w-7 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">我的姚币</p>
                <p className="text-4xl font-bold gradient-text">{points}</p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>姚币获取途径</p>
              <p>考试通过 +5 · 活跃使用 · 参与活动</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-500" />
          可兑换商品
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_CATALOG.map((p) => (
            <div key={p.id} id={p.id === "vip" ? "vip-exchange-card" : undefined}>
            <Card key={p.id} className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProduct === p.id ? "ring-2 ring-amber-400 shadow-lg" : ""
            } ${points < p.pointsCost ? "opacity-60" : ""}`}
            onClick={() => {
              if (points < p.pointsCost) { alert(`姚币不足！${p.name} 需要 ${p.pointsCost} 姚币，你当前只有 ${points} 姚币。考试通过可获得姚币。`); return }
              setSelectedProduct(p.id)
            }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{p.icon}</span>
                      <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                    </div>
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">¥{p.unitPrice}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-600">{p.pointsCost} 姚币</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Exchange Panel */}
      {selectedProduct && product && (
        <Card className="border-amber-200 dark:border-amber-800 relative z-[200000]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-500" />
              兑换 {product.name}
            </CardTitle>
            <CardDescription>
              {product.desc} · ¥{product.unitPrice} · {product.pointsCost} 姚币/份
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">数量：</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(q => q + 1)}>+</Button>
              </div>
              <div className="text-sm">
                合计：<span className="font-bold text-amber-600">{totalCost} 姚币</span>
              </div>
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 ml-auto"
                style={{ position: "relative", zIndex: 999999, pointerEvents: "auto" } as React.CSSProperties}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setShowConfirm(true); }}
                disabled={totalCost > points}
              >
                <Send className="h-4 w-4 mr-1" />
                {totalCost > points ? `姚币不足 (需${totalCost})` : "确认兑换"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Orders */}
      {myOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">我的兑换记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>姚币</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>发货信息</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.productName}</TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>{o.pointsCost * o.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={
                        o.status === "completed" ? "success" :
                        o.status === "shipped" ? "primary" : "secondary"
                      }>
                        {o.status === "pending" ? "待发货" : o.status === "shipped" ? "已发货" : "已完成"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.orderDate).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.shippedAccount ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-mono">{o.shippedAccount}</span>
                        </div>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认兑换</DialogTitle>
            <DialogDescription>
              确认使用 {totalCost} 姚币兑换 {quantity} 份 {product?.name}？
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={exchanging}>取消</Button>
            <Button variant="primary" onClick={handleExchange} disabled={exchanging || totalCost > points}>
              {exchanging ? "兑换中..." : <><CheckCircle2 className="h-4 w-4 mr-1" />确认兑换 ({totalCost} 姚币)</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              兑换成功！
            </DialogTitle>
            <DialogDescription className="text-center">
              已提交 {product?.name} 兑换申请，管理员审核后将为你分配账号。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button variant="primary" onClick={() => setShowSuccess(false)}>知道了</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════
// AdminOrderView — 管理员订单管理
// ═══════════════════════════════════════════════
function AdminOrderView() {
  const [orders, setOrders] = useState<ExchangeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [shipAccount, setShipAccount] = useState("")
  const [shipPassword, setShipPassword] = useState("")
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [showShipDialog, setShowShipDialog] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.orders.list()
      setOrders(data || [])
    } catch (e) {
      console.error("获取订单失败:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const openShipDialog = (id: string) => {
    setShippingId(id)
    setShipAccount("")
    setShipPassword("")
    setShowShipDialog(true)
  }

  const handleShip = useCallback(async () => {
    if (!shippingId || !shipAccount) return
    const accountInfo = `${shipAccount} / ${shipPassword || '无密码'}`
    try {
      await api.orders.ship(shippingId, accountInfo)
      setOrders(prev => prev.map(o =>
        o.id === shippingId ? { ...o, status: "shipped", shippedAccount: accountInfo } : o
      ))
      setShowShipDialog(false)
      setShippingId(null)
      setShipAccount("")
      setShipPassword("")
    } catch (e: any) {
      alert("发货失败: " + (e.message || ""))
    }
  }, [shippingId, shipAccount, shipPassword])

  const pendingOrders = orders.filter(o => o.status === "pending")
  const shippedOrders = orders.filter(o => o.status === "shipped" || o.status === "completed")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待处理 ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="shipped">已发货</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>暂无待处理订单</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>姚币</TableHead>
                      <TableHead>申请时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{o.userName}</p>
                            <p className="text-xs text-muted-foreground">{o.userPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{o.productName}</TableCell>
                        <TableCell>{o.quantity}</TableCell>
                        <TableCell>{o.pointsCost * o.quantity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(o.orderDate).toLocaleDateString("zh-CN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => openShipDialog(o.id)}>
                            <Send className="h-3.5 w-3.5 mr-1" />发货
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipped" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {shippedOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无已发货订单</div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>商品</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>发放账号</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippedOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.userName}</TableCell>
                      <TableCell>{o.productName}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell className="text-sm font-mono">{o.shippedAccount || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {o.orderDate ? new Date(o.orderDate).toLocaleDateString("zh-CN") : "-"}
                      </TableCell>
                      <TableCell><Badge variant="success">已发放</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 发货对话框 */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>发放账号</DialogTitle>
            <DialogDescription>填写 VIP 账号和密码，确认后申请者可在兑换记录中查看。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-sm font-medium mb-1.5">VIP 账号</p>
              <Input placeholder="请输入VIP账号" value={shipAccount} onChange={e => setShipAccount(e.target.value)} />
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">VIP 密码</p>
              <Input placeholder="请输入VIP密码" value={shipPassword} onChange={e => setShipPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>取消</Button>
            <Button onClick={handleShip} disabled={!shipAccount}>确认发放</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════
// BossResourceApply — BOSS 提交资源申请
// ═══════════════════════════════════════════════
const RESOURCE_TYPES = [
  { id: "license", name: "营业执照", desc: "企业营业执照副本", icon: "📋" },
  { id: "cert", name: "企业认证", desc: "BOSS平台企业认证", icon: "✅" },
  { id: "contract", name: "合同模板", desc: "标准劳动合同模板", icon: "📄" },
  { id: "other", name: "其他资源", desc: "其他BOSS平台资源", icon: "📦" },
]

function BossResourceApply({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchApps = useCallback(async () => {
    try {
      const data = await api.bossResources.applications()
      setApps(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  const handleApply = async () => {
    if (!selectedType) return alert("请选择资源类型")
    setSubmitting(true)
    try {
      await api.bossResources.apply({ resourceType: selectedType, reason })
      setSelectedType("")
      setReason("")
      await fetchApps()
      alert("申请已提交，等待管理员审批")
      onSubmitted?.()
    } catch (e: any) {
      alert("提交失败: " + (e.message || ""))
    } finally {
      setSubmitting(false)
    }
  }

  const myApps = apps.filter(a => a.userId === user?.id)

  return (
    <div className="space-y-6">
      {/* Apply Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">提交资源申请</CardTitle>
          <CardDescription>选择需要的BOSS资源，提交后由管理员审批分配</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">资源类型</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {RESOURCE_TYPES.map(r => (
                  <div key={r.id}
                    id={r.id === "license" ? "resource-type-license" : undefined}
                    className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      selectedType === r.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 hover:border-blue-300 dark:border-gray-700"
                    }`}
                    style={{ position: "relative", zIndex: 99999, pointerEvents: "auto" } as React.CSSProperties}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedType(r.id) }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                    {selectedType === r.id && <p className="text-xs text-blue-600 mt-1">✓ 已选择</p>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">申请说明</p>
              <textarea
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="请说明申请原因..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <button
              id="resource-submit-btn"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              style={{ position: "relative", zIndex: 999999, pointerEvents: "auto" } as React.CSSProperties}
              onMouseDown={(e) => { e.stopPropagation(); handleApply() }}
              disabled={submitting}
            >
              {submitting ? "提交中..." : "提交申请"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* My Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">我的申请记录</CardTitle>
        </CardHeader>
        <CardContent>
          {myApps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无申请记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>资源类型</TableHead>
                  <TableHead>申请说明</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>分配内容</TableHead>
                  <TableHead>申请时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myApps.map(a => {
                  let allocData: any = {}
                  try { allocData = JSON.parse(a.allocatedInfo || "{}") } catch {}
                  return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.resourceType === "license" ? "营业执照" : a.resourceType === "cert" ? "企业认证" : a.resourceType === "contract" ? "合同模板" : a.resourceType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.reason || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "allocated" ? "success" : "secondary"}>
                        {a.status === "pending" ? "待审批" : "已分配"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.status === "allocated" && allocData.file ? (
                        <a href={allocData.file} download={allocData.fileName || "download"} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Download className="h-3.5 w-3.5" />
                          {allocData.fileName || "下载附件"}
                        </a>
                      ) : (
                        <span>{allocData.info || a.allocatedInfo || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.applyDate ? new Date(a.applyDate).toLocaleDateString("zh-CN") : "-"}
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════
// AdminResourceView — 管理员资源审批
// ═══════════════════════════════════════════════
function AdminResourceView() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [allocId, setAllocId] = useState<string | null>(null)
  const [allocInfo, setAllocInfo] = useState("")
  const [allocFile, setAllocFile] = useState<string | null>(null)
  const [allocFileName, setAllocFileName] = useState("")
  const [showAllocDialog, setShowAllocDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchApps = useCallback(async () => {
    try {
      const data = await api.bossResources.applications()
      setApps(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("文件不能超过10MB"); return }
    setAllocFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setAllocFile(reader.result as string)
    reader.readAsDataURL(file)
  }

  const openAllocDialog = (id: string) => {
    setAllocId(id)
    setAllocInfo("")
    setAllocFile(null)
    setAllocFileName("")
    setShowAllocDialog(true)
  }

  const handleAllocate = async () => {
    if (!allocId) return
    const payload: any = { info: allocInfo }
    if (allocFile) {
      payload.file = allocFile
      payload.fileName = allocFileName
    }
    try {
      await api.bossResources.allocate(allocId, JSON.stringify(payload))
      setApps(prev => prev.map(a => a.id === allocId ? { ...a, status: "allocated", allocatedInfo: JSON.stringify(payload) } : a))
      setShowAllocDialog(false)
      setAllocId(null)
      setAllocFile(null)
    } catch (e: any) {
      alert("分配失败: " + (e.message || ""))
    }
  }

  const pendingApps = apps.filter(a => a.status === "pending")
  const allocatedApps = apps.filter(a => a.status === "allocated")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待审批 ({pendingApps.length})</TabsTrigger>
          <TabsTrigger value="allocated">已分配</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pendingApps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无待审批申请</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>申请人</TableHead>
                      <TableHead>资源类型</TableHead>
                      <TableHead>申请说明</TableHead>
                      <TableHead>申请时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApps.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.userName}</TableCell>
                        <TableCell>{a.resourceType === "license" ? "营业执照" : a.resourceType === "cert" ? "企业认证" : a.resourceType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.reason || "-"}</TableCell>
                        <TableCell className="text-sm">{a.applyDate ? new Date(a.applyDate).toLocaleDateString("zh-CN") : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => openAllocDialog(a.id)}>分配</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="allocated" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申请人</TableHead>
                    <TableHead>资源类型</TableHead>
                    <TableHead>分配内容</TableHead>
                    <TableHead>附件</TableHead>
                    <TableHead>分配时间</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedApps.map(a => {
                    let allocData: any = {}
                    try { allocData = JSON.parse(a.allocatedInfo || "{}") } catch {}
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.userName}</TableCell>
                        <TableCell>{a.resourceType === "license" ? "营业执照" : a.resourceType}</TableCell>
                        <TableCell className="text-sm">{allocData.info || a.allocatedInfo || "-"}</TableCell>
                        <TableCell>
                          {allocData.file ? (
                            <a href={allocData.file} download={allocData.fileName || "download"} className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                              <Download className="h-3.5 w-3.5" />
                              {allocData.fileName || "下载附件"}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">{a.allocatedDate ? new Date(a.allocatedDate).toLocaleDateString("zh-CN") : "-"}</TableCell>
                        <TableCell><Badge variant="success">已分配</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                  {allocatedApps.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无已分配记录</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 分配对话框 — 支持文件上传 */}
      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分配资源</DialogTitle>
            <DialogDescription>上传文件并填写分配说明，提交后申请者即可查看。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* 文件上传 */}
            <div>
              <p className="text-sm font-medium mb-2">上传附件（营业执照等）</p>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
              {allocFile ? (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{allocFileName}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setAllocFile(null); setAllocFileName("") }}>移除</Button>
                  </div>
                  {allocFile.startsWith("data:image") && (
                    <img src={allocFile} alt="预览" className="mt-2 max-h-32 rounded object-contain" />
                  )}
                </div>
              ) : (
                <div
                  className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">点击或拖拽上传文件</p>
                  <p className="text-xs text-muted-foreground mt-1">支持图片、PDF，最大10MB</p>
                </div>
              )}
            </div>
            {/* 补充说明 */}
            <div>
              <p className="text-sm font-medium mb-2">补充说明</p>
              <textarea
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="输入分配说明..."
                value={allocInfo}
                onChange={e => setAllocInfo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowAllocDialog(false)}>取消</Button>
            <Button onClick={handleAllocate}>确认分配</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════
export default function ResourceManagement() {
  const { user } = useAuth()
  const tutorial = useTutorial()
  const isBoss = user?.role === "boss"
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">姚币商城</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isBoss ? "用姚币兑换VIP账号和道具资源" : "管理BOSS兑换订单，审批发货"}
        </p>
      </div>

      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources" id="resource-tab">资源申请</TabsTrigger>
          <TabsTrigger value="exchange" id="exchange-tab">姚币兑换</TabsTrigger>
        </TabsList>
        <TabsContent value="resources" className="mt-4">
          {isBoss ? <BossResourceApply onSubmitted={() => tutorial.goTo("exchange")} /> : <AdminResourceView />}
        </TabsContent>
        <TabsContent value="exchange" className="mt-4">
          {isBoss ? <BossExchangeView onExchanged={() => tutorial.next()} /> : <AdminOrderView />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
