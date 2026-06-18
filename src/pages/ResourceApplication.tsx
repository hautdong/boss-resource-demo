import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Upload, FileText, Download, CheckCircle2, Trophy, Clock, Search, AlertCircle, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useTutorial } from "../context/TutorialContext"
import { api } from "../lib/api"
import { loadApplications, saveApplication, updateApplication, type ResourceApplication } from "../lib/resourceStorage"
import { addNotification } from "../lib/notifications"

// ─── Resource Types ───
const RESOURCE_TYPES = [
  { id: "license", name: "营业执照", desc: "企业营业执照副本", icon: "📋" },
  { id: "cert", name: "企业认证", desc: "BOSS平台企业认证", icon: "✅" },
  { id: "contract", name: "合同模板", desc: "标准劳动合同模板", icon: "📄" },
  { id: "other", name: "其他资源", desc: "其他BOSS平台资源", icon: "📦" },
]

function getResourceName(typeId: string): string {
  return RESOURCE_TYPES.find((r) => r.id === typeId)?.name || typeId
}

// ═══════════════════════════════════════════════
// BossResourceApply — BOSS 提交资源申请
// ═══════════════════════════════════════════════
function BossResourceApply() {
  const { user } = useAuth()
  const tutorial = useTutorial()
  const [apps, setApps] = useState<ResourceApplication[]>([])
  const [selectedType, setSelectedType] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchApps = useCallback(() => {
    const all = loadApplications()
    setApps(all.filter((a) => a.userId === user?.id))
  }, [user?.id])

  useEffect(() => { fetchApps() }, [fetchApps])

  const handleApply = async () => {
    if (!user) return
    if (!selectedType) {
      alert("请选择资源类型")
      return
    }
    if (!reason.trim()) {
      alert("请填写申请说明")
      return
    }

    setSubmitting(true)
    try {
      // Save to localStorage
      const app: ResourceApplication = {
        id: "app_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
        userId: user.id,
        userName: user.name,
        userPhone: user.username,
        userDepartment: user.department,
        resourceType: selectedType,
        reason: reason.trim(),
        status: "pending",
        applyDate: new Date().toISOString(),
      }
      saveApplication(app)

      // Try API in background (fail silently)
      api.bossResources.apply({ resourceType: selectedType, reason: reason.trim() }).catch(() => {})

      setSelectedType("")
      setReason("")
      fetchApps()
      setShowSuccess(true)
    } catch (e: any) {
      alert("提交失败: " + (e.message || ""))
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinishTutorial = () => {
    setShowSuccess(false)
    if (tutorial.state.enabled) {
      tutorial.finish()
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* ── Submit Application Card ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">提交资源申请</CardTitle>
                <CardDescription>选择需要的BOSS资源，提交后由管理员审批分配</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{apps.filter(a => a.status === "pending").length} 条待审批</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Resource Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">资源类型 <span className="text-destructive">*</span></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {RESOURCE_TYPES.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                        selectedType === r.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "border-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-accent/30"
                      }`}
                      onClick={() => setSelectedType(r.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{r.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                        {selectedType === r.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium mb-2 block">申请说明 <span className="text-destructive">*</span></label>
                <textarea
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  rows={3}
                  placeholder="请详细说明申请原因及用途..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button variant="primary" className="w-full sm:w-auto" onClick={handleApply} disabled={submitting}>
                {submitting ? "提交中..." : "提交申请"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── My Application History ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">我的申请记录</CardTitle>
            <CardDescription>共 {apps.length} 条申请记录</CardDescription>
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">暂无申请记录</p>
                <p className="text-xs text-muted-foreground mt-1">提交资源申请后，记录将显示在此处</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                    {apps.map((a) => {
                      let allocData: any = {}
                      try { allocData = JSON.parse(a.allocatedInfo || "{}") } catch {}
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{getResourceName(a.resourceType)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={a.reason}>
                            {a.reason || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.status === "allocated" ? "success" : "secondary"}>
                              {a.status === "pending" ? "待审批" : "已分配"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {a.status === "allocated" && allocData.file ? (
                              <a
                                href={allocData.file}
                                download={allocData.fileName || "download"}
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <Download className="h-3.5 w-3.5" />
                                {allocData.fileName || "下载附件"}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">
                                {a.allocatedInfo ? (allocData.info || "已分配") : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {a.applyDate ? new Date(a.applyDate).toLocaleDateString("zh-CN") : "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Success Dialog ── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg animate-scale-in">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-xl animate-fade-in">🎉 申请已提交！</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 p-4 animate-scale-in">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">申请已提交给管理员</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  请耐心等待管理员审批分配，审批完成后可在申请记录中查看结果。
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Button variant="primary" className="w-full" size="lg" onClick={handleFinishTutorial}>
              <CheckCircle2 className="h-4 w-4 mr-1" />知道了
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
  const [apps, setApps] = useState<ResourceApplication[]>([])
  const [allocId, setAllocId] = useState<string | null>(null)
  const [allocInfo, setAllocInfo] = useState("")
  const [allocFile, setAllocFile] = useState<string | null>(null)
  const [allocFileName, setAllocFileName] = useState("")
  const [showAllocDialog, setShowAllocDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchApps = useCallback(() => {
    const all = loadApplications()
    setApps(all)
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("文件不能超过10MB")
      return
    }
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

  const handleAllocate = () => {
    if (!allocId) return
    const payload: any = { info: allocInfo }
    if (allocFile) {
      payload.file = allocFile
      payload.fileName = allocFileName
    }

    // Find the application being allocated
    const targetApp = apps.find((a) => a.id === allocId)

    updateApplication(allocId, {
      status: "allocated",
      allocatedInfo: JSON.stringify(payload),
      allocatedDate: new Date().toISOString(),
    })

    // Send notification to the applicant
    if (targetApp) {
      const resourceName = getResourceName(targetApp.resourceType)
      const allocDesc = allocInfo ? `（${allocInfo.slice(0, 50)}）` : ""
      addNotification({
        type: "resource",
        title: "资源已分配",
        message: `你的「${resourceName}」申请已审批通过${allocDesc}，请查看详情`,
        targetUser: targetApp.userPhone || targetApp.userName,
        targetUserName: targetApp.userName,
        targetUserPhone: targetApp.userPhone,
      })
    }

    // Try API in background
    api.bossResources.allocate(allocId, JSON.stringify(payload)).catch(() => {})

    setApps((prev) =>
      prev.map((a) =>
        a.id === allocId
          ? { ...a, status: "allocated" as const, allocatedInfo: JSON.stringify(payload), allocatedDate: new Date().toISOString() }
          : a
      )
    )
    setShowAllocDialog(false)
    setAllocId(null)
    setAllocFile(null)
    setAllocFileName("")
  }

  const pendingApps = apps.filter((a) => a.status === "pending")
  const allocatedApps = apps.filter((a) => a.status === "allocated")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              待审批
              {pendingApps.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-primary/10 text-xs font-medium text-primary px-1.5">
                  {pendingApps.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="allocated">
              已分配
              {allocatedApps.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({allocatedApps.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === "pending" && pendingApps.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setApps([])
                fetchApps()
              }}
              className="gap-1"
            >
              <Search className="h-3.5 w-3.5" />
              刷新
            </Button>
          )}
        </div>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {pendingApps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">暂无待审批申请</p>
                  <p className="text-xs text-muted-foreground mt-1">所有申请已处理完毕</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>申请人</TableHead>
                        <TableHead>部门</TableHead>
                        <TableHead>资源类型</TableHead>
                        <TableHead>申请说明</TableHead>
                        <TableHead>申请时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApps.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {a.userName?.charAt(0) || "?"}
                              </div>
                              <span className="font-medium">{a.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.userDepartment || "-"}</TableCell>
                          <TableCell>{getResourceName(a.resourceType)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={a.reason}>
                            {a.reason || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {a.applyDate ? new Date(a.applyDate).toLocaleDateString("zh-CN") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => openAllocDialog(a.id)}>
                              审批分配
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocated" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {allocatedApps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">暂无已分配记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {allocatedApps.map((a) => {
                        let allocData: any = {}
                        try { allocData = JSON.parse(a.allocatedInfo || "{}") } catch {}
                        return (
                          <TableRow key={a.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {a.userName?.charAt(0) || "?"}
                                </div>
                                <span className="font-medium">{a.userName}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getResourceName(a.resourceType)}</TableCell>
                            <TableCell className="text-sm max-w-[180px] truncate" title={allocData.info || ""}>
                              {allocData.info || a.allocatedInfo || "-"}
                            </TableCell>
                            <TableCell>
                              {allocData.file ? (
                                <a
                                  href={allocData.file}
                                  download={allocData.fileName || "download"}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  {allocData.fileName || "下载附件"}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {a.allocatedDate ? new Date(a.allocatedDate).toLocaleDateString("zh-CN") : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="success">已分配</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Allocation Dialog ── */}
      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>审批分配资源</DialogTitle>
            <DialogDescription>上传文件并填写分配说明，完成后将由申请人查看</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">上传附件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                onChange={handleFileChange}
                className="hidden"
              />
              {allocFile ? (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium truncate">{allocFileName}</span>
                    </div>
                    <button
                      onClick={() => { setAllocFile(null); setAllocFileName("") }}
                      className="shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {allocFile.startsWith("data:image") && (
                    <img src={allocFile} alt="预览" className="mt-2 max-h-32 rounded-md object-contain bg-background" />
                  )}
                </div>
              ) : (
                <div
                  className="rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">点击上传文件</p>
                  <p className="text-xs text-muted-foreground mt-1">支持图片、PDF、Word、Excel，最大10MB</p>
                </div>
              )}
            </div>

            {/* Allocation Info */}
            <div>
              <label className="text-sm font-medium mb-2 block">分配说明</label>
              <textarea
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                rows={2}
                placeholder="输入分配说明..."
                value={allocInfo}
                onChange={(e) => setAllocInfo(e.target.value)}
              />
            </div>

            {!allocInfo.trim() && !allocFile && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  建议填写分配说明或上传附件，以便申请人了解分配详情
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowAllocDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAllocate} disabled={!allocInfo.trim() && !allocFile}>
              确认分配
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════
// ResourceApplication — Page Entry
// ═══════════════════════════════════════════════
export default function ResourceApplication() {
  const { user } = useAuth()
  const isBoss = user?.role === "boss"
  const isAdmin = user?.role === "super_admin" || user?.role === "admin"

  // 刷新按钮 — 长按或点击清除教程缓存用（隐藏功能），未激活用户也显示引导
  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">资源申请</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isBoss ? "选择需要的BOSS资源，提交申请等待管理员审批分配" : "管理所有资源申请，审批并分配资源"}
        </p>
      </div>
      {isBoss ? <BossResourceApply /> : isAdmin ? <AdminResourceView /> : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">您没有权限访问资源申请模块</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
