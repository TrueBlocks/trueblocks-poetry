import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Tabs } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Network } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import ItemDetail from "./ItemDetail";
import Graph from "./Graph";
import ItemEdit from "./ItemEdit";
import { GetSettings } from "@wailsjs/go/main/App.js";
import { GetEntity, SearchEntities } from "@wailsjs/go/services/EntityService";
import { useUIStore } from "@stores/useUIStore";
import { LogError } from "@utils/logger";

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  useQueryClient();
  const isNewEntity = id === "new";
  const { setLastWordId, tabSelections, setTabSelection } = useUIStore();

  useQuery({
    queryKey: ["allSettings"],
    queryFn: GetSettings,
  });

  const { data: entity, error } = useQuery({
    queryKey: ["entity", id],
    queryFn: () => GetEntity(Number(id)),
    enabled: !!id && !isNewEntity,
  });

  useEffect(() => {
    if (error && id && !isNewEntity) {
      SearchEntities("poetry", "")
        .then((results) => {
          const poetryEntity = results?.[0];
          if (poetryEntity) {
            setLastWordId(poetryEntity.id);
            navigate(
              `/item/${poetryEntity.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
              { replace: true },
            );
            notifications.show({
              title: "Item Not Found",
              message: "Previous item no longer exists, showing: poetry",
              color: "yellow",
            });
          }
        })
        .catch((err) => LogError(`Failed to save last word: ${err}`));
    }
  }, [error, id, isNewEntity, navigate, searchParams, setLastWordId]);

  useEffect(() => {
    if (entity?.id && id && !isNewEntity) {
      setLastWordId(Number(id));
    }
  }, [id, entity?.id, isNewEntity, setLastWordId]);

  const tabFromUrl = searchParams.get("tab");
  const editModeFromUrl = searchParams.get("edit") === "true";
  const activeTab = tabFromUrl || tabSelections["itemView"] || "detail";
  const [isEditMode, setIsEditMode] = useState(editModeFromUrl || isNewEntity);

  // Update edit mode when URL changes
  useEffect(() => {
    setIsEditMode(editModeFromUrl || isNewEntity);
  }, [editModeFromUrl, isNewEntity]);

  // Sync active tab to store
  useEffect(() => {
    if (activeTab && activeTab !== tabSelections["itemView"]) {
      setTabSelection("itemView", activeTab);
    }
  }, [activeTab, tabSelections, setTabSelection]);

  const handleTabChange = (value: string | null) => {
    if (value) {
      // Clear edit mode when switching tabs
      setSearchParams({ tab: value });
      setIsEditMode(false);
    }
  };

  const handleEnterEditMode = () => {
    setSearchParams({ tab: "detail", edit: "true" });
    setIsEditMode(true);
  };

  const handleExitEditMode = () => {
    setSearchParams({ tab: "detail" });
    setIsEditMode(false);
  };

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="detail" leftSection={<BookOpen size={16} />}>
          Detail
        </Tabs.Tab>
        <Tabs.Tab value="graph" leftSection={<Network size={16} />}>
          Graph
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="detail" pt="md">
        {isEditMode ? (
          <ItemEdit onSave={handleExitEditMode} onCancel={handleExitEditMode} />
        ) : (
          <ItemDetail onEnterEditMode={handleEnterEditMode} />
        )}
      </Tabs.Panel>

      <Tabs.Panel value="graph" pt="md">
        <Graph />
      </Tabs.Panel>
    </Tabs>
  );
}
