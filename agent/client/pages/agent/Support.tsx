import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/hooks/useAgentAuth";
import { motion } from "framer-motion";

export default function AgentSupport() {
  return (
    <ProtectedRoute>
      <motion.div
        className="min-h-screen p-4 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Zamoffice Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We’re here to help. Reach out to Zamoffice using the details
                below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Info label="Email" value="support@zamoffice.com" />
                <Info label="Phone" value="+260 97 000 0000" />
                <Info label="WhatsApp" value="+260 97 000 0000" />
                <Info label="Hours" value="Mon–Fri, 9:00–17:00 CAT" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="w-full sm:w-auto" asChild>
                  <a href="mailto:support@zamoffice.com">Email Support</a>
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" asChild>
                  <a href="tel:+260970000000">Call Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
