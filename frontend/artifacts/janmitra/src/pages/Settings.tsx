import { useUserPreferences } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatMessageRequestLanguage, ChatMessageRequestUserType } from "@workspace/api-client-react";

export default function Settings() {
  const { language, userType, setLanguage, setUserType } = useUserPreferences();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-primary">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Language Preferences</CardTitle>
          <CardDescription>Select your preferred language for chatbot responses and content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as ChatMessageRequestLanguage)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ChatMessageRequestLanguage).map(l => (
                <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>We use this to tailor policy summaries to your situation.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={userType} onValueChange={(v) => setUserType(v as ChatMessageRequestUserType)}>
            <div className="grid gap-4 pt-2">
              {Object.values(ChatMessageRequestUserType).map(t => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} />
                  <Label htmlFor={t} className="capitalize text-base cursor-pointer">{t}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
