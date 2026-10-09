"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDrop } from "@/components/file-drop";
import { database } from "@/lib/db";
import { useDatabaseTransfer, useStorageStatus } from "@/lib/storage/react";

/**
 * Where the data lives, and the one way it moves: an export file out, an import file in. Export
 * and import are the whole data set — history and the remembered last conversion together.
 */
export function DataCard() {
  const status = useStorageStatus(database);
  const { state, exportToFile, importFromFile } = useDatabaseTransfer(database);
  const [note, setNote] = useState<string | null>(null);

  const doExport = async () => {
    setNote(null);
    await exportToFile();
  };

  const statusLine =
    state.kind === "working"
      ? "Working…"
      : state.kind === "imported"
        ? `Import finished: ${state.result.rows} rows added or updated.`
        : state.kind === "error"
          ? state.message
          : note
            ? note
            : status === "durable"
              ? "Conversions are saved in this browser and survive a reload."
              : status === "memory"
                ? "This browser is not keeping data — everything is lost when the tab closes."
                : "Checking storage…";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your data</CardTitle>
        <CardDescription>
          Everything is saved in this browser only — nothing is sent anywhere. Export a backup file to keep it or carry it to another device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {status === "memory" ? (
          <p className="text-sm text-destructive">
            This browser refused to keep data, so your conversions will be lost when the tab closes. Export a backup if you want to keep them.
          </p>
        ) : null}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="outline" onClick={() => void doExport()}>Export data</Button>
          <FileDrop
            accept="application/json,.json"
            label="Import data"
            onFiles={([file]) => {
              if (file) void importFromFile(file, "merge");
            }}
            className="sm:w-72"
          >
            <p className="text-xs text-muted-foreground">Adds rows from a backup file; nothing is deleted.</p>
          </FileDrop>
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground">{statusLine}</p>
      </CardContent>
    </Card>
  );
}
