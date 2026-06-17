import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Upload, FileText, Download, CheckCircle2, Trophy } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"

// ─── Resource Types ───
const RESOURCE_TYPES = [
  { id: "license", name: "营业执照", desc: "企业营业执照副本", icon: "📋" },
  { id: "cert", name: "企业认证", desc: "BOSS平台企业认证", icon: "✅" },
  { id: "contract", name: "合同模板", desc: "标准劳动合同模板", icon: "📄" },
  { id: "other", name: "其他资源", desc: "其他BOSS平台资源", icon: "📦" },
]

// ═══════════════════════════════════════════════
// BossResourceApply — BOSS 提交资源申请
// ═══════════════════════════════════════════════
function BossResourceApply() {
  const { user } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
      setShowSuccess(true)
    } catch (e: any) {
      alert("提交失败: " + (e.message || ""))
    } finally {
      setSubmitting(false)
    }
  }

  const myApps = apps.filter(a => a.userId === user?.id)

  return (
    <>
      <div className="space-y-6">
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
                    className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      selectedType === r.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 hover:border-blue-300 dark:border-gray-700"
                    }`}
                    onClick={() => setSelectedType(r.id)}
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
            <Button variant="primary" onClick={handleApply} disabled={submitting}>
              {submitting ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* 教程完成弹窗 */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg animate-scale-in">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-xl animate-fade-in">🎉 教程完成！</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 p-4 animate-scale-in">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">新手教程已完成！</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  恭喜你已完成新手教程，后续可以用姚币兑换VIP账号和道具！
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => setShowSuccess(false)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />确定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ═══════════════════════════════════════════════
// AdminResourceView — 超管/管理员审批资源
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
    if (allocFile) { payload.file = allocFile; payload.fileName = allocFileName }
    try {
      await api.bossResources.allocate(allocId, JSON.stringify(payload))
      setApps(prev => prev.map(a => a.id === allocId ? { ...a, status: "allocated", allocatedInfo: JSON.stringify(payload) } : a))
      setShowAllocDialog(false)
      setAllocId(null)
      setAllocFile(null)
    } catch (e: any) { alert("分配失败: " + (e.message || "")) }
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
                              <Download className="h-3.5 w-3.5" />{allocData.fileName || "下载附件"}
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

      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分配资源</DialogTitle>
            <DialogDescription>上传文件并填写分配说明</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-sm font-medium mb-2">上传附件</p>
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
                  {allocFile.startsWith("data:image") && <img src={allocFile} alt="预览" className="mt-2 max-h-32 rounded object-contain" />}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center cursor-pointer hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">点击或拖拽上传文件</p>
                  <p className="text-xs text-muted-foreground mt-1">支持图片、PDF，最大10MB</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">补充说明</p>
              <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" rows={2} placeholder="输入分配说明..." value={allocInfo} onChange={e => setAllocInfo(e.target.value)} />
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

export default function ResourceApplication() {
  const { user } = useAuth()
  const isBoss = user?.role === "boss"
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">资源申请</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isBoss ? "选择需要的BOSS资源，提交申请" : "管理资源申请，审批分配"}
        </p>
      </div>
      {isBoss ? <BossResourceApply /> : <AdminResourceView />}
    </div>
  )
}
