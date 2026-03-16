import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  IconSearch,
  IconHome,
  IconNetwork,
  IconPlus,
  IconFileText,
} from "@tabler/icons-react";
import { SearchEntities } from "@wailsjs/go/app/App";
import { db } from "@models";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<db.Entity[] | null>(null);

  useEffect(() => {
    if (search.length > 2) {
      SearchEntities(search, "")
        .then(setSearchResults)
        .catch(() => {});
    } else {
      setSearchResults(null);
    }
  }, [search]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "42rem",
        }}
      >
        <Command
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #E5E7EB",
            backgroundColor: "white",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #E5E7EB",
              padding: "0 1rem",
            }}
          >
            <IconSearch
              size={20}
              style={{ color: "#9CA3AF", marginRight: "0.75rem" }}
            />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              style={{
                width: "100%",
                padding: "1rem 0",
                outline: "none",
                fontSize: "1.125rem",
                border: "none",
              }}
              autoFocus
            />
          </div>
          <Command.List
            style={{ maxHeight: "400px", overflowY: "auto", padding: "0.5rem" }}
          >
            <Command.Empty
              style={{
                padding: "2rem 0",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "#6B7280",
              }}
            >
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" style={{ padding: "0.5rem" }}>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/"))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <IconHome size={16} style={{ color: "#4B5563" }} />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/search"))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <IconSearch size={16} style={{ color: "#4B5563" }} />
                <span>Search</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/graph"))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <IconNetwork size={16} style={{ color: "#4B5563" }} />
                <span>Graph View</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions" style={{ padding: "0.5rem" }}>
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/item/new?tab=detail"))
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <IconPlus size={16} style={{ color: "#4B5563" }} />
                <span>Create New Item</span>
              </Command.Item>
            </Command.Group>

            {searchResults && searchResults.length > 0 && (
              <Command.Group
                heading="Search Results"
                style={{ padding: "0.5rem" }}
              >
                {searchResults.slice(0, 10).map((item: db.Entity) => (
                  <Command.Item
                    key={item.id}
                    onSelect={() =>
                      runCommand(() => navigate(`/item/${item.id}?tab=detail`))
                    }
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <IconFileText
                      size={16}
                      style={{
                        color: "#4B5563",
                        marginTop: "0.125rem",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{item.primaryLabel}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          marginTop: "0.125rem",
                        }}
                      >
                        <span
                          style={{
                            padding: "0.125rem 0.5rem",
                            backgroundColor: "#F3F4F6",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {item.typeSlug}
                        </span>
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: "0.875rem",
                            color: "#4B5563",
                            marginTop: "0.25rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div
            style={{
              borderTop: "1px solid #E5E7EB",
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              color: "#6B7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#F9FAFB",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <kbd
                  style={{
                    padding: "0.125rem 0.375rem",
                    backgroundColor: "white",
                    border: "1px solid #D1D5DB",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                  }}
                >
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <kbd
                  style={{
                    padding: "0.125rem 0.375rem",
                    backgroundColor: "white",
                    border: "1px solid #D1D5DB",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                  }}
                >
                  ↵
                </kbd>
                <span>Select</span>
              </span>
            </div>
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <kbd
                style={{
                  padding: "0.125rem 0.375rem",
                  backgroundColor: "white",
                  border: "1px solid #D1D5DB",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                }}
              >
                ESC
              </kbd>
              <span>Close</span>
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
