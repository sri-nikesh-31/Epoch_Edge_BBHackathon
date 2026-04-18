import { useGetDashboardSummary, useGetPoliciesByCategory, useGetPoliciesTimeline, useGetSectorImpact, useHealthCheck, useListPolicies } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Activity } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: byCategory, isLoading: loadingCategory } = useGetPoliciesByCategory();
  const { data: timeline, isLoading: loadingTimeline } = useGetPoliciesTimeline();
  const { data: sectorImpact, isLoading: loadingSector } = useGetSectorImpact();
  const { data: allPolicies } = useListPolicies();
  const { data: health } = useHealthCheck();

  // Safe array fallbacks — prevents crash when backend is unreachable
  const byCategoryData = Array.isArray(byCategory) ? byCategory : [];
  const timelineData = Array.isArray(timeline) ? timeline : [];
  const sectorImpactData = Array.isArray(sectorImpact) ? sectorImpact : [];
  const recentPolicies = Array.isArray(allPolicies) ? allPolicies :
    (Array.isArray(summary?.recentPolicies) ? summary!.recentPolicies : []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Analytics Dashboard</h1>
        {health && (
          <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
            <Activity className="w-3 h-3" />
            API Status: {health.status}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalPolicies || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.thisMonthPolicies || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.categoriesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Affected Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.affectedGroupsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Policies by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {byCategoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available — start the API server</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available — start the API server</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sector Impact</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {sectorImpactData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available — start the API server</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorImpactData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="percentage"
                    nameKey="sector"
                    label
                  >
                    {sectorImpactData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent Policies</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {recentPolicies.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-8">No policies found — start the API server</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPolicies.slice(0, 5).map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="whitespace-nowrap">{new Date(policy.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/policies/${policy.id}`} className="font-medium hover:underline text-primary">
                          {policy.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.impactLevel === 'high' ? 'destructive' : policy.impactLevel === 'medium' ? 'default' : 'secondary'}>
                          {policy.impactLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
