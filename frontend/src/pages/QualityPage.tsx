import { useState } from 'react';
import { QualityOverview } from '../components/quality/QualityOverview';
import { QualityRules } from '../components/quality/QualityRules';
import { QualityViolations } from '../components/quality/QualityViolations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Quality Center</h1>
        <p className="text-muted-foreground">Monitor real-time payload schemas and inspect rule violations.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Quality Rules</TabsTrigger>
          <TabsTrigger value="violations">Violations (DLQ)</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <QualityOverview />
        </TabsContent>
        <TabsContent value="rules">
          <QualityRules />
        </TabsContent>
        <TabsContent value="violations">
          <QualityViolations />
        </TabsContent>
      </Tabs>
    </div>
  );
}
