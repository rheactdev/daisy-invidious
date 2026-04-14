import { useState } from "react";
import { SearchIcon } from "./icons/SearchIcon";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label className="input input-bordered flex items-center gap-2 flex-1">
        <SearchIcon size={18} className="opacity-50" />
        <input
          type="search"
          className="grow"
          placeholder="Search videos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
