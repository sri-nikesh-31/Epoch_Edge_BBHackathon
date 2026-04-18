import { useGetPolicy, getGetPolicyQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Users, Tag, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PolicyDetail({ id }: { id: number }) {
  const { data: policy, isLoading, error } = useGetPolicy(id, { query: { enabled: !!id, queryKey: getGetPolicyQueryKey(id) } });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading policy...</div>;
  if (error || !policy) return <div className="p-8 text-center text-destructive">Failed to load policy.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Analytics
        </Button>
      </Link>

      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1 px-3 py-1">
            <Tag className="w-3 h-3" />
            {policy.category}
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1">
            <Users className="w-3 h-3" />
            {policy.affectedGroup}
          </Badge>
          <Badge variant={policy.impactLevel === 'high' ? 'destructive' : policy.impactLevel === 'medium' ? 'default' : 'secondary'} className="px-3 py-1 capitalize">
            {policy.impactLevel} Impact
          </Badge>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-primary">{policy.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(policy.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {policy.circularNumber && (
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Circular: {policy.circularNumber}
            </div>
          )}
        </div>
      </div>

      <Card className="border-secondary border-t-4">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-foreground/90">{policy.summary}</p>
        </CardContent>
      </Card>

      {policy.content && (
        <Card>
          <CardHeader>
            <CardTitle>Full Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{policy.content}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
