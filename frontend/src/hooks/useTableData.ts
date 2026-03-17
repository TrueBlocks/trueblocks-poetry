import { useState, useEffect, useCallback } from "react";
import { GetAllSources, GetSettings, RunAdHocQuery } from "@wailsjs/go/app/App";
import {
  GetAllEntities,
  GetAllRelationships,
} from "@wailsjs/go/services/EntityService";
import { db } from "@models";
import { TableData } from "@/components/Tables/tableTypes";

export function useTableData(
  selectedTable: string,
  isSqlSearch: boolean,
  debouncedSearchQuery: string,
  searchInitialized: React.MutableRefObject<boolean>,
  setSearchQuery: (q: string) => void,
) {
  const [settings, setSettings] = useState<Awaited<
    ReturnType<typeof GetSettings>
  > | null>(null);
  const [allEntities, setAllEntities] = useState<db.Entity[] | null>(null);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [allLinks, setAllLinks] = useState<db.Relationship[] | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);
  const [allSources, setAllSources] = useState<unknown[] | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [adHocResults, setAdHocResults] = useState<TableData[] | null>(null);
  const [adHocLoading, setAdHocLoading] = useState(false);
  const [adHocError, setAdHocError] = useState<string | null>(null);
  const [clichesData, setClichesData] = useState<TableData[] | null>(null);
  const [clichesLoading, setClichesLoading] = useState(false);
  const [namesData, setNamesData] = useState<TableData[] | null>(null);
  const [namesLoading, setNamesLoading] = useState(false);
  const [literaryTermsData, setLiteraryTermsData] = useState<
    TableData[] | null
  >(null);
  const [literaryTermsLoading, setLiteraryTermsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      GetSettings()
        .then(setSettings)
        .catch(() => {});
    };
    loadSettings();
    const interval = setInterval(loadSettings, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (settings?.currentSearch !== undefined && !searchInitialized.current) {
      setSearchQuery(settings.currentSearch);
      searchInitialized.current = true;
    }
  }, [settings, searchInitialized, setSearchQuery]);

  useEffect(() => {
    setEntitiesLoading(true);
    GetAllEntities()
      .then(setAllEntities)
      .catch(() => {})
      .finally(() => setEntitiesLoading(false));

    setLinksLoading(true);
    GetAllRelationships()
      .then(setAllLinks)
      .catch(() => {})
      .finally(() => setLinksLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTable === "sources") {
      setSourcesLoading(true);
      GetAllSources()
        .then((s) => setAllSources(s as unknown as unknown[]))
        .catch(() => {})
        .finally(() => setSourcesLoading(false));
    }
  }, [selectedTable]);

  const loadAdHocData = useCallback(() => {
    if (selectedTable === "adhoc" && isSqlSearch) {
      setAdHocLoading(true);
      setAdHocError(null);
      RunAdHocQuery(debouncedSearchQuery)
        .then(setAdHocResults)
        .catch((e: Error) => setAdHocError(e.message))
        .finally(() => setAdHocLoading(false));
    }
  }, [selectedTable, isSqlSearch, debouncedSearchQuery]);

  useEffect(() => {
    loadAdHocData();
  }, [loadAdHocData]);

  useEffect(() => {
    if (selectedTable === "cliches") {
      setClichesLoading(true);
      RunAdHocQuery("SELECT * FROM cliches")
        .then(setClichesData)
        .catch(() => {})
        .finally(() => setClichesLoading(false));
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable === "names") {
      setNamesLoading(true);
      RunAdHocQuery("SELECT * FROM names")
        .then(setNamesData)
        .catch(() => {})
        .finally(() => setNamesLoading(false));
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable === "literaryTerms") {
      setLiteraryTermsLoading(true);
      RunAdHocQuery("SELECT * FROM literary_terms")
        .then(setLiteraryTermsData)
        .catch(() => {})
        .finally(() => setLiteraryTermsLoading(false));
    }
  }, [selectedTable]);

  const isLoading =
    entitiesLoading ||
    linksLoading ||
    sourcesLoading ||
    adHocLoading ||
    clichesLoading ||
    namesLoading ||
    literaryTermsLoading;

  return {
    settings,
    allEntities,
    setAllEntities,
    allLinks,
    allSources,
    adHocResults,
    setAdHocResults,
    adHocError,
    clichesData,
    namesData,
    literaryTermsData,
    isLoading,
    loadAdHocData,
  };
}
