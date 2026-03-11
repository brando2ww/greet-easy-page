import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminReport } from '@/hooks/useAdminReport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Zap, DollarSign, Clock, Users, Activity, Battery } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusLabels: Record<string, string> = {
  completed: 'Concluída',
  in_progress: 'Em andamento',
  failed: 'Falha',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  in_progress: 'secondary',
  failed: 'destructive',
};

const formatDuration = (min: number | null) => {
  if (min === null || min === undefined) return '—';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m > 0 ? ` ${m}min` : ''}`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const Relatorios = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useAdminReport();

  if (isLoading) {
    return (
      <ResponsiveLayout showBottomNav>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsiveLayout>
    );
  }

  if (error || !data) {
    return (
      <ResponsiveLayout showBottomNav>
        <div className="container mx-auto px-4 pt-6">
          <p className="text-destructive">Erro ao carregar relatórios.</p>
        </div>
      </ResponsiveLayout>
    );
  }

  const { summary, dailyData, byCharger, recentSessions, byUser } = data;

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 pt-6 pb-24">
          <h1 className="text-2xl font-bold text-foreground mb-6">Relatórios</h1>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="usage">Uso</TabsTrigger>
              <TabsTrigger value="revenue">Receita</TabsTrigger>
            </TabsList>

            {/* ===== VISÃO GERAL ===== */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Activity} label="Total de sessões" value={summary.totalSessions} />
                <KpiCard icon={Zap} label="Concluídas" value={summary.completedSessions} />
                <KpiCard icon={Battery} label="Energia (kWh)" value={summary.totalEnergy || '—'} />
                <KpiCard icon={DollarSign} label="Receita (R$)" value={summary.totalRevenue ? `R$ ${summary.totalRevenue.toFixed(2)}` : '—'} />
                <KpiCard icon={Clock} label="Duração média" value={formatDuration(summary.avgDurationMin)} />
                <KpiCard icon={Users} label="Usuários únicos" value={summary.uniqueUsers} />
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sessões por dia (30 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} className="text-xs" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip labelFormatter={(v: string) => new Date(v).toLocaleDateString('pt-BR')} />
                        <Bar dataKey="count" name="Sessões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== USO ===== */}
            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sessões recentes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Carregador</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSessions.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs">{formatDate(s.startedAt)}</TableCell>
                          <TableCell className="text-xs font-medium">{s.chargerName}</TableCell>
                          <TableCell className="text-xs">{s.userEmail}</TableCell>
                          <TableCell className="text-xs">{formatDuration(s.durationMin)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[s.status] || 'outline'} className="text-xs">
                              {statusLabels[s.status] || s.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Uso por carregador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byCharger} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Sessões" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== RECEITA ===== */}
            <TabsContent value="revenue" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={DollarSign} label="Receita total" value={summary.totalRevenue ? `R$ ${summary.totalRevenue.toFixed(2)}` : '—'} />
                <KpiCard icon={DollarSign} label="Média/sessão" value={summary.totalSessions > 0 && summary.totalRevenue ? `R$ ${(summary.totalRevenue / summary.totalSessions).toFixed(2)}` : '—'} />
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Por carregador</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carregador</TableHead>
                        <TableHead>Sessões</TableHead>
                        <TableHead>Duração média</TableHead>
                        <TableHead>Energia</TableHead>
                        <TableHead>Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byCharger.map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{c.name}</TableCell>
                          <TableCell className="text-xs">{c.count}</TableCell>
                          <TableCell className="text-xs">{formatDuration(c.avgDurationMin)}</TableCell>
                          <TableCell className="text-xs">{c.energy || '—'} kWh</TableCell>
                          <TableCell className="text-xs">{c.revenue ? `R$ ${c.revenue.toFixed(2)}` : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Por usuário</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Sessões</TableHead>
                        <TableHead>Duração média</TableHead>
                        <TableHead>Energia</TableHead>
                        <TableHead>Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byUser.map((u: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{u.name || u.email}</TableCell>
                          <TableCell className="text-xs">{u.count}</TableCell>
                          <TableCell className="text-xs">{formatDuration(u.avgDurationMin)}</TableCell>
                          <TableCell className="text-xs">{u.energy || '—'} kWh</TableCell>
                          <TableCell className="text-xs">{u.revenue ? `R$ ${u.revenue.toFixed(2)}` : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

const KpiCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default Relatorios;
