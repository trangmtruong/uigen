import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state: "call" | "result" = "result",
  result: any = "Success"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result };
  }
  return { toolCallId: "1", toolName, args, state };
}

// str_replace_editor label tests
test("shows 'Creating' label for create command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/components/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Editing' label for insert command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "insert",
        path: "/components/Button.jsx",
      })}
    />
  );
  expect(screen.getByText("Editing Button.jsx")).toBeDefined();
});

test("shows 'Viewing' label for view command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "/index.js",
      })}
    />
  );
  expect(screen.getByText("Viewing index.js")).toBeDefined();
});

test("shows 'Undoing edit to' label for undo_edit command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "undo_edit",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Undoing edit to App.jsx")).toBeDefined();
});

// file_manager label tests
test("shows 'Renaming' label for rename command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "/components/OldName.jsx",
      })}
    />
  );
  expect(screen.getByText("Renaming OldName.jsx")).toBeDefined();
});

test("shows 'Deleting' label for delete command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "delete",
        path: "/components/unused.jsx",
      })}
    />
  );
  expect(screen.getByText("Deleting unused.jsx")).toBeDefined();
});

// Fallback
test("falls back to raw tool name for unknown tool", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("unknown_tool", {})}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

// Visual state tests
test("shows green dot when completed", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "result",
        "Success"
      )}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when in progress", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "call"
      )}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
