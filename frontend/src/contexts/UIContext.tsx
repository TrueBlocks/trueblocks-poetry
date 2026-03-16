import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { LogError } from "@utils/logger";
import { GetSettings, UpdateSettings, SaveLastWord } from "@wailsjs/go/app/App";

interface TableSort {
  field1: string;
  dir1: string;
  field2: string;
  dir2: string;
}

interface UIContextValue {
  sidebarWidth: number;
  lastWordId: number;
  lastView: string;
  lastTable: string;
  showMarked: boolean;
  revealMarkdown: boolean;
  outgoingCollapsed: boolean;
  incomingCollapsed: boolean;
  recentPathCollapsed: boolean;
  currentSearch: string;
  tabSelections: Record<string, string>;
  tableSorts: Record<string, TableSort>;

  setSidebarWidth: (width: number) => void;
  setLastWordId: (id: number) => void;
  setLastView: (view: string) => void;
  setLastTable: (table: string) => void;
  setShowMarked: (show: boolean) => void;
  setRevealMarkdown: (reveal: boolean) => void;
  setOutgoingCollapsed: (collapsed: boolean) => void;
  setIncomingCollapsed: (collapsed: boolean) => void;
  setRecentPathCollapsed: (collapsed: boolean) => void;
  setCurrentSearch: (search: string) => void;
  setTabSelection: (viewId: string, tabId: string) => void;
  setTableSort: (tableName: string, sort: TableSort) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

async function persistSettings(
  updates: Partial<{
    sidebarWidth: number;
    lastWordId: number;
    lastView: string;
    lastTable: string;
    showMarked: boolean;
    revealMarkdown: boolean;
    outgoingCollapsed: boolean;
    incomingCollapsed: boolean;
    recentPathCollapsed: boolean;
    currentSearch: string;
    tabSelections: Record<string, string>;
    tableSorts: Record<string, TableSort>;
  }>,
  prevLastWordId?: number,
) {
  try {
    const current = await GetSettings();

    if (updates.sidebarWidth !== undefined && current.window) {
      current.window.leftbarWidth = updates.sidebarWidth;
    }

    if (
      updates.lastWordId !== undefined &&
      updates.lastWordId !== prevLastWordId
    ) {
      await SaveLastWord(updates.lastWordId);
      current.lastWordId = updates.lastWordId;
    }

    if (updates.lastView !== undefined) current.lastView = updates.lastView;
    if (updates.lastTable !== undefined) current.lastTable = updates.lastTable;
    if (updates.showMarked !== undefined)
      current.showMarked = updates.showMarked;
    if (updates.revealMarkdown !== undefined)
      current.revealMarkdown = updates.revealMarkdown;
    if (updates.currentSearch !== undefined)
      current.currentSearch = updates.currentSearch;
    if (updates.tabSelections !== undefined)
      current.tabSelections = updates.tabSelections;
    if (updates.tableSorts !== undefined)
      current.tableSorts = updates.tableSorts;

    if (!current.collapsed) {
      current.collapsed = {
        outgoing: true,
        incoming: false,
        linkIntegrity: false,
        itemHealth: false,
        recentPath: true,
      };
    }
    if (updates.outgoingCollapsed !== undefined)
      current.collapsed.outgoing = updates.outgoingCollapsed;
    if (updates.incomingCollapsed !== undefined)
      current.collapsed.incoming = updates.incomingCollapsed;
    if (updates.recentPathCollapsed !== undefined)
      current.collapsed.recentPath = updates.recentPathCollapsed;

    await UpdateSettings(current);
  } catch (e) {
    LogError(`Failed to save settings: ${e}`);
  }
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidthState] = useState(260);
  const [lastWordId, setLastWordIdState] = useState(0);
  const [lastView, setLastViewState] = useState("dashboard");
  const [lastTable, setLastTableState] = useState("items");
  const [showMarked, setShowMarkedState] = useState(false);
  const [revealMarkdown, setRevealMarkdownState] = useState(false);
  const [outgoingCollapsed, setOutgoingCollapsedState] = useState(true);
  const [incomingCollapsed, setIncomingCollapsedState] = useState(false);
  const [recentPathCollapsed, setRecentPathCollapsedState] = useState(true);
  const [currentSearch, setCurrentSearchState] = useState("");
  const [tabSelections, setTabSelectionsState] = useState<
    Record<string, string>
  >({});
  const [tableSorts, setTableSortsState] = useState<Record<string, TableSort>>(
    {},
  );

  useEffect(() => {
    GetSettings()
      .then((s) => {
        if (!s) return;
        setSidebarWidthState(s.window?.leftbarWidth || 260);
        setLastWordIdState(s.lastWordId || 0);
        setLastViewState(s.lastView || "dashboard");
        setLastTableState(s.lastTable || "items");
        setShowMarkedState(s.showMarked || false);
        setRevealMarkdownState(s.revealMarkdown || false);
        setOutgoingCollapsedState(
          s.collapsed?.outgoing !== undefined ? s.collapsed.outgoing : true,
        );
        setIncomingCollapsedState(
          s.collapsed?.incoming !== undefined ? s.collapsed.incoming : false,
        );
        setRecentPathCollapsedState(
          s.collapsed?.recentPath !== undefined ? s.collapsed.recentPath : true,
        );
        setCurrentSearchState(s.currentSearch || "");
        setTabSelectionsState(s.tabSelections || {});
        setTableSortsState((s.tableSorts || {}) as Record<string, TableSort>);
      })
      .catch((e) => LogError(`Failed to load settings: ${e}`));
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    setSidebarWidthState(width);
    persistSettings({ sidebarWidth: width });
  }, []);

  const setLastWordId = useCallback((id: number) => {
    setLastWordIdState((prev) => {
      persistSettings({ lastWordId: id }, prev);
      return id;
    });
  }, []);

  const setLastView = useCallback((view: string) => {
    setLastViewState(view);
    persistSettings({ lastView: view });
  }, []);

  const setLastTable = useCallback((table: string) => {
    setLastTableState(table);
    persistSettings({ lastTable: table });
  }, []);

  const setShowMarked = useCallback((show: boolean) => {
    setShowMarkedState(show);
    persistSettings({ showMarked: show });
  }, []);

  const setRevealMarkdown = useCallback((reveal: boolean) => {
    setRevealMarkdownState(reveal);
    persistSettings({ revealMarkdown: reveal });
  }, []);

  const setOutgoingCollapsed = useCallback((collapsed: boolean) => {
    setOutgoingCollapsedState(collapsed);
    persistSettings({ outgoingCollapsed: collapsed });
  }, []);

  const setIncomingCollapsed = useCallback((collapsed: boolean) => {
    setIncomingCollapsedState(collapsed);
    persistSettings({ incomingCollapsed: collapsed });
  }, []);

  const setRecentPathCollapsed = useCallback((collapsed: boolean) => {
    setRecentPathCollapsedState(collapsed);
    persistSettings({ recentPathCollapsed: collapsed });
  }, []);

  const setCurrentSearch = useCallback((search: string) => {
    setCurrentSearchState(search);
    persistSettings({ currentSearch: search });
  }, []);

  const setTabSelection = useCallback((viewId: string, tabId: string) => {
    setTabSelectionsState((prev) => {
      const next = { ...prev, [viewId]: tabId };
      persistSettings({ tabSelections: next });
      return next;
    });
  }, []);

  const setTableSort = useCallback((tableName: string, sort: TableSort) => {
    setTableSortsState((prev) => {
      const next = { ...prev, [tableName]: sort };
      persistSettings({ tableSorts: next });
      return next;
    });
  }, []);

  const value: UIContextValue = {
    sidebarWidth,
    lastWordId,
    lastView,
    lastTable,
    showMarked,
    revealMarkdown,
    outgoingCollapsed,
    incomingCollapsed,
    recentPathCollapsed,
    currentSearch,
    tabSelections,
    tableSorts,
    setSidebarWidth,
    setLastWordId,
    setLastView,
    setLastTable,
    setShowMarked,
    setRevealMarkdown,
    setOutgoingCollapsed,
    setIncomingCollapsed,
    setRecentPathCollapsed,
    setCurrentSearch,
    setTabSelection,
    setTableSort,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return ctx;
}
