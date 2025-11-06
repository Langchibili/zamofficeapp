import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHistories } from "../../Functions.js";

export default function History() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const list = await getHistories(
          "sort=createdAt:desc&pagination[limit]=20",
        );
        setItems(Array.isArray(list) ? list : []);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  return (
    <section className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Your recent activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="truncate">
                  <div className="font-medium truncate">{it.activity}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.activityBody}
                  </div>
                </div>
                <span className="text-xs rounded bg-secondary px-2 py-1">
                  {new Date(it.createdAt || Date.now()).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
